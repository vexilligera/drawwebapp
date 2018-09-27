import React from 'react';
import ReactDom from 'react-dom';
import { connect } from 'react-redux';
import { Select, Row, Col, Input, Button, Slider, Radio, Icon } from 'antd';
import { TextSlideInput } from './gadgets';
import './palette.less';

const ButtonGroup = Button.Group;
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

var setColorCb;
let ui = null;

function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1)
        s = h[0], v = h[1], h = h[2];
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function RGBtoHSV(r, g, b) {
    if (arguments.length === 1)
        g = r[0], b = r[1], r = r[2];
    var max = Math.max(r, g, b), min = Math.min(r, g, b),
        d = max - min,
        h,
        s = (max === 0 ? 0 : d / max),
        v = max / 255;
    switch (max) {
        case min: h = 0; break;
        case r: h = (g - b) + d * (g < b ? 6: 0); h /= 6 * d; break;
        case g: h = (b - r) + d * 2; h /= 6 * d; break;
        case b: h = (r - g) + d * 4; h /= 6 * d; break;
    }
    return [h, s, v];
}

class UIPalette extends React.Component {
	constructor(props) {
		super(props);
		this.state = { left: 0, top: 0, offsetX: 0, offsetY: 0, dragging: false, bgColor: '#404040', webClrVal: '#000',
					 wheelRadius: 0, selectingHue: false, hueColor: [255, 0, 0, 255], s: 0, v: 0, sliderMode: 'rgb', panelMode: 'slider',
					 width: this.props.style.width, height: this.props.style.height, pixelRatio: window.devicePixelRatio || 1, zIndex: this.props.style.zIndex,
					 color0: [0, 0, 0, 1], color1: [255, 255, 255, 1], selectingSV: false, collapsed: false, collectedColor: 0, collectedColors:new Array(49),
					 selectedColor:'', blockSize:0, baseX:0, baseY:0 };
		ui = this;
	}

	updateColor(rgb, updateColorSquare = false, updateColorWheel = false, updateHSV = false, dispatch = true) {
		this.state.color0 = rgb;
		if (!this.state.color0) {
			this.state.color0 = [0, 0, 0, 1];
			return;
		}
		if (updateHSV) {
			var t = RGBtoHSV(this.state.color0);
			this.state.h = t[0] - 1 / 3, this.state.s = t[1], this.state.v = t[2];
			if (this.state.h < 0)
				this.state.h += 1;
		}
		if (updateColorWheel) {
			this.state.hueColor = HSVtoRGB(this.state.h, 1.0, 1.0);
			this.drawColorWheel(this.state.ctx, this.state.wheelCenterX, this.state.wheelCenterY, this.state.wheelRadius, false);
		}
		if (updateColorSquare) {
			var deg = this.state.h;
			var x = this.state.wheelCenterX + Math.cos(Math.PI * 2 * deg) * 0.87 * (this.state.innerWheelRadius + this.state.wheelRadius) / 2;
			var y = this.state.wheelCenterY + Math.sin(Math.PI * 2 * deg) * 0.87 * (this.state.innerWheelRadius + this.state.wheelRadius) / 2;
			var clr = 'rgb(' + this.state.hueColor[0].toString() + ',' + this.state.hueColor[1].toString() + ',' + this.state.hueColor[2].toString() + ')';
			this.drawColorSquare(this.state.ctx, clr, this.state.wheelCenterX, this.state.wheelCenterY, x, y);
			this.drawRing(this.state.s, this.state.v, false, true);
		}
		var a = 15 * this.state.pixelRatio;
		var xa = this.state.wheelCenterX + this.state.innerWheelRadius, ya = this.state.wheelCenterY + this.state.innerWheelRadius;
		var d = 2.5 * this.state.pixelRatio;
		this.state.ctx.fillStyle = 'rgb(' + this.state.color1[0].toString() + ',' + this.state.color1[1].toString() + ',' + this.state.color1[2].toString() + ')';
		this.state.ctx.fillRect(xa + d, ya + d, a, a);
		this.state.ctx.fillStyle = 'rgb(' + this.state.color0[0].toString() + ',' + this.state.color0[1].toString() + ',' + this.state.color0[2].toString() + ')';
		this.state.ctx.fillRect(xa - d, ya - d, a, a);
		this.state.swapx0 = xa - d, this.state.swapy0 = ya - d;
		this.state.swapx1 = xa + d + a, this.state.swapy1 = ya + d + a;
		var s = 'rgb(' + this.state.color0[0].toString() + ',' + this.state.color0[1].toString() + ',' + this.state.color0[2].toString() + ')';
		this.state.webClrVal = s.colorHex();
		this.forceUpdate();
		if (dispatch)
			this.props.updateColor0(this.state.color0);
	}

