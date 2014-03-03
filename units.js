!function() {
    var units = (function() {
        var units = [];
        units.push(new MobileCommandPost(game.player));

        units.push(new Helicopter(game.player));
        units.push(new Helicopter(game.player));

        units.push(new Tank(game.player));
        units.push(new Tank(game.player));
        units.push(new Tank(game.player));

        units.push(new Jeep(game.player));
        units.push(new Jeep(game.player));
        units.push(new Jeep(game.player));

        units.push(new AirDefense(game.player));
        units.push(new AirDefense(game.player));

        units.push(new PT(game.player));
        units.push(new PT(game.player));

        units.push(new RocketLauncher(game.player));
        units.push(new RocketLauncher(game.player));

        return units;
    })();

    var unitsList = document.createElement("ul");
    unitsList.id = "units-list";
    units.map(function(unit) {
        var item = document.createElement("li");
        var image = unit.texture.cloneNode();
        image.unit = unit;
        item.unit = unit;
        item.unit.button = item;
        item.addEventListener('click', function(e) {
            if (game.stage != "prepare" || game.selected.unit)
                return;
            var unit = e.currentTarget.unit;
            unit.remove();
            unit.button.className = "selected";
            game.selected.unit = unit;
        });
        item.appendChild(image);
        unitsList.appendChild(item);
    });
    document.body.appendChild(unitsList);
}();
