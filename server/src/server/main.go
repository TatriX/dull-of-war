package main

import (
	"fmt"
	"time"
)

const (
	MAX_CLIENTS = 100 //Столько клиентов мы готовы обслуживать одновременно
	MAX_FPS     = 60
	// Время в go измеряется в наносекундах
	// time.Second это количество наносекунд в секунде
	FRAME_DURATION = time.Second / MAX_FPS
)

var players map[string]*Player

func main() {
	players = make(map[string]*Player, MAX_CLIENTS)
	fmt.Println("Server started at ", time.Now())

	// Запускаем обработчик вебсокетов
	NanoHandler()
}
