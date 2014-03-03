package main

import (
	"code.google.com/p/go.net/websocket"
	"errors"
	"fmt"
)

type Auth struct {
	Login    string
	Password string
}

type PlayerStatus string

const (
	PLAYER_STATUS_LOBBY = "lobby"
)

type Player struct {
	Name         string
	Online       bool
	PlayerStatus string

	enemy *Player
	ws    *websocket.Conn
	auth  Auth
}

func (p *Player) login() error {
	if len(p.auth.Login) == 0 {
		return errors.New("login is empty")
	}
	if len(p.auth.Password) == 0 {
		return errors.New("password is empty")
	}
	if _, ok := players[p.auth.Login]; ok {
		return errors.New("already logged in")
	}
	p.Name = p.auth.Login
	players[p.Name] = p
	return nil
}

func (p *Player) sendMsg(name, msg string) {
	if p.ws == nil {
		fmt.Printf("Trying to send (%s => %s)to the nil ws (%s)\n",
			name, msg, p.Name)
		return
	}
	packet := make(packet)
	packet[name] = msg
	bytes, _, err := websocket.JSON.Marshal(packet)
	if err != nil {
		fmt.Println(err)
		return
	}

	if _, err := p.ws.Write(bytes); err != nil {
		fmt.Println(err)
	}

}

func (p *Player) sendCmd(cmd string) {
	p.sendMsg("cmd", cmd)
}

func (p *Player) sendWarn(warn string) {
	p.sendMsg("warn", warn)
}

func (p *Player) sendError(err string) {
	p.sendMsg("error", err)
}

func (p *Player) pvpRequest(from *Player) {
	p.enemy = from
	p.sendMsg("pvp-request", from.Name)
}

func (p *Player) denyPvpRequest() {
	p.enemy.sendMsg("pvp-deny", "Denied")
	p.enemy = nil
}

func (p *Player) startPvp() {
	p.enemy.sendCmd("pvp-start")
	p.sendCmd("pvp-start")
}