	selectHue(x, y, normalized = false) {
		var l = Math.sqrt((x - this.state.wheelCenterX) * (x - this.state.wheelCenterX) + (y - this.state.wheelCenterY) * (y - this.state.wheelCenterY));
		var m = (this.state.wheelRadius + this.state.innerWheelRadius) / 2 / l;
		var vx = (x - this.state.wheelCenterX) * m;
		var vy = (y - this.state.wheelCenterY) * m;
		var vx1 = vx * 0.87, vy1 = vy * 0.87;
		vx += this.state.wheelCenterX, vy += this.state.wheelCenterY;
		vx1 += this.state.wheelCenterX, vy1 += this.state.wheelCenterY;
		this.state.hueColor = [...this.state.ctx.getImageData(vx, vy, 1, 1).data];
		var clr = 'rgb(' + this.state.hueColor[0].toString() + ',' + this.state.hueColor[1].toString() + ',' + this.state.hueColor[2].toString() + ')';
		this.state.h = RGBtoHSV(this.state.hueColor)[0] - 1 / 3;
		if (this.state.h < 0)
			this.state.h += 1;
		this.state.color0 = HSVtoRGB(this.state.h, this.state.s, this.state.v);
		this.updateColor(this.state.color0, true, true);
	}

	selectSV(x, y, normalized = false) {
		var ux = this.state.squareX1 - this.state.squareX;
		var uy = this.state.squareY1 - this.state.squareY;
		var vx = this.state.squareX2 - this.state.squareX;
		var vy = this.state.squareY2 - this.state.squareY;
		var px = x - this.state.squareX;
		var py = y - this.state.squareY;
		var s = (px * ux + py * uy) / Math.sqrt(this.distSquare(ux, uy, 0, 0));
		var v = (px * vx + py * vy) / Math.sqrt(this.distSquare(vx, vy, 0, 0));
		v /= this.state.squareSide, s /= this.state.squareSide;
		if (v > 1) v = 1; else if (v < 0) v = 0; if (s > 1) s = 1; else if (s < 0) s = 0;
		s = 1 - s, v = 1 - v;
		this.state.s = s, this.state.v = v;
		this.state.color0 = HSVtoRGB(this.state.h, s, v);
		var clr = 'rgb(' + this.state.hueColor[0].toString() + ',' + this.state.hueColor[1].toString() + ',' + this.state.hueColor[2].toString() + ')';
		this.updateColor(this.state.color0);
	}

	drawRing(x, y, hueColor = true, normalized = false) {
		if (normalized) {
			var ux = this.state.squareX1 - this.state.squareX;
			var uy = this.state.squareY1 - this.state.squareY;
			var vx = this.state.squareX2 - this.state.squareX;
			var vy = this.state.squareY2 - this.state.squareY;
			var s = x, v = y;
			s = 1 - s, v = 1 - v;
			v *= this.state.squareSide, s *= this.state.squareSide;
			s = s * Math.sqrt(this.distSquare(ux, uy, 0, 0));
			v = v * Math.sqrt(this.distSquare(vx, vy, 0, 0));
			var px = (s * vy - v * uy) / (ux * vy - vx * uy);
			var py = (s * vx - v * ux) / (uy * vx - vy * ux);
			x = px + this.state.squareX;
			y = py + this.state.squareY;
		}
		var ctx = this.state.ctx
		ctx.beginPath();
		ctx.moveTo(x, y);
		var r = (this.state.wheelRadius - this.state.innerWheelRadius) / 2 * 0.7;
		ctx.arc(x, y, r, 0, Math.PI * 2, false);
		ctx.fillStyle = '#ffffffff';
		ctx.fill();
		ctx.closePath();
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.arc(x, y, 0.7 * r, 0, Math.PI * 2, false);
		if (hueColor)
			ctx.fillStyle = 'rgb(' + this.state.hueColor[0].toString() + ',' + this.state.hueColor[1].toString() + ',' + this.state.hueColor[2].toString() + ')';
		else
			ctx.fillStyle = 'rgb(' + this.state.color0[0].toString() + ',' + this.state.color0[1].toString() + ',' + this.state.color0[2].toString() + ')';
		ctx.fill();
		ctx.closePath();
	}

