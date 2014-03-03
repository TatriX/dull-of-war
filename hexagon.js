function Cube(x, y, z) {
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
};

function Axial(q, r) {
    this.q = q || 0;
    this.r = r || 0;
}

Cube.prototype = {
    toAxial: function() {
        return new Axial(this.x, this.y);
    },
    round: function() {
        var rx = Math.round(this.x);
        var ry = Math.round(this.y);
        var rz = Math.round(this.z);

        var x_err = Math.abs(rx - this.x);
        var y_err = Math.abs(ry - this.y);
        var z_err = Math.abs(rz - this.z);

        if (x_err > y_err && x_err > z_err)
            rx = -ry - rz;
        else if (y_err > z_err)
            ry = -rx -rz;
        else
            rz = -rx-ry

        this.x = rx;
        this.y = ry;
        this.z = rz;
        return this;
    },
    equals: function(cube) {
        return cube && (this.x == cube.x && this.y == cube.y && this.z == cube.z);
    },
    distanceTo: function(cube) {
        return Math.max(
            Math.abs(this.x - cube.x), Math.abs(this.y - cube.y), Math.abs(this.z - cube.z)
        );
    },
}

Axial.prototype = {
    toCube: function() {
        return new Cube(this.q, this.r, -this.q - this.r);
    },
    distanceTo: function(axial) {
        return this.toCube().distanceTo(axial.toCube());
    },
    equals: function(hex) {
        return (this.q == hex.q && this.r == hex.r);
    }
}

function Hexagon(x, y, size) {
    this.c = new Axial(x, y);
    this.size = size || SIZE;
    this.unit = null;
    this.texture = null;
}

Hexagon.prototype = {
    get q() {
        return this.c.q;
    },
    get r() {
        return this.c.r;
    },
    get x() {
        return this.size * Math.sqrt(3) * (this.c.q + this.c.r / 2);
    },
    get y() {
        return this.size * 3/2 * this.c.r;
    },
    toCube: function() {
        return this.c.toCube();
    },
    drawRange: function(range) {
        game.map.drawRange(this, range);
    },
    distanceTo: function(hex) {
        return this.c.distanceTo(hex.c);
    },
    draw: function(fill, options, _ctx) {
        var ctx = _ctx || window.ctx;
        options = options || {};
        if (options.texture && this.texture.width) {
            ctx.drawImage(
                this.texture,
                this.x - Math.sqrt(3) / 2 * this.size,
                this.y - this.size
            );
        }

        var padding = options.padding || 0;
        ctx.beginPath();
        for (var i = 0; i < 6; i++) {
            var angle = 2 * Math.PI / 6 * (i + 0.5);
            var x_i = this.x + (this.size - padding) * Math.cos(angle);
            var y_i = this.y + (this.size - padding) * Math.sin(angle);


            if (i == 0)
                ctx.moveTo(x_i, y_i)
            else
                ctx.lineTo(x_i, y_i);
        }
        ctx.closePath();

        if (fill) {
            ctx.fillStyle = fill;
            ctx.fill();
        }
        if (options.stroke) {
            ctx.strokeStyle = options.stroke;
            ctx.lineWidth = (options.lineWidth) ? options.lineWidth : 1;
            ctx.stroke();
        }
        if (options.showCoord) {
            var coord = (this.c.q) + " " + (this.c.r);
            // var cube = this.toCube();
            // coord = (cube.x + "|" + cube.y + "|" + cube.z);
            ctx.fillStyle = "#000";
            ctx.font = '15px monospace';
            ctx.fillText(coord, this.x - ctx.measureText(coord).width / 2, this.y);
        }
    },
    neighbors: function() {
        var neighborsDirs =  [
            [+1,  0],  [+1, -1],  [ 0, -1],
            [-1,  0],  [-1, +1],  [ 0, +1]
        ];
        var neighbors = [];
        for(var dir = 0; dir < 6; dir++) {
            var d = neighborsDirs[dir]
            var neighbor = game.map.get(this.q + d[0], this.r + d[1])
            if (neighbor)
                neighbors.push(neighbor);
        }

        return neighbors;
    },
    equals: function(hex) {
        return this.c.equals(hex.c);
    }
}
