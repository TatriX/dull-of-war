var stage = new function() {
    var login = "";
    var iLogin = document.getElementById("login-input");
    var iPassword = document.getElementById("password-input");
    var bLogin = document.getElementById("login-button");
    var fLogin = document.getElementById("login-stage");

    fLogin.onsubmit = function() {
        return false;
    }

    bLogin.onclick = function() {
        login = iLogin.value;

        if (login.length == 0)
            return alert("Login must be present");

        if (iPassword.value.length == 0)
            return alert("Password must be present");
        network.send("login", {
            Login: login,
            Password: iPassword.value,
        });
    }

    return {
        start: function() {
            if (iLogin.value) {
                iPassword.focus();
            }
        },
        sync: function() {
            game.player = new Player(login);
            game.setStage("lobby");
        },
    }
}
