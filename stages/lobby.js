var stage = new function() {
    var players = {}
    var ul = document.getElementById("lobby-players");

    var pvpRequest = function(name) {
        return function() {
            network.send("pvp-request", {
                Name: name
            })
        }
    };

    var updateList = function() {
        ul.innerHTML = "";
        Object.keys(players).map(function(name) {
            var li = document.createElement("li");
            li.textContent = name;

            if (name != game.player.name) {
                var play = document.createElement("button");
                play.onclick = pvpRequest(name);
                play.textContent = "play";
                li.appendChild(play);
            }

            ul.appendChild(li);
        })
    }
    return {
        start: function() {
            this.sync(network.data);
        },
        sync: function(data) {
            for (var key in data) {
                switch(key) {
                case "cmd":
                    game.player.cmd(data[key]);
                    break;
                case "pvp-request":
                    var name = data[key];
                    var answ = confirm(name + " is requesting pvp with you. Go?");
                    network.send("pvp-accept", answ)
                    break;
                case "players":
                    players = data.players;
                    updateList();
                    break;
                default:
                    console.error("Unknown key: ", key)
                }
            }
        }
    }
}
