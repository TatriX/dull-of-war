function Player(name) {
    this.name = name;
    this.units = [];
    this.ap = 0; //action points = this.units.length
};

Player.prototype = new function() {
    this.cmd = function(cmd) {
        switch(cmd) {
        case "pvp-start":
            game.setStage("prepare");
            break;
        default:
            console.error("Unknown cmd:" , cmd)
        }
    }

    this.startTurn = function() {
        this.ap = this.units.length;
        this.units.map(function(unit) {
            unit.startTurn();
        })
    };
    this.endTurn = function() {
        this.units.map(function(unit) {
            unit.startTurn();
        })
    }

    this.ai = function(callback) {
        var canFire = [];
        for(var i = 0, l = this.units.length; i < l; i++) {
            var fireable = this.units[i].fireable();
            if (fireable.length) {
                canFire.push({
                    unit: this.units[i],
                    fireable: fireable
                })
            }
        }
        if (canFire.length) {
            var powerfull = canFire.reduce(function(result, item) {
                return (result.unit.damage < item.unit.damage) ? item : result;
            }, canFire[0]);
            powerfull.unit.fireTo(powerfull.fireable[0].unit);
            console.log("fire");
        } else {
            var done = false;
            var tries = 0;
            var units = this.units.filter(function(unit) {
                return unit.ap > 0;
            });
            do {
                if (++tries > units.length * 100) {
                    console.warn("Tries break")
                    break;
                }
                var rand = Math.floor(Math.random() * units.length);
                var unit = units[rand];
                var moveable = unit.moveable();

                if (moveable.length == 0) {
                    console.log("Unit cannot move");
                    continue;
                }

                var southern = moveable.reduce(function(current, hex) {
                    return (current.r < hex.r) ? hex : current;
                }, moveable[0]);

                unit.moveTo(southern);
                done = true;
            } while(!done);
            console.log("move " + game.enemy.ap);
        }
        callback();
    }
}
