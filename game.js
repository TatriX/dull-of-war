var game = new function() {
    window.game = this;
    this.locked = 0;
    this.hovered = null;
    this.player = null;
    this.enemy = null;
    this.map = new Map(FIELD_SIZE);
    this.currentPlayer = null;
    this.cursorElement = null;

    this.stages = {};

    this.stage = null;

    this.selected =  {
        unit: null
    };

    /* functions */
    var loading = function() {
        Array.prototype.map.call(document.querySelectorAll(".stage"), function(stage) {
            stage.style.display = "none";
        });

        var loading = document.getElementById("loading");
        loading.style.display = "block";
    };

    this.setStage = function(name) {
        loading();

        this.stage = this.stages[name];
        if (this.stage)
            return;

        loadScript("stages/" + name + ".js", function onload() {
            this.stage = stage;
            var element = document.getElementById(name + "-stage");
            if (element)
                element.style.display = "block";

            this.stage.toString = function() {
                return name;
            };
            if (this.stage.start) {
                this.stage.start();
            }
        }.bind(this));
    };

    this.over = function() {
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
    };

    this.switchPlayer = function() {
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
    };

    this.draw = function() {
        if (!this.currentPlayer || !this.stage)
            return;

        document.getElementById("turn").innerHTML = "Turn: <b>" + this.currentPlayer.name + "</b>";


        if (this.stage.draw)
            this.stage.draw();

        // this.map.draw();

        // mapcall(this.player.units, 'draw');
        // mapcall(this.enemy.units, 'draw');

        // mapcall(this.player.units, 'drawDamage');
        // mapcall(this.enemy.units, 'drawDamage');
    };

    this.run = function() {
        requestAnimationFrame(function update(currentTime) {
            requestAnimationFrame(update);
            game.draw();
        });
    };

    /* construction */
    this.currentPlayer = this.player;

    loadScript("units.js");
    loadScript("events.js");
    this.setStage("login");
    this.run();
};