	onSliderChange = (type, v) => {
		if (this.state.sliderMode == 'rgb') {
			if (type == 'red')
				this.state.color0[0] = v;
			else if (type == 'green')
				this.state.color0[1] = v;
			else if (type == 'blue')
				this.state.color0[2] = v;
			var t = RGBtoHSV(this.state.color0);
			this.state.h = t[0] - 1 / 3;
			if (this.state.h < 0)
				this.state.h += 1;
			this.state.s = t[1], this.state.v = t[2];
		}
		else {
			var t = RGBtoHSV(this.state.color0);
			if (type == 'hue')
				this.state.h = v / 360;
			else if (type == 'sat')
				this.state.s = v / 100;
			else if (type == 'val')
				this.state.v = v / 100;
			this.state.color0 = HSVtoRGB(this.state.h, this.state.s, this.state.v);
		}
		this.updateColor(this.state.color0, true, true);
	}

	handleDrag(x, y) {
		var xp = (x - this.state.left) * this.state.pixelRatio, yp = (y - this.state.top) * this.state.pixelRatio;
		if (this.state.dragging) {
			this.setState({left: x - this.state.offsetX, top: y - this.state.offsetY});
		}
		else if (this.state.selectingHue) {
			this.selectHue(xp, yp);
		}
		else if (this.state.selectingSV) {
			this.selectSV(xp, yp);
			var d2 = this.distSquare(xp, yp, this.state.wheelCenterX, this.state.wheelCenterY);
			if (d2 > this.state.innerWheelRadius * this.state.innerWheelRadius)
				this.state.selectingSV = false;
		}
	}

	handleTouchDrag = (e) => {
		this.handleDrag(e.touches[0].pageX, e.touches[0].pageY);
	}

	handleMouseDrag = (e) => {
		this.handleDrag(e.pageX, e.pageY);
	}

	handlePointerDown(x, y) {
		var xp = x, yp = y;
		x = (x - this.state.left) * this.state.pixelRatio, y = (y - this.state.top) * this.state.pixelRatio;
		var d2 = this.distSquare(x, y, this.state.wheelCenterX, this.state.wheelCenterY);
		if (x > this.state.swapx0 && x < this.state.swapx1 && y > this.state.swapy0 && y < this.state.swapy1) {
			var tmp = this.state.color1;
			this.state.color1 = this.state.color0;
			this.state.color0 = tmp;
			this.updateColor(this.state.color0, true, true);
		}
		else if (x > this.state.baseX && y > this.state.baseY && x < this.state.baseX + 7 * this.state.blockSize &&
				y < this.state.baseY + 7 * this.state.blockSize) {
			this._selectColorBlock(x, y);
			this.updateColor(this.state.color0, true, true, true);
		}
		else if (d2 > this.state.wheelRadius * this.state.wheelRadius) {
			this.setState({dragging: true, offsetX: xp - this.state.left, offsetY: yp - this.state.top});
		}
		else if (d2 > this.state.innerWheelRadius * this.state.innerWheelRadius) {
			this.state.selectingHue = true;
			this.selectHue(x, y);
		}
		else {
			this.state.selectingSV = true;
			this.selectSV(x, y);
		}
	}

	handleMouseStart = (e) => {
		this.handlePointerDown(e.pageX, e.pageY);
	}

	handleTouchStart = (e) => {
		this.handlePointerDown(e.touches[0].pageX, e.touches[0].pageY);
	}

	handleDragEnd = (e) => {
		this.setState({dragging: false, selectingHue: false, selectingSV: false});
	}

	distSquare(x1, y1, x2, y2) {
		return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
	}

	drawColorWheel(ctx, x, y, radius, counterClockwise) {
		for(var angle = 0; angle <= 360; ++angle) {
			var startAngle = (angle-2)*Math.PI/180;
			var endAngle = angle * Math.PI/180;
			ctx.beginPath();
			ctx.moveTo(x, y);
			ctx.arc(x, y, radius, startAngle, endAngle, counterClockwise);
			ctx.closePath();
			ctx.fillStyle = 'hsl('+angle+', 100%, 50%)';
			ctx.fill();
		}
		this.state.innerWheelRadius = Math.round(radius * 0.82);
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.arc(x, y, this.state.innerWheelRadius, 0, 2 * Math.PI, counterClockwise);
		ctx.closePath();
		ctx.fillStyle = this.state.bgColor;
		ctx.fill();
	}

