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

type packet map[string]interface{}

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
			//Декодируем сообщение и получаем логин
			var auth = &player.auth
			websocket.JSON.Unmarshal(data, ws.PayloadType, auth)
			player.ws = ws
			if err := player.login(); err != nil {
				fmt.Println("Login failure: ", err)
				go sendError(ws, fmt.Sprintf("Cannot login: %s", err))
				continue
			}
			fmt.Println(player.Name, " logged in")
		case "pvp-request":
			var requested Player
			websocket.JSON.Unmarshal(data, ws.PayloadType, &requested)
			if len(requested.Name) == 0 {
				player.sendError("Enemy name is empty")
				continue
			}
			enemy, ok := players[requested.Name]
			if !ok {
				go player.sendError("Cannot find requested player")
				continue
			}
			enemy.pvpRequest(&player)
		case "pvp-accept":
			var accepted bool
			websocket.JSON.Unmarshal(data, ws.PayloadType, &accepted)
			if accepted {
				player.startPvp()
			} else {
				player.denyPvpRequest()
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
	packet := make(packet)
	packet["error"] = error
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
	packet := make(packet)
	packet["players"] = players
	//Кодируем его в json
	msg, _, err := websocket.JSON.Marshal(packet)
	if err != nil {
		fmt.Println(err)
		return
	}

	//И посылаем его всем подключенным клиентам
	for name, ws := range connections {
		if false {
			fmt.Println("Sending data to ", name)
		}
		if _, err := ws.Write(msg); err != nil {
			fmt.Println(err)
			return
		}
	}
}
