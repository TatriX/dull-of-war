var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

function mapcall(list, callback) {
    list.map(function(item) {
        item[callback]();
    })
};

var game = {
    locked: 0,
    hovered: null,
    player: new Player("Player"),
    enemy: new Player("Enemy"),
    map: new Map(FIELD_SIZE),
    currentPlayer: null,
    cursorElement: null,
    setStage: function(stage) {
        this.stage = stage;
        if (this.stage.start)
            this.stage.start();
    },
    stages: {
        prepare: {
            mousedown: function(e) {
                if (!game.selected.unit && game.hovered && game.hovered.unit) {
                    game.selected.unit = game.hovered.unit;
                }

                if(e.target != game.canvas && !game.selected.unit)
                    return;

                if (e.button == 2) {
                    if (game.selected.unit) {
                        game.selected.unit.button.className = "";
                        game.selected.unit.remove();
                        game.selected.unit = null;
                    }
                    return;
                }

                if (!game.selected.unit ||
                    !game.selected.unit.hex ||
                    !game.selected.unit.placeable()) {
                    return;
                }
                if (game.player.units.indexOf(game.selected.unit) == -1) {
                    game.player.units.push(game.selected.unit);
                    game.selected.unit = null;
                } else {
                    game.selected.unit.remove();
                }
            },
            draw: function() {
                var unit = game.cursorElement && game.cursorElement.unit;
                if (unit && unit.hex)
                    unit.hex.draw(null, { stroke: "#00f", lineWidth: 3 });

                if (!game.selected.unit)
                    return;

                game.map.drawPlaceable();

                if (game.hovered && !game.hovered.unit) {
                        game.selected.unit.setHex(game.hovered);
                } else if (!game.hovered || game.hovered.unit != game.selected.unit) {
                    return game.selected.unit.removeFromMap();
                }

                game.hovered.draw(
                    (game.selected.unit.placeable() ? "rgba(0, 255, 0, 0.3)" : "rgba(255, 0, 0, 0.3")
                );
                game.selected.unit.draw();

            }
        },
        fight: {
            draw: function() {
                if (game.selected.unit) {
                    game.selected.unit.moveable().map(function(hex) {
                        hex.draw("rgba(200, 255, 255, 0.3)", {stroke: "#999"});
                    });

                    //attack radius
                    var fireable = game.selected.unit.fireable();
                    game.map.reachable(game.selected.unit.hex, game.selected.unit.attackRadius, false).map(function(hex) {
                        //highlight attack radius hex
                        if (!hex.unit) {
                            hex.draw("rgba(255, 0, 0, 0.1)");
                            return;
                        }
                        //don't highlight hex if there is a unit, which we cannot damage
                        if (fireable.indexOf(hex) == -1)
                            return;
                        //show that we can fire at this hex
                        hex.draw("rgba(255, 0, 0, 0.6)");
                    });

                    // if (game.hovered && !game.hovered.unit) {
                    //     var path = astar(game.selected.unit.hex, game.hovered);
                    //     path.map(function(hex) {
                    //         hex.draw(null, { stroke: "#000", lineWidth: 3 });
                    //     });
                    // }
                }
            },
            start: function() {
                game.selected.unit = null;
                var row = FIELD_SIZE - 1;
                var col = row;
                for(var i = 0; i < FIELD_SIZE; i++) {
                    if (i == Math.round(row / 2)) {
                        game.enemy.units.push(new MobileCommandPost(game.enemy, i, -col));
                    } else if (i > row / 2) {
                        game.enemy.units.push(new Helicopter(game.enemy, i, -col));
                    } else {
                        game.enemy.units.push(new AirDefense(game.enemy, i, -col));
                    }
                }
                for(var i = -1; i < FIELD_SIZE; i++) {
                    if (i + 1 > row * 3/4) {
                        game.enemy.units.push(new Tank(game.enemy, i, -col + 1));
                    } else if (i + 1 > row * 2/4) {
                        game.enemy.units.push(new Jeep(game.enemy, i, -col + 1));

                    } else if (i + 1 > row * 1/4) {
                        game.enemy.units.push(new PT(game.enemy, i, -col + 1));
                    } else {
                        game.enemy.units.push(new RocketLauncher(game.enemy, i, -col + 1));
                    }
                }
                game.currentPlayer = null;
                game.switchPlayer();
            },
            mousedown: function(e) {
                if (game.locked > 0)
                    return;
                if (game.currentPlayer != game.player)
                    return;
                if (e.button != 0)
                    return;
                var hex = game.map.find(e.clientX, e.clientY);
                if (!hex)
                    return;
                var unit = game.selected.unit
                if (unit) {

                    var done = false;
                    if (game.hovered.unit && game.hovered.unit != unit)
                        done = unit.fireTo(game.hovered.unit);
                    else
                        done = unit.moveTo(hex);

                    if (done) {
                        game.selected.unit = null;
                        if (game.over())
                            return;
                        if (game.currentPlayer.ap == 0)
                            game.switchPlayer()
                    }

                } else {
                    if (hex.unit && hex.unit.ap > 0 && game.currentPlayer == hex.unit.owner)
                        game.selected.unit = hex.unit;
                }
            },
            keydown: function(e) {
                switch(e.keyCode) {
                case 68: //d
                    game.player.ap = 0;
                    break;
                case 32: //space
                    if (game.selected.unit) {
                        game.selected.unit.endTurn();
                        game.selected.unit = null;
                    }
                    break;
                }
                if (game.currentPlayer.ap == 0)
                    game.switchPlayer()
            }
        },
    },
    stage: null,
    over: function() {
        var winner = null;
        if (this.enemy.units.length == 0)
            winner = this.player;
        else if (this.player.units.length == 0)
            winner = this.enemy;

        if (!winner)
            return false;

        alert("Gave over: " + ((winner == this.player) ? "You win" : "You lose"));
        this.currentPlayer = null;
        return true;
    },
    switchPlayer: function() {
        if (game.locked > 0) {
            setTimeout(this.switchPlayer.bind(this), 100);
            return;
        }
        if (this.currentPlayer)
            this.currentPlayer.endTurn();

        this.currentPlayer = (this.currentPlayer == this.player) ? this.enemy : this.player;
        this.currentPlayer.startTurn();

        if (this.currentPlayer == this.enemy) {
            var ai = function() {
                if (game.over())
                    return;
                if (this.enemy.ap > 0) {
                    this.enemy.ai(function() {
                        setTimeout(ai, 1000);
                    });
                } else {
                    this.switchPlayer();
                }
            }.bind(this);
            ai();
        }
    },
    selected: {
        unit: null
    },
    draw: function() {
        if (!this.currentPlayer)
            return;
        document.getElementById("turn").innerHTML = "Turn: <b>" + this.currentPlayer.name + "</b>";

        this.map.draw();
        this.stage.draw && this.stage.draw();
        mapcall(this.player.units, 'draw');
        mapcall(this.enemy.units, 'draw');

        mapcall(this.player.units, 'drawDamage');
        mapcall(this.enemy.units, 'drawDamage');
    },
};
game.currentPlayer = game.player;

