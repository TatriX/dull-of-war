var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

function mapcall(list, callback) {
    list.map(function(item) {
        item[callback]();
    })
};

function onError(msg) {
    msg = msg || "Internal error occured";
    return function() {
        alert(msg);
        throw msg;
    }
}

function loadScript(src, onload) {
    var script = document.createElement("script");
    document.head.appendChild(script);
    script.async = false;
    script.onload = onload;
    script.onerror = onError("Cannot load script " + src);
    script.src = src;
}

[
    "util",
    "config",
    "hexagon",
    "astar",
    "map",
    "player",
    "unit",
    "network",
    "game",
].map(function(script) {
    loadScript(script + ".js");
})