	_drawSquare(ctx, x0, y0, x1, y1, x2, y2, x3, y3, clr1, clr2, gx1, gy1, gx2, gy2) {
		ctx.moveTo(x0, y0);
		ctx.lineTo(x2, y2);
		ctx.lineTo(x1, y1);
		ctx.lineTo(x3, y3);
		var grad = ctx.createLinearGradient(gx1, gy1, gx2, gy2);
		grad.addColorStop(0, clr1);
		grad.addColorStop(1, clr2);
		ctx.fillStyle = grad;
		ctx.fill();
	}

	drawColorSquare(ctx, clr, centerX, centerY, x, y) {
		var vx = centerX - x, vy = centerY - y;
		var x1 = vx + centerX, y1 = vy + centerY;
		var ux = vy, uy = -vx;
		var x2 = centerX + ux, y2 = centerY + uy;
		var x3 = centerX - ux, y3 = centerY - uy;
		ctx.beginPath();
		this.state.squareX = x, this.state.squareY = y;
		this.state.squareX1 = x2, this.state.squareY1 = y2;
		this.state.squareX2 = x3, this.state.squareY2 = y3;
		this.state.squareSide = Math.sqrt(this.distSquare(x, y, x2, y2));
		this._drawSquare(ctx, x, y, x1, y1, x2, y2, x3, y3, clr, '#000000ff', x, y, x3, y3);
		this._drawSquare(ctx, x, y, x1, y1, x2, y2, x3, y3, '#ffffffff', '#ffffff00', x1, y1, x3, y3);
		this._drawSquare(ctx, x, y, x1, y1, x2, y2, x3, y3, '#000000ff', '#00000000', x3, y3, x, y);
	}

	componentDidMount() {
		var canvas = document.getElementById('palette');
		var width = this.state.width * this.state.pixelRatio, height = this.state.height * this.state.pixelRatio;
		canvas.width = width;
		canvas.height = height;
		canvas.style.width = (width / this.state.pixelRatio).toString() + 'px';
		canvas.style.height = (height / this.state.pixelRatio).toString() + 'px';
		var ctx=canvas.getContext("2d");
		ctx.fillStyle = this.state.bgColor;
		ctx.fillRect(0, 0, width, height);
		var x = Math.round(width / 2), radius = Math.round(width / 2 * 0.9), y = radius + 15;
		this.state.wheelRadius = radius, this.state.wheelCenterX = x, this.state.wheelCenterY = y;
		this.drawColorWheel(ctx, x, y, radius, false);
		this.state.canvas = canvas;
		this.state.ctx = ctx;
		this.selectHue(this.state.wheelCenterX - 5 + this.state.wheelRadius, this.state.wheelCenterY);
		this.forceUpdate();
	}

	renderSlider(type) {
		var n1, n2, n3, t1, t2, t3, m1, m2, s1, s2, s3;
		if (type == 'rgb') {
			n1 = 'red', n2 = 'green', n3 = 'blue', t1 = 'Red', t2 = 'Green', t3 = 'Blue', m1 = 255, m2 = 255;
			s1 = this.state.color0[0], s2 = this.state.color0[1], s3 = this.state.color0[2];
		}
		else if (type == 'hsv') {
			n1 = 'hue', n2 = 'sat', n3 = 'val', t1 = 'Hue', t2 = 'Saturation', t3 = 'Brightness', m1 = 360, m2 = 100;
			var t = RGBtoHSV(this.state.color0);
			s1 = this.state.h * 360, s2 = t[1] * 100, s3 = t[2] * 100;
		}
		this.cleanBlocks();
		return (
				<div>
					<TextSlideInput style={{marginTop:10}} name={n1} titleText={t1} min={0} max={m1} value={s1} onChange={(v) => { this.onSliderChange(n1, v); }} />
					<TextSlideInput name={n2} titleText={t2} min={0} max={m2} value={s2} onChange={(v) => { this.onSliderChange(n2, v); }} />
					<TextSlideInput name={n3} titleText={t3} min={0} max={m2} value={s3} onChange={(v) => { this.onSliderChange(n3, v); }} />
					<Row style={{marginTop: 10}}>
						<Col span={2} />
						<Col span={2}>
							<Button size='small' ghost onClick={()=>{
								this.props.selectPipette();
							}}>
								<i className='fa fa-eyedropper' />
							</Button>
						</Col>
						<Col span={12} />
						<Col span={2}>
							<Select defaultValue='rgb' size='small' onChange={(value) => {
								this.setState({sliderMode: value});
							}}>
								<Select.Option value='rgb'>RGB</Select.Option>
								<Select.Option value='hsv'>HSV</Select.Option>
							</Select>
						</Col>
						<Col span={2} />
					</Row>
				</div>
			);
	}

