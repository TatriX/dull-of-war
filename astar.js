function Node(hex, parent) {
    this.hex = hex;
    this.parent;
    this.g = 0;
    this.f = 0;
}

Node.prototype = {
    equals: function(node) {
        return this.hex.equals(node.hex);
    },
    neighbors: function() {
        return this.hex.neighbors().filter(function(hex) {
            return (!hex.unit);
        }).map(function(hex) {
            return new Node(hex);
        });
    },
    distanceTo: function(node) {
        return this.hex.distanceTo(node.hex);
    },
    costTo: function(node) {
        return this.distanceTo(node);
    },
    path: function() {
        var path = [this.hex];
        var current = this.parent;
        while(current) {
            path.push(current.hex);
            current = current.parent;
        }
        return path;
    },
    get key() {
        return '' + this.hex.q + this.hex.r;
    },
}

function astar(_start, _goal){
    if (_start == _goal)
        return [];
    var start = new Node(_start);
    var goal = new Node(_goal);

    var closedset = {};

    var openset = {};
    openset[start.key] = start;
    var opensetLength = 1;
    var opensetHead = start;

    start.f = start.g + start.costTo(goal);

    while (opensetLength > 0) {
        var current = {f: +Infinity};
        for(var i in openset) {
            if (current.f > openset[i].f)
                current = openset[i];
        }

        if (current.equals(goal))
            return current.path();

        delete openset[current.key];
        opensetLength--;

        closedset[current.key] = current;
        var neighbors = current.neighbors();
        for (var i = 0, l = neighbors.length; i < l; i++) {
            var neighbor = neighbors[i];
            var g = current.g + 1; //with hex we always have 1 here == current.distanceTo(neighbor);
            var inClosed = !!closedset[neighbor.key];
            if (inClosed && g >= neighbor.g)
                continue;

            if (!inClosed || g < neighbor.g) {
                neighbor.parent = current;
                neighbor.g = g;
                neighbor.f = neighbor.f + neighbor.costTo(goal);
                if (!openset[neighbor.key]) {
                    openset[neighbor.key] = neighbor;
                    opensetLength++;
                }
            }
        }
    }
    return [];
}
