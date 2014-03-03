function Param(max) {
    this.current = max;
    this.max = max;
}
function Unit(owner, x, y) {
    this.locked = 0;
    this.destination = null;
    this.path = [];
    this.owner = owner;

    this.hex = null;
    this.x = x;
    this.y = y;

    if (x != undefined && y != undefined){
        this.setPosition(x, y);
    }

    this.texture = new Image();
    this.textureFire = new Image();
    this.ap = 1; //action points
    this.angle = (owner == game.player) ? 0 : 2; //for draw
    this.lastShot = {
        time: 0,
        damage: 0,
        x: 0,
        y: 0,
    };
    //TODO: use fps
    this.animSpeed = 1; //1e-2;
}

Unit.prototype = {
    size: SIZE / 2,
    canFly: false,
    armored: false,
    placeable: function() {
        return (this.hex && game.map.placeable(this.hex));
    },
    // placed: function() {
    //     return (this.owner.units.indexOf(this) != -1);
    // },
    remove: function() {
        this.removeFromMap();
        var index = this.owner.units.indexOf(this);
        if (index != -1)
            this.owner.units.splice(index, 1);
    },
    removeFromMap: function() {
        if (!this.hex)
            return;
        this.hex.unit = null;
        this.hex = null;
        this.x = undefined;
        this.y = undefined;
    },
    setHex: function(hex) {
        if (this.hex == hex)
            return;
        this.setPosition(hex.q, hex.r);
    },
    setPosition: function(x, y) {
        this.removeFromMap();
        this.hex = game.map.get(x, y);
        if (!this.hex)
            throw "Cannot find hex";
        if (this.hex.unit)
            throw "Trying to move to the occupied hex";
        this.hex.unit = this;
        this.x = this.hex.x;
        this.y = this.hex.y;
    },
    lock: function() {
        this.locked++;
        game.locked++;
    },
    unlock: function() {
        if (this.locked > 0) {
            this.locked--;
            game.locked--;
        }
    },
    setTexture: function(path) {
        if (this.texture.src != path) {
            this.texture.src = path;
            this.textureFire.src = path.replace(".png", "-fire.png");
        }
    },
    startTurn: function() {
        this.ap = 1;
    },
    endTurn: function() {
        if (this.ap != 0) {
            this.ap = 0;
            this.owner.ap--;
        }
    },
    draw: function() {
        if (!this.texture.width) {
            return;
        }

        this.update();
        var w = Math.round(Math.sqrt(3) * this.hex.size);
        var h = this.hex.size * 2;
        w = Math.min(this.texture.width, w);
        h = Math.min(this.texture.height, h);
        if (this.texture.width < this.hex.size * 2) {
            this.angle = 0;
        }
        ctx.drawImage(
            (this.lastShot.time + 300 > Date.now()) ? this.textureFire : this.texture,
            this.angle * w,
            0,
            w,
            h,
            this.x - w / 2,
            this.y - h / 2,
            w,
            h
        );

        if (!this.destination) {
            var stroke = "";
            if (this.ap > 0)
                stroke = (this.owner == game.player) ? "#0f0" : "#f00";
            else
                stroke = (this.owner == game.player) ? "#393" : "#933";

            this.hex.draw(null, {stroke: stroke, lineWidth: 3, padding: 3});
        }

        var x = this.x - this.size / 2;
        var y = this.y - this.size * 3/2;

        var hpHeight = 4;
        ctx.fillStyle = "#f00";
        ctx.fillRect(x, y, this.size, hpHeight);
        ctx.strokeStyle = "#000";
        ctx.strokeRect(x, y, this.size, hpHeight);

        ctx.fillStyle = "#0c0";
        ctx.fillRect(x, y, this.size * (this.hp.current / this.hp.max) , hpHeight);

    },
    drawDamage: function() {
        if (this.lastShot.time + 1500 > Date.now()) {
            ctx.fillStyle = (this.owner == game.player) ? "#0f0" : "#f00";
            ctx.fillText(this.lastShot.damage, this.lastShot.x, this.lastShot.y);
            this.lastShot.y -= 0.2;
        }
    },
    moveTo: function(hex) {
        if (hex.unit)
            return false;
        if (this.hex) {
            if(this.hex.distanceTo(hex) > this.speed)
                return false

            if (!this.canFly) {
                var reachable = game.map.reachable(this.hex, this.speed, true);
                if (reachable.indexOf(hex) == -1) {
                    return false;
                }
            }
            this.hex.unit = null;
        }

        this.destination = hex;
        if (!this.canFly) {
            this.path =  astar(this.hex, hex);
        }
        this.destination.unit = this;

        //this unit must be drawn last
        this.owner.units.sort(function(a, b) {
            return (a == this) ? +1 : 0;
        }.bind(this));

        this.lock();
        this.endTurn();
        return true;
    },
    updateAngle: function(hex) {
        var dx = hex.q - this.hex.q;
        if (Math.abs(dx) > 1)
            dx /= Math.abs(dx)
        var dy = hex.r - this.hex.r;
        if (Math.abs(dy) > 1)
            dy /= Math.abs(dy);

        var dirs = [
            [0, -1], [-1, 0], [-1, +1],
            [0, +1], [+1, 0], [+1, -1],
        ];

        for(var i = 0; i < 6; i++) {
            if (dirs[i][0] == dx && dirs[i][1] == dy) {
                this.angle = i;
                break;
            }
        }
    },
    update: function() {
        if (this.destination) {
            if (!this._next) {
                this.hex = game.map.global(this.x, this.y);
                if (this.canFly)
                    this._next = this.destination;
                else
                    this._next = this.path[Math.max(0, this.path.indexOf(this.hex) - 1)];
                this.updateAngle(this._next);
            }
            var dx = (this._next.x - this.x);
            var dy = (this._next.y - this.y);
            var distance = Math.sqrt(dx * dx + dy * dy);
            var speed = this.animSpeed * this.speed;

            if (Math.abs(dx) > speed)
                this.x += dx * speed / distance;
            else
                this.x = this._next.x;

            if (Math.abs(dy) > speed)
                this.y += dy * speed / distance;
            else
                this.y = this._next.y;

            if (this.x == this._next.x && this.y == this._next.y)
                this._next = null;

            if (this.x == this.destination.x && this.y == this.destination.y) {
                this.hex = this.destination;
                this.destination = null;
                this.unlock();
            }
        }
    },
    damageTo: function(unit) {
        var damage = (unit.armored) ? this.damage.heavy : this.damage.light;
        return damage;
    },
    fireTo: function(unit) {
        if (this.owner == unit.owner)
            return false;
        if (this.distanceTo(unit) > this.attackRadius)
            return false;

        var damage = this.damageTo(unit);
        unit.hp.current = Math.max(0, unit.hp.current - damage);

        this.lastShot = {
            time: Date.now(),
            damage: damage,
            x: unit.hex.x,
            y: unit.hex.y,
        };

        if (unit.hp.current <= 0)
            unit.destroy();
        this.endTurn();
        this.updateAngle(unit.hex);
        return true;
    },
    destroy: function() {
        this.owner.units.splice(this.owner.units.indexOf(this), 1);
        this.hex.unit = null;
    },
    distanceTo: function(unit) {
        return this.hex.distanceTo(unit.hex);
    },
    fireable: function() {
        return game.map.reachable(this.hex, this.attackRadius, false).filter(function(hex) {
            return (hex.unit && hex.unit.owner != this.owner &&
                    this.ap > 0 && this.damageTo(hex.unit) > 0);
        }.bind(this));
    },
    reachable: function() {
        return game.map.reachable(this.hex, this.speed, !this.canFly);
    },
    moveable: function() {
        if (this.ap > 0) {
            return this.reachable().filter(function(hex) {
                return (!hex.unit);
            });
        }
        return [];
    },
}