	cleanBlocks() {
		var canvas = document.getElementById('palette');
		var width = this.state.width * this.state.pixelRatio, height = this.state.height * this.state.pixelRatio;
		var ctx = canvas.getContext("2d");
		ctx.fillStyle = this.state.bgColor;
		ctx.fillRect(0, height / 1.92, width, height);
	}

	getCurrentSelectedColor() {
		var currentColor = 'rgb(' + this.state.color0[0].toString() + ',' + this.state.color0[1].toString() + ',' + this.state.color0[2].toString() + ')';
		return currentColor;
	}

	drawSelectedColor() {
		var currentColor = this.getCurrentSelectedColor();
		var count = this.state.collectedColor;
		this.state.collectedColors[Math.round(count % 49)] = currentColor;
		this.state.collectedColor = this.state.collectedColor + 1;
		this._drawSelectableSquare(count, currentColor);
	}

	_drawSelectableSquare(num, color) {
		var canvas = document.getElementById('palette');
		var ctx = canvas.getContext("2d");
		var blockSize = parseInt(this.state.width / 8) * this.state.pixelRatio;
		var baseX = blockSize / 2;
		var baseY = this.state.height / 1.9 * this.state.pixelRatio;
		ctx.fillStyle = color;
		var offset_x = baseX + Math.round(num % 7) * blockSize
		var offset_y = baseY + parseInt(num % 49 / 7) * blockSize
		ctx.stokeStyle = this.state.bgColor;
		ctx.strokeRect(offset_x, offset_y, blockSize, blockSize);
		ctx.fillRect(offset_x, offset_y, blockSize, blockSize);
		ctx.stroke();
		this.drawRing(this.state.s, this.state.v, false, true);
	}

	procRGBStr(t) {
		t = t.replace('rgb(', '');
		t = t.replace(')', '');
		t = t.replace(' ', '');
		return t.split(',');
	}

	_selectColorBlock(x, y) {
		var num = this._coordTransform(x, y);
		if (num >= 0 && num < this.state.collectedColor) {
			this.state.selectedColor = this.state.collectedColors[num];
			var arr = this.procRGBStr(this.state.selectedColor);
			for (var i in arr) {
				arr[i] = parseInt(arr[i]);
				this.state.color0[i] = arr[i];
			}
		}
	}
	
	_coordTransform(x, y) {
		x -= this.state.baseX, y -= this.state.baseY;
		var offset_x = Math.floor(x / this.state.blockSize);
		var offset_y = Math.floor(y / this.state.blockSize);
		return (7 * offset_y) + offset_x;
	}

	renderColorBoard() {
		this.state.blockSize = parseInt(this.state.width / 8) * this.state.pixelRatio;
		this.state.baseX = this.state.blockSize / 2;
		this.state.baseY = this.state.height / 1.9 * this.state.pixelRatio;
		var canvas = document.getElementById('palette');
		var ctx = canvas.getContext("2d");
		var total_number = this.state.collectedColor;
		if (total_number > 49) total_number = 49;
		for(var i = 0; i < total_number; i++)
			this._drawSelectableSquare(i, this.state.collectedColors[i]);
		
		return ( 
			<div style={{ marginTop: 200 }}>
				<Row >
					<Col span={4} offset={1}>
						<Button size='small' ghost onClick={() => {
							this.props.selectPipette();
						}}>
							<i className='fa fa-eyedropper' />
						</Button>
					</Col>
					<Col span={2}>
						<Button ghost icon="plus" shape='circle' size="small" onClick = {() => this.drawSelectedColor()} />
					</Col>
				</Row>
			</div>
		);
	}

