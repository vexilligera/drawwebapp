 var ColorPicker = function(canvasName) {
	this.canvas = document.getElementById(canvasName);
	this.ctx = this.canvas.getContext('2d');
	this.canvasManager = null;
	this.radius = 160;
}

ColorPicker.prototype = {
	bindApp: function(canvasManager) {
		this.canvasManager = canvasManager;
	},

	setVisible: function(visible) {
		this.visible = visible;
		if (visible) {
			this.canvas.style.display = 'inline';
			this.canvas.style.pointerEvents = 'none';
		}
		else this.canvas.style.display = 'none';
	},

	setRadius: function(r) {
		this.radius = r;
	},

	drawRing: function(x, y, originalColor, newColor) {
		var ctx = this.ctx;
		ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		ctx.beginPath();
		ctx.strokeStyle = '#efefef';
		ctx.lineWidth = 35;
		ctx.arc(x, y, this.radius, 0, 2 * Math.PI);
		ctx.stroke();
		ctx.closePath();
		ctx.beginPath();
		ctx.lineWidth = 28;
		ctx.strokeStyle = originalColor;
		ctx.arc(x, y, this.radius, 0, Math.PI);
		ctx.stroke();
		ctx.closePath();
		ctx.beginPath();
		ctx.strokeStyle = newColor;
		ctx.arc(x, y, this.radius, 0, Math.PI, true);
		ctx.stroke();
		ctx.closePath();
	}
};