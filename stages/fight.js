game.stages.fight = {
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
};