	render() {
		if (this.props.visibility != undefined && !this.props.visibility)
			return (<div><canvas id='palette' style={{visibility: 'hidden'}}/></div>);
		var panel;
		if (this.state.panelMode == 'slider')
			panel = this.renderSlider(this.state.sliderMode);
		else if (this.state.panelMode == 'collapsed')
			panel = (<div />);
		else
			panel = this.renderColorBoard();;
		let header = (
			<div>
				<Button style={{position:'absolute', top: 4, left: 5}} type="default" shape='circle' size='small' ghost onClick = {() => {
					this.props.closePalette();
				}}>
					<Icon type="close" />
				</Button>
				<Button style={{position:'absolute', top: 5, left: 24}} type="default" shape='circle' size='small' ghost onClick = {() => {
					this.state.collapsed = !this.state.collapsed;
					this.state.height = !this.state.collapsed ? this.state.height * 2.2 : this.state.height / 2.2;
					this.state.panelMode = 'collapsed';
					this.cleanBlocks();
					if (!this.state.collapsed)
						this.state.panelMode = 'slider';
					this.componentDidMount();
					this.forceUpdate();
				}}>
					<Icon type={this.state.collapsed ? 'down' : 'up'} />
				</Button>
			</div>
		);
		let components = this.state.collapsed ? header : (
			<div>
				{header}
				<Row style={{marginTop:this.state.wheelRadius * 2.25 / this.state.pixelRatio}}>
					<Col span={2} />
					<Col span={13}>
						<RadioGroup size='small' value={this.state.panelMode} onChange={(v) => {
							let { value } = v.target;
							this.setState({panelMode: value});
						}}>
							<RadioButton value='slider'><i className="fa fa-sliders" aria-hidden="true"></i></RadioButton>
							<RadioButton value='board'><i className="fa fa-th-large" aria-hidden="true"></i></RadioButton>
						</RadioGroup>
					</Col>
					<Col span={8}>
						<Input size='small' maxLength='7' value={this.state.webClrVal} onChange={(v) => {
							let { value } = v.target;
							this.state.webClrVal = value;
							if (value[0] != '#')
								value = '#' + value;
							value = value.toLowerCase();
							var str = new String(value);
							let reg = /^#([0-9a-fA-f]{6})$/;
							if (reg.test(str)) {
								var arr = this.procRGBStr(str.colorRgb().toLowerCase());
								for (var i in arr)
									this.state.color0[i] = parseInt(arr[i]);
								this.updateColor(this.state.color0, true, true, false);
							}
							this.forceUpdate();
						}}/>
					</Col>
				</Row>
				{panel}
			</div>
		);
		return (
			<div id='id_palette' className='UIPaletteInput'
				style={{boxShadow: '0 0 25px #888888', width:this.state.width, height:this.state.height,
						position:'absolute', left:this.state.left, top:this.state.top, zIndex: this.state.zIndex}}>
				<canvas id='palette' onTouchMove={this.handleTouchDrag} onTouchStart={this.handleTouchStart}
					onTouchEnd={this.handleDragEnd} onMouseDown={this.handleMouseStart} onMouseMove={this.handleMouseDrag}
					onMouseUp={this.handleDragEnd} onMouseLeave={this.handleDragEnd}
					style={{touchAction:'none', position:'absolute', visibility: 'visible' }}/>
				{components}
			</div>
		);
	}
}

const paletteReducer = (state = {}, action) => {
	switch (action.type) {
	case 'UPDATE_COLOR':
		if (ui) 
			if (action.select)
				ui.updateColor(action.color0, true, true, action.select, false);
			else ui.updateColor(action.color0, true, true, false, false);
		setColorCb(action.color0);
		return {...state, color0: action.color0};
	case 'PALETTE_OPEN':
		return {...state, visibility: true};
	case 'PALETTE_CLOSE':
		return {...state, visibility: false};
	default:
		return state;
	}
};

const mapDispatchToProps = (dispatch, ownProps) => {
	return {
		updateColor0: (color0) => {
			dispatch({
				type: 'UPDATE_COLOR',
				color0: [...color0]
			});
		},

		closePalette: () => {
			dispatch({
				type: 'PALETTE_CLOSE',
				visibility: false
			});
		},

		selectPipette: () => {
			dispatch({
				type: 'UPDATE_TOOLTIP_UI',
				selectedTool: 'picker'
			});
		}
	};
};

const mapStateToProps = (state, ownProps) => {
	setColorCb = state.palette.setColorCb;
	return {
		color0: state.palette.color0,
		visibility: state.palette.visibility,
		setColorCb: state.palette.setColorCb
	};
};

const Palette = connect(mapStateToProps, mapDispatchToProps)(UIPalette);

export { Palette, paletteReducer };