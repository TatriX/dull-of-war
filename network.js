var network = new function() {
    this.host = (location.host == "localhost") ? "localhost" :  "54.229.106.82";
    this.port = 46666;
    this.socket = new WebSocket("ws://" + this.host + ":" + this.port + "/");
    this.socket.onerror = onError("Cannot connect to server");

    this.send = function(command, data) {
        var msg = command + "|" + JSON.stringify(data);
        this.socket.send(msg);
    };

    this.data = null;

    this.socket.onmessage = function(msg) {
        this.data = JSON.parse(msg.data);

        if (this.data.error) {
            alert(network.data.error);
            location.reload();
            return;
        }

        if (game.stage)
            game.stage.sync(this.data);

    }.bind(this);
}
