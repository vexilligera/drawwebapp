var BoundingBox = function(canvasName) {
    this.canvasName = canvasName;
    this.canvas = document.getElementById(canvasName);
    this.pixelRatio = window.devicePixelRatio || 1;
    this.width = window.screen.width * this.pixelRatio;
    this.height = window.screen.height * this.pixelRatio;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.width = (this.width / this.pixelRatio).toString() + 'px';
    this.canvas.style.height = (this.height / this.pixelRatio).toString() + 'px';
    this.context = this.canvas.getContext('2d');
    this.radius = 5 * this.pixelRatio;
    this.r = this.radius * 2.5;
    this.grid = new Array(9);
    for (var i = 0; i < 9; ++i)
        this.grid[i] = {x: -1, y: -1};
    this.canvas.onmousedown = this.canvas.ontouchstart = this.onPointerDown;
    this.canvas.onmousemove = this.canvas.ontouchmove = this.onPointerMove;
    this.canvas.onmouseup = this.canvas.ontouchend = this.onPointerUp;
    this.canvas.boundingBox = this;
    this.pointerDown = false;
    this.canvas.style.display = 'none';
    this.onChange = null;
    this.onOut = null;
};

BoundingBox.prototype = {
    setVisible: function(visible) {
        if (visible) {
            this.canvas.style.display = 'inline';
            this.canvas.style.pointerEvents = 'auto';
        }
        else {
            this.canvas.style.display = 'none';
        }
    },

    setOnChange: function(onChange) {
        this.onChange = onChange;
    },

    setOnOut: function(onOut) {
        this.onOut = onOut;
    },

    pointDist: function(x1, y1, x2, y2) {
        var dx = x1 - x2, dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    },

    lineDist: function(x0, y0, x1, y1, x2, y2) {
        var space = 0, a, b, c;
        a = this.pointDist(x1, y1, x2, y2);
        b = this.pointDist(x1, y1, x0, y0);
        c = this.pointDist(x2, y2, x0, y0);
        if (c <= 0.0001 || b <= 0.0001)
            return 0;
        if (a <= 0.0001 || c * c >= a * a + b * b)
            return b;
        if (b * b >= a * a + c * c)
            return c;
        var p = (a + b + c) / 2;
        var s = Math.sqrt(p * (p - a) * (p - b) * (p - c));
        return 2 * s / a;
    },

    isVertexSelected: function(id, x, y) {
        var x0 = this.grid[id].x;
        var y0 = this.grid[id].y;
        if (this.pointDist(x, y, x0, y0) <= this.r)
            return true;
        else return false;
    },

    isVertexMarginSelected: function(id, x, y) {
        var x0 = this.grid[id].x;
        var y0 = this.grid[id].y;
        if (this.pointDist(x, y, x0, y0) > this.r && this.pointDist(x, y, x0, y0) < this.r * 2)
            return true;
        else return false;
    },

    isEdgeSelected: function(id1, id2, x, y) {
        if (this.lineDist(x, y, this.grid[id1].x, this.grid[id1].y, this.grid[id2].x, this.grid[id2].y)
            <= this.r)
            return true;
        else return false;
    },

    setVertex: function(id, x, y) {
        this.grid[id].x = x, this.grid[id].y = y;
    },

    onPointerDown: function(e) {
        var self = this.boundingBox;
        var x = e.offsetX * self.pixelRatio;
        var y = e.offsetY * self.pixelRatio;
        if (e.offsetX == undefined) {
            x = e.targetTouches[0].pageX * self.pixelRatio;
            y = e.targetTouches[0].pageY * self.pixelRatio;
        }
        self.selectedObject = null;
        for (var i = 0; i < 9; ++i) {
            if (self.isVertexSelected(i, x, y)) {
                self.selectedObject = 'v' + i.toString();
                self.pointerDown = true;
                break;
            }
            else if (self.isVertexMarginSelected(i, x, y)) {
                self.selectedObject = 'm' + i.toString();
                self.pointerDown = true;
                break;
            }
        }
        if (!self.selectedObject) {
            if (self.isEdgeSelected(0, 1, x, y) || self.isEdgeSelected(1, 2, x, y)) {
                self.selectedObject = 'e0';
                self.pointerDown = true;
            }
            else if (self.isEdgeSelected(0, 3, x, y) || self.isEdgeSelected(3, 6, x, y)) {
                self.selectedObject = 'e1';
                self.pointerDown = true;
            }
            else if (self.isEdgeSelected(2, 5, x, y) || self.isEdgeSelected(5, 8, x, y)) {
                self.selectedObject = 'e2';
                self.pointerDown = true;
            }
            else if (self.isEdgeSelected(6, 7, x, y) || self.isEdgeSelected(7, 8, x, y)) {
                self.selectedObject = 'e3';
                self.pointerDown = true;
            }
        }
        if (self.pointerDown)
            self.x = x, self.y = y;
        else if (self.onOut) {
            var left = self.grid[0].x, right = left;
            var top = self.grid[0].y, bottom = top;
            for (var i = 0; i < 9; ++i) {
                if (self.grid[i].x > right)
                    right = self.grid[i].x;
                if (self.grid[i].x < left)
                    left = self.grid[i].x;
                if (self.grid[i].y < top)
                    top = self.grid[i].y;
                if (self.grid[i].y > bottom);
                    bottom = self.grid[i].y;
            }
            if (!((x > left && x < right) && (y > top && y < bottom)))
                self.onOut();
        }
    },

    onPointerMove: function(e) {
        var self = this.boundingBox;
        var obj = self.selectedObject;
        if (e.offsetX == undefined) {
            e.offsetX = e.targetTouches[0].pageX;
            e.offsetY = e.targetTouches[0].pageY;
        }
        if (self.pointerDown) {
            if (obj == 'm2') {
                var v1x = self.x - self.grid[4].x;
                var v1y = self.y - self.grid[4].y;
                var k1 = v1y / v1x;
                var v2x = e.offsetX * self.pixelRatio - self.grid[4].x;
                var v2y = e.offsetY * self.pixelRatio - self.grid[4].y;
                var k2 = v2y / v2x;
                var t = v1x * v2x + v1y * v2y;
                var theta = Math.atan((k2 - k1) / (1 + k1 * k2));
                if (isNaN(theta))
                    theta = Math.PI / 2;
                for (var i = 0; i < 9; ++i) {
                    var x = self.grid[i].x - self.grid[4].x;
                    var y = self.grid[i].y - self.grid[4].y;
                    self.grid[i].x = x * Math.cos(theta) - y * Math.sin(theta) + self.grid[4].x;
                    self.grid[i].y = x * Math.sin(theta) + y * Math.cos(theta) + self.grid[4].y;
                }
                self.x = e.offsetX * self.pixelRatio, self.y = e.offsetY * self.pixelRatio;
            }
            else if (obj == 'm4' || obj == 'v4') {
                for (var i = 0; i < 9; ++i) {
                    if (i != 4) {
                        var dx = self.grid[4].x - self.grid[i].x;
                        var dy = self.grid[4].y - self.grid[i].y;
                        self.grid[i].x = e.offsetX * self.pixelRatio - dx;
                        self.grid[i].y = e.offsetY * self.pixelRatio - dy;
                    }
                }
                self.grid[4].x = e.offsetX * self.pixelRatio;
                self.grid[4].y = e.offsetY * self.pixelRatio;
            }
            else if (obj[0] == 'm' || obj[0] == 'v') {
                self.grid[parseInt(obj[1])].x = e.offsetX * self.pixelRatio;
                self.grid[parseInt(obj[1])].y = e.offsetY * self.pixelRatio;
                var sx = 0, sy = 0;
                for (var i = 0; i < 9; ++i) {
                    sx += self.grid[i].x;
                    sy += self.grid[i].y;
                }
                self.grid[4].x = sx / 9;
                self.grid[4].y = sy / 9;
            }
            else if (obj[0] == 'e') {
                var dx = e.offsetX * self.pixelRatio - self.x;
                var dy = e.offsetY * self.pixelRatio - self.y;
                if (obj[1] == '0') {
                    for (var i = 0; i < 6; ++i) {
                        if (i < 3)
                            self.grid[i].x += dx, self.grid[i].y += dy;
                        else self.grid[i].x += dx / 2, self.grid[i].y += dy / 2;
                    }
                }
                else if (obj[1] == '1') {
                    self.grid[0].x += dx, self.grid[0].y += dy;
                    self.grid[3].x += dx, self.grid[3].y += dy;
                    self.grid[6].x += dx, self.grid[6].y += dy;
                    self.grid[1].x += dx / 2, self.grid[1].y += dy / 2;
                    self.grid[4].x += dx / 2, self.grid[4].y += dy / 2;
                    self.grid[7].x += dx / 2, self.grid[7].y += dy / 2;
                }
                else if (obj[1] == '2') {
                    self.grid[2].x += dx, self.grid[2].y += dy;
                    self.grid[5].x += dx, self.grid[5].y += dy;
                    self.grid[8].x += dx, self.grid[8].y += dy;
                    self.grid[1].x += dx / 2, self.grid[1].y += dy / 2;
                    self.grid[4].x += dx / 2, self.grid[4].y += dy / 2;
                    self.grid[7].x += dx / 2, self.grid[7].y += dy / 2;
                }
                else if (obj[1] == '3') {
                    for (var i = 3; i < 9; ++i) {
                        if (i >= 6)
                            self.grid[i].x += dx, self.grid[i].y += dy;
                        else self.grid[i].x += dx / 2, self.grid[i].y += dy / 2;
                    }
                }
                self.x = e.offsetX * self.pixelRatio, self.y = e.offsetY * self.pixelRatio;
            }
            if (self.onChange)
                self.onChange(self.grid);
            self.show();
        }
    },

    onPointerUp: function(e) {
        var self = this.boundingBox;
        self.pointerDown = false;
        self.selectedObject = null;
    },

    show: function() {
        var ctx = this.context;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        var line = function(x1, y1, x2, y2) {
            ctx.beginPath();
            ctx.strokeStyle = '#404040';
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.closePath();
        }
        ctx.lineWidth = 1;
        line(this.grid[0].x, this.grid[0].y, this.grid[1].x, this.grid[1].y);
        line(this.grid[1].x, this.grid[1].y, this.grid[2].x, this.grid[2].y);
        line(this.grid[0].x, this.grid[0].y, this.grid[3].x, this.grid[3].y);
        line(this.grid[3].x, this.grid[3].y, this.grid[6].x, this.grid[6].y);
        line(this.grid[6].x, this.grid[6].y, this.grid[7].x, this.grid[7].y);
        line(this.grid[7].x, this.grid[7].y, this.grid[8].x, this.grid[8].y);
        line(this.grid[8].x, this.grid[8].y, this.grid[5].x, this.grid[5].y);
        line(this.grid[5].x, this.grid[5].y, this.grid[2].x, this.grid[2].y);
        for (var i = 0; i < 9; ++i) {
            ctx.beginPath();
            if (i == 4) {
                ctx.moveTo(this.grid[i].x - this.radius, this.grid[i].y);
                ctx.lineTo(this.grid[i].x + this.radius, this.grid[i].y);
                ctx.stroke();
                ctx.moveTo(this.grid[i].x, this.grid[i].y - this.radius);
                ctx.lineTo(this.grid[i].x, this.grid[i].y + this.radius);
                ctx.stroke();
            }
            else {
                ctx.fillStyle = '#000';
                ctx.arc(this.grid[i].x, this.grid[i].y, this.radius, 0, 2 * Math.PI);
                ctx.fill();
            }
            ctx.closePath();
        }
        ctx.beginPath();
        ctx.lineWidth = 5;
        ctx.arc(this.grid[2].x, this.grid[2].y, this.radius * 2, -Math.PI / 2, 0);
        ctx.stroke();
        ctx.closePath();
    }
};