game.stage = game.stages.prepare;
var startButton = document.createElement("button");
startButton.textContent = "Start!";
startButton.id = "start"
startButton.addEventListener('click', function() {
    if (game.player.units.length == 0) {
        alert("You need at least one unit to start");
        return false;
    }
    startButton.parentNode.removeChild(startButton);
    game.setStage(game.stages.fight);
});
document.body.appendChild(startButton);

(function() {
    var units = (function() {
        var units = [];
        units.push(new MobileCommandPost(game.player));

        units.push(new Helicopter(game.player));
        units.push(new Helicopter(game.player));

        units.push(new Tank(game.player));
        units.push(new Tank(game.player));
        units.push(new Tank(game.player));

        units.push(new Jeep(game.player));
        units.push(new Jeep(game.player));
        units.push(new Jeep(game.player));

        units.push(new AirDefense(game.player));
        units.push(new AirDefense(game.player));

        units.push(new PT(game.player));
        units.push(new PT(game.player));

        units.push(new RocketLauncher(game.player));
        units.push(new RocketLauncher(game.player));

        return units;
    })();

    var unitsList = document.createElement("ul");
    unitsList.id = "units-list";
    units.map(function(unit) {
        var item = document.createElement("li");
        var image = unit.texture.cloneNode();
        image.unit = unit;
        item.unit = unit;
        item.unit.button = item;
        item.addEventListener('click', function(e) {
            if (game.stage != game.stages.prepare || game.selected.unit)
                return;
            var unit = e.currentTarget.unit;
            unit.remove();
            unit.button.className = "selected";
            game.selected.unit = unit;
        });
        item.appendChild(image);
        unitsList.appendChild(item);
    });
    document.body.appendChild(unitsList);
})();

requestAnimationFrame(function update(currentTime) {
    game.draw();
    requestAnimationFrame(update);
});

window.addEventListener('resize', function() {
    game.map.resize();
    game.draw();
});

window.addEventListener('mousemove', function(e) {
    game.hovered = game.map.find(e.clientX, e.clientY);
    game.cursorElement = document.elementFromPoint(e.clientX, e.clientY);
});

window.addEventListener('keydown', function(e) { game.stage.keydown && game.stage.keydown(e) });

window.addEventListener('mousedown', function(e) { game.stage.mousedown && game.stage.mousedown(e) });

canvas.addEventListener('contextmenu', function(e) {
    game.selected.unit = false;
    e.preventDefault();
    return false;
});
