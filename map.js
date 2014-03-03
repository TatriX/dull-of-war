function Map(_N) {
    var data = {}
    var N = _N - 1;
    this.textures = {};

    this.loadTexture = function(name) {
        this.textures[name] = new Image();
        this.textures[name].src = "assets/" + name + ".png";
    }.bind(this);

    ['grass', 'sand', 'forest', 'road', 'water'].map(this.loadTexture);

    this.offset =  {
        x: 0,
        y: 0,
    }

    this.add = function(x, y) {
        if (!data[x])
            data[x] = {};
        data[x][y] = new Hexagon(x, y);

        var texture = this.textures.grass;
        if ((x <= 0 && y == -1) || (x >= 0 && y == 1) || x == 0 && y == 0)
            texture = this.textures.road;
        else if (y == 0)
            texture = this.textures.water;
        else if (x * y < -FIELD_SIZE)
            texture = this.textures.sand;
        else if (x * y > FIELD_SIZE / 2)
            texture = this.textures.forest;

        data[x][y].texture = texture;
    };

    this.get = function(x, y) {
        return (data[x] && data[x][y]) ? data[x][y] : null;
    };

    this.find = function(x, y) {
        x -= this.offset.x;
        y -= this.offset.y;
        return this.global(x, y);
    };

    this.global = function(x, y) {
        var q = (1/3 * Math.sqrt(3) * x - 1/3 * y) / SIZE;
        var r = 2/3 * y / SIZE;
        var axial = new Axial(q, r).toCube().round().toAxial();

        return this.get(axial.q, axial.r);
    };

    this.range = function(hex, range) {
        var list = [];
        for(var dx = -range; dx <= range; dx++) {
            for(var dy = -range; dy <= range; dy++) {
                for(var dz = -range; dz <= range; dz++) {
                    if (dx + dy + dz != 0)
                        continue;

                    var axial = new Cube(dx, dy, dz).toAxial();
                    var x = hex.q + axial.q;
                    var y = hex.r + axial.r;
                    if(!this.get(x, y))
                        continue;

                    list.push(this.get(x, y));
                }
            }
        }
        return list;
    };

    this.line = function(hex1, hex2) {
        var e = 1e-6;

        var A = hex1.toCube();
        var B = hex2.toCube();

        A.x += e;
        A.y += e;
        A.z -= 2*e;

        //+0.5 because we always want to include A to the list
        var N = A.distanceTo(B) + 0.5;
        var prev = null
        var list = [];
        for(var i = 0; i < N; i++) {
            var p = new Cube();
            p.x = A.x * (i/N) + B.x * (1 - i/N);
            p.y = A.y * (i/N) + B.y * (1 - i/N);
            p.z = A.z * (i/N) + B.z * (1 - i/N);
            p.round();
            if (!p.equals(prev)) {
                list.push(this.get(p.x, p.y));
                prev = p;
            }
        }
        return list;
    };

    this.reachable = function(startHex, range, checkCollision) {
        var visited = [startHex];
        var fringes = [[startHex]]

        for(var k = 1; k <= range; k++) {
            fringes[k] = [];
            for(var i = 0, l = fringes[k - 1].length; i < l; i++) {
                var neighbors = fringes[k - 1][i].neighbors();
                for(var n = 0, nl = neighbors.length; n < nl; n++) {
                    if (visited.indexOf(neighbors[n]) == -1 &&
                        (!checkCollision || !neighbors[n].unit)) {
                        visited.push(neighbors[n]);
                        fringes[k].push(neighbors[n])
                    }
                }
            }
        }
        return visited;
    };

    this.distance = function(hex1, hex2) {
        return hex1.distanceTo(hex2)
    };

    //for test
    this.drawNeighbors = function(hex) {
        hex.neighbors().map(function(hex) {
            hex.draw("#f00");
        });
    };

    this.drawPlaceable = function() {
        for(var x in data) {
            for(var y in data[x]) {
                if (!this.placeable(data[x][y]))
                    data[x][y].draw("rgba(0, 0, 0, 0.6)");
            }
        }
    };

    this.placeable =  function(hex) {
            return (hex && hex.r > FIELD_SIZE - 3);
    };

    var list = null;
    this.draw = function() {
        if (!list) {
            list = [];
            ctx.clearRect(-this.offset.x, -this.offset.y, canvas.width, canvas.height);
            for(var x in data) {
                for(var y in data[x]) {
                    var hex = data[x][y];
                    list.push(hex);
                }
            }
            list.sort(function(a, b) {
                return b.q - a.q;
            });
        }
        list.map(function(hex) {
            var fill = null;
            if (game.selected.unit && game.selected.unit == hex.unit) {
                fill = "rgba(200, 255, 255, 0.5)";
            } else if (hex == game.hovered) {
                fill = "rgba(255, 255, 200, 0.5)";
            }
            var options = {};
            options.texture = true;
            hex.draw(fill, options);
            // alert("P");
        });
    }

    /* init */
    for(var y = -N; y <= N; y++) {
        for(var x = -N; x <= N; x++) {
            if (Math.abs(x + y) > N)
                continue;
            this.add(x, y);
        }
    }

    this.resize = function() {
        canvas.width = parseInt(getComputedStyle(canvas).width);
        canvas.height =  parseInt(getComputedStyle(canvas).height);
        this.offset.x = canvas.width / 2;
        this.offset.y = canvas.height / 2;
        ctx.translate(this.offset.x, this.offset.y);
    }
    this.resize();
}
