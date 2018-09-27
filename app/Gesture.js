var BrushGesture = function(canvasName) {
	this.controlSaturation = true;
	this.controlBrightness = true;
	this.controlHue = true;
	this.controlSize = true;

	this.color = null;
	this.size = null;

	this.canvas = document.getElementById(canvasName);
	this.ctx = this.canvas.getContext('2d');
	this.canvasManager = null;
	this.pixelRatio = window.devicePixelRatio || 1;
};

BrushGesture.prototype = {
	setVisible: function(visible) {
		if (visible) {
			this.canvas.style.display = 'inline';
			this.canvas.style.pointerEvents = 'none';
		}
		else this.canvas.style.display = 'none';
	},

	setState: function(color, size) {
		this.color = color;
		this.size = size;
		this.hsl = RgbToHsl(this.color[0], this.color[1], this.color[2]);
	},

	getNormalizedColor: function() {
		return [this.color[0] / 255, this.color[1] / 255, this.color[2] / 255, 1.0];
	},

	drawWheel: function(input, dynamics) {
		var x = input.touchCenterX * this.pixelRatio;
		var y = input.touchCenterY * this.pixelRatio;
		var hsl = this.hsl;
		if (this.controlSize) {
			this.size = this.size + dynamics.centralStretch;
			if (this.size < 1) this.size = 1;
		}
		if (this.controlHue) {
			hsl[0] += Math.round(dynamics.rotationAngle * 50);
			if (hsl[0] > 100) hsl[0] = 0;
			else if (hsl[0] < 0) hsl[0] = 100;
			if (isNaN(hsl[0]))
				hsl[0] = 0;
		}
		if (this.controlSaturation) {
			var s = parseInt(hsl[1].replace('%', ''));
			s += Math.round(dynamics.deltaTouchCenterX / 5);
			if (s > 100) s = 100;
			else if (s < 0.0) s = 0.0;
			hsl[1] = s.toString() + '%';
		}
		if (this.controlBrightness) {
			var b = parseInt(hsl[2].replace('%', ''))
			b -= Math.round(dynamics.deltaTouchCenterY / 5);
			if (b > 100) b = 100;
			else if (b < 0.0) b = 0.0;
			hsl[2] = b.toString() + '%'; 
		}
		this.color = hslToRgb(hsl[0] / 100, parseInt(hsl[1].replace('%', '')) / 100,
								parseInt(hsl[2].replace('%', '')) / 100);
		var ctx = this.ctx;
		ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		ctx.beginPath();
		ctx.fillStyle = arrayToRGB(this.color);
		ctx.arc(x, y, this.size, 0, 2 * Math.PI);
		ctx.fill();
		ctx.closePath();
		if (this.size < 60) {
			ctx.beginPath();
			ctx.strokeStyle = arrayToRGB(this.color);
			ctx.lineWidth = 24;
			ctx.arc(x, y, 100, 0, 2 * Math.PI);
			ctx.stroke();
			ctx.closePath();
		}
	}
};