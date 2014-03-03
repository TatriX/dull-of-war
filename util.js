(function() {
    var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    window.requestAnimationFrame = requestAnimationFrame;
})();

function Util() {}

Util.prototype = {

    ajax: function(url, callback){
        var oReq = new XMLHttpRequest();
        oReq.open("GET", url, true);
        oReq.onreadystatechange = function (oEvent) {
            if (oReq.readyState === 4) {
                if (oReq.status === 200) {
                    callback && callback(oReq.responseText);
                } else {
                    console.log("Error", oReq.statusText);
                }
            }
        };
        oReq.send(null);
    },

    clone: function clone(o) {
        if(!o || 'object' !== typeof o)  {
            return o;
        }
        var c = 'function' === typeof o.pop ? [] : {};
        var p, v;
        for(p in o) {
            if(o.hasOwnProperty(p)) {
                v = o[p];
                if(v && 'object' === typeof v) {
                    c[p] = clone(v);
                }
                else {
                    c[p] = v;
                }
            }
        }
        return c;
    },

    rand: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    element: {
        insert: function(element) {
            document.body.insertBefore(element, document.body.firstChild);
        }
    },
    draggable: function(element) {
        var drag = null;
        element.addEventListener('mousedown', function(e) {
            if(getComputedStyle(e.target).cursor == "pointer")
                return;
            if (util.hasClass(e.target, "no-drag"))
                return;
            drag = {
                dx: e.pageX - element.offsetLeft,
                dy: e.pageY - element.offsetTop,
            };
        });
        window.addEventListener('mouseup', function(e) {
            drag = null;
        });
        window.addEventListener('mousemove', function(e) {
            if (drag) {
                element.style.left = e.pageX - drag.dx + "px";
                element.style.top = e.pageY - drag.dy + "px";
            }
        });
    },
    ucfirst: function(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    },
    symbolToString: function(string) {
        return util.ucfirst(string.replace("-", " "));
    },
    //point to rect
    intersects: function(x, y, rx, ry, w, h) {
        return x > rx && x < rx + w && y > ry && y < ry + h;
    },
    removeClass: function(elem, cl) {
        if (typeof elem == "string") {
            var elements = document.querySelectorAll(elem);
            for(var i = 0; i < elements.length; i++) {
                this.removeClass(elements[i], cl);
            }
            return;
        }
        if(!elem.className) {
            return;
        }
        var cls = elem.className.split(" ");
        var i = cls.indexOf(cl);
        if(i >= 0) {
            cls.splice(i, 1);
            elem.className = cls.join(" ");
        }
    },
    addClass: function(elem, cl) {
        if(!elem.className) {
            elem.className = cl;
            return;
        }
        var cls = elem.className.split(" ");
        var i = cls.indexOf(cl);
        if(i >= 0) {
            return;
        }
        cls.push(cl);
        elem.className = cls.join(" ");
    },
    hasClass: function(elem, cl) {
        if(!elem.className) {
            return false;
        }
        var cls = elem.className.split(" ");
        return (cls.indexOf(cl) != -1);
    },
    extend: function(Child, Parent) {
        var F = function() { }
        F.prototype = Parent.prototype
        Child.prototype = new F()
        Child.prototype.constructor = Child
        Child.superclass = Parent.prototype
    },
};

var util = new Util();
