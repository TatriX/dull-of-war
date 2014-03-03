var stage = {
    start: function() {
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
    },
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
};
