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

// Ключами этого хэша будут имена персонажей
var characters map[string]*Character

func main() {
	characters = make(map[string]*Character, MAX_CLIENTS)
	fmt.Println("Server started at ", time.Now())

	// Запускаем обработчик вебсокетов
	NanoHandler()
}
