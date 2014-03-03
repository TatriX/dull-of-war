package main

import (
	"code.google.com/p/go.net/websocket"
	"fmt"
	"io"
	"net/http"
	"strings"
)

const (
	MAX_CMD_SIZE  = 1024
	MAX_OP_LEN    = 64
	CMD_DELIMITER = "|"
)

// Ключи — адреса клиентов вида ip:port
var connections map[string]*websocket.Conn

// Эту структуру мы будем сериализовать в json и передавать клиенту
type packet struct {
	Error string
}

//Настраиваем и запускаем обработку сетевых подключений
func NanoHandler() {
	connections = make(map[string]*websocket.Conn, MAX_CLIENTS)
	fmt.Println("Websocket handler started")
	http.Handle("/", websocket.Handler(NanoServer))
	err := http.ListenAndServe(":46666", nil)
	if err != nil {
		panic("ListenAndServe: " + err.Error())
	}
}

//Обрабатывает сетевое подключения
func NanoServer(ws *websocket.Conn) {
	//Памяти выделили под MAX_CLIENTS, поэтому цинично игнорируем тех на кого не хватает места
	if len(connections) >= MAX_CLIENTS {
		fmt.Println("Cannot handle more requests")
		return
	}

	//Получаем адрес клиента, например, 127.0.0.1:52655
	addr := ws.Request().RemoteAddr

	//Кладем соединение в таблицу
	connections[addr] = ws
	//Создаем нового персонажа, инициализируя его некоторыми стандартными значениями
	var player Player

	fmt.Printf("Client %s connected [Total clients connected: %d]\n", addr, len(connections))

	cmd := make([]byte, MAX_CMD_SIZE)
	for {
		//Читаем полученное сообщение
		n, err := ws.Read(cmd)

		//Клиент отключился
		if err == io.EOF {
			fmt.Printf("Client %s (%s) disconnected\n", player.Name, addr)
			//Удаляем его из таблиц
			delete(players, player.Name)
			delete(connections, addr)
			//И оповещаем подключенных клиентов о том, что игрок ушел
			go notifyClients()
			//Прерываем цикл и обработку этого соединения
			break
		}
		//Игнорируем возможные ошибки, пропуская дальнейшую обработку сообщения
		if err != nil {
			fmt.Println(err)
			continue
		}

		fmt.Printf("Received %d bytes from %s (%s): %s\n", n, player.Name, addr, cmd[:n])

		//Команды от клиента выглядят так: operation-name|{"param": "value", ...}
		//Поэтому сначала выделяем операцию
		opIndex := strings.Index(string(cmd[:MAX_OP_LEN]), CMD_DELIMITER)
		if opIndex < 0 {
			fmt.Println("Malformed command")
			continue
		}
		op := string(cmd[:opIndex])
		//После разделителя идут данные команды в json формате
		//Обратите внимание на то, что мы берем данные вплоть до n байт
		//Все что дальше — мусор, и если не отрезать лишнее,
		//мы получим ошибку декодирования json
		data := cmd[opIndex+len(CMD_DELIMITER) : n]

		//А теперь в зависимости от команды выполняем действия
		switch op {
		case "login":
			var name string
			//Декодируем сообщение и получаем логин
			websocket.JSON.Unmarshal(data, ws.PayloadType, &name)
			//Если такого персонажа нет онлайн
			if _, ok := players[name]; !ok && len(name) > 0 {
				//Авторизуем его
				player.Name = name
				players[name] = &player
				fmt.Println(name, " logged in")
			} else {
				//Иначе отправляем ему ошибку
				fmt.Println("Login failure: ", player.Name)
				go sendError(ws, "Cannot login. Try another name")
				continue
			}
		default:
			//Ой
			fmt.Printf("Unknown op: %s\n", op)
			continue
		}
		//И в конце оповещаем клиентов
		//Запуск оповещения в горутине позволяет нам сразу же обрабытывать следующие сообщения
		go notifyClients()
	}
}

//Оповещает клиента об ошибке
func sendError(ws *websocket.Conn, error string) {
	//Создаем пакет, у которого заполнено только поле ошибки
	packet := packet{Error: error}
	//Кодируем его в json
	msg, _, err := websocket.JSON.Marshal(packet)
	if err != nil {
		fmt.Println(err)
		return
	}

	//И отправляем клиенту
	if _, err := ws.Write(msg); err != nil {
		fmt.Println(err)
	}
}

//Оповещает всех подключенных клиентов
func notifyClients() {
	//Формируем пакет со списком всех подключенных персонажей
	packet := packet{}
	//Кодируем его в json
	msg, _, err := websocket.JSON.Marshal(packet)
	if err != nil {
		fmt.Println(err)
		return
	}

	//И посылаем его всем подключенным клиентам
	for _, ws := range connections {
		if _, err := ws.Write(msg); err != nil {
			fmt.Println(err)
			return
		}
	}
}