function Jeep() {
    Unit.apply(this, arguments);
    this.hp = new Param(4);
    this.speed = 6 ;
    this.damage = {
        light: 2,
        heavy: 0
    }
    this.attackRadius = 1;
    this.setTexture("assets/jeep.png");
}
util.extend(Jeep, Unit);

function Tank() {
    Unit.apply(this, arguments);
    this.hp = new Param(10);
    this.speed = 3;
    this.damage = {
        light: 1,
        heavy : 3
    };
    this.attackRadius = 1;
    this.armored = true;

    this.setTexture("assets/tank.png");
}
util.extend(Tank, Unit);

function PT() {
    Unit.apply(this, arguments);
    this.hp = new Param(3);
    this.speed = 2;
    this.damage = {
        light: 1,
        heavy :6
    };
    this.armored = true;
    this.attackRadius = 1;

    this.setTexture("assets/pt.png");
}
util.extend(PT, Unit);

function RocketLauncher() {
    Unit.apply(this, arguments);
    this.hp = new Param(7);
    this.speed = 2;
    this.damage = {
        light: 2,
        heavy: 2
    };
    this.attackRadius = 2; //-4 ?

    this.setTexture("assets/rocket-launcher.png");
}
util.extend(RocketLauncher, Unit);

function Helicopter() {
    Unit.apply(this, arguments);
    this.hp = new Param(5);
    this.speed = 5;
    this.damage = {
        light: 2,
        heavy: 1
    };
    this.attackRadius = 2;
    this.canFly = true;

    this.setTexture("assets/helicopter.png");
}
util.extend(Helicopter, Unit);

function AirDefense() {
    Unit.apply(this, arguments);
    this.hp = new Param(10);
    this.speed = 3;
    this.damage = {
        light: 3,
        heavy: 1
    };
    this.attackRadius = 2;
    this.setTexture("assets/air-defence.png");
}
util.extend(AirDefense, Unit);

function MobileCommandPost() {
    Unit.apply(this, arguments);
    this.hp = new Param(20);
    this.speed = 1;
    this.damage = {
        light: 0,
        heavy: 0
    };
    this.attackRadius = 0;
    this.armored = true;

    this.setTexture("assets/mobile-command-post.png");
}
util.extend(MobileCommandPost, Unit);
