window.addEventListener('resize', function() {
    game.map.resize();
    game.draw();
});

window.addEventListener('mousemove', function(e) {
    game.hovered = game.map.find(e.clientX, e.clientY);
    game.cursorElement = document.elementFromPoint(e.clientX, e.clientY);
});

window.addEventListener('keydown', function(e) {
    if (game.stage.keydown)
        game.stage.keydown(e);
});

window.addEventListener('mousedown', function(e) {
    if (game.stage.mousedown)
        game.stage.mousedown(e)
});

canvas.addEventListener('contextmenu', function(e) {
    game.selected.unit = false;
    e.preventDefault();
    return false;
});
