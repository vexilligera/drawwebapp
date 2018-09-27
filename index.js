import React from 'react';
import ReactDOM from 'react-dom';
import { Provider, connect } from 'react-redux';
import { combineReducers, createStore } from 'redux';

import { Tooltip, tooltipSelectReducer } from './ui/tooltip';
import { SettingMenu, settingMenuReducer } from './ui/settingmenu';
import { BrushPreset, brushPresetReducer } from './ui/brushpreset';
import { Palette, paletteReducer } from './ui/palette';
import { Layer, layerReducer } from './ui/layer';
import { FolderSetting, folderSettingReducer } from './ui/foldersetting';
import { BrushGeneralSettings, brushGeneralSettingsReducer } from './ui/generalsetting';
import { GestureSetting, gestureSettingReducer } from './ui/gesture';
import { HotkeySetting, hotkeySettingReducer } from './ui/hotkey';

import { Modal, message } from 'antd';

// parse url to get config url and file url.
// change localhost to 118.89.166.133
var url = 'config and file url in one';
var configUrl = 'http://localhost:3000/json';
var fileUrl = 'http://localhost:3000/mock.psd';

var config = new Config();
var PSD = acquire('psd');
var hotkeyCallback = {};
var layerTree, brushSet, canvasManager, undoManager, filter;

let initState = {};
let boundingBox = new BoundingBox('touchCanvas');
let colorPicker = new ColorPicker('touchCanvas');
let brushGesture = new BrushGesture('touchCanvas');

const reducers = combineReducers({
	tooltipSelectReducer: tooltipSelectReducer,
	settingMenuReducer: settingMenuReducer,
	brushes: brushPresetReducer,
	palette: paletteReducer,
	layer: layerReducer,
	brushGeneralSettings: brushGeneralSettingsReducer,
	folderSetting: folderSettingReducer,
	gestureSetting: gestureSettingReducer,
	hotkeySetting: hotkeySettingReducer
});
var store;

var globalState = {
	'drawing': false,
	'selectedLayer': -1,	// currently selected nodeId
	'selectedNode': null,	// instance of the node
	'toolType': 'hand',
	'nTouch': 0,
	'radius': 10 / 500,
	'opacity': 1.0,
	'pointerMode': 'hand',
	'clipLogger': [],
	'pickingColor': false,
	'lastTouch': 0
};

const App = () => {
	return (
		<div>
			<Tooltip style={{ position: 'absolute', marginTop: 30, marginLeft: 30 }} />
			<SettingMenu />
			<FolderSetting />
			<Palette style={{width:200, height:460, zIndex: 2}} />
			<Layer style={{width:200, height:460, zIndex: 3}} />
		</div>
	);
}

function setInputMode(type) {
	globalState.pointerMode = type;
}

function setBrushOpacity(opacity) {
	globalState.opacity = opacity;
	brushSet.color0[3] = opacity;
}

function setBrushRadius(radius) {
	globalState.radius = radius;
	brushSet.setRadius(radius);
	canvasManager.setRadius(radius);
	canvasManager.updateDisplay(canvasManager.width / 2 / canvasManager.pixelRatio,
								canvasManager.height / 2 / canvasManager.pixelRatio, false);
}

function connectionErrorDialog() {
	Modal.error({
		title: 'Connection error',
		content: 'Cannot connect to the server, click to reconnect.',
		onOk() {
			location.reload();
		}
	});
}

function loadGestureSetting(config) {
	brushGesture.controlSaturation = config.gesture.fingerPan3Horizontal;
	brushGesture.controlBrightness = config.gesture.fingerPan3Vertical;
	brushGesture.controlHue = config.gesture.fingerRotate3;
	brushGesture.controlSize = config.gesture.fingerPinch3;
	canvasManager.controlZoom = config.gesture.fingerPinch2;
	canvasManager.controlRotation = config.gesture.fingerRotate2;
}

function updateLayerPanel(val = true) {
	store.dispatch({type:'UPDATE_LAYER_PANEL', payload: val});
}

function undo(type = 'undo') {
	let step = undoManager.undo();
	if (step.type == 'delete' || step.type == 'add')
		updateLayerPanel(false);
	else if (step.type == 'area') {
		layerTree.composite();
		canvasManager.updateDisplay();
	}
	else if (step.type == 'merge') {
		updateLayerPanel(false);
		globalState.selectedNode = null;
		globalState.selectedLayer = -1;
	}
	else if (step.type == 'merge_down') {
		layerTree.moveNode(step.children[1].nodeId, step.data.parent.nodeId, step.pos);
		layerTree.moveNode(step.children[0].nodeId, step.data.parent.nodeId, step.pos);
		layerTree.removeNode(step.data.nodeId);
		updateLayerPanel(false);
		globalState.selectedNode = null;
		globalState.selectedLayer = -1;
	}
	canvasManager.canvas.focus();
}

function changeBrushRadius(delta) {
	globalState.radius += delta;
	if (globalState.radius <= 1 / 500)
		globalState.radius = 1 / 500;
	else if (globalState.radius >= 1 / 2)
		globalState.radius = 1 / 2;
	setBrushRadius(globalState.radius);
}

function brushThinner(type = 'thinner', step = -1) {
	if (step == -1) {
		if (globalState.radius < 20 / 500)
			step = -1.0 / 500;
		else
			step = -2.0 / 500;
	}
	changeBrushRadius(step);
}

function brushThicker(type = 'thicker', step = -1) {
	if (step == -1) {
		if (globalState.radius < 20 / 500)
			step = 1.0 / 500;
		else
			step = 2.0 / 500;
	}
	changeBrushRadius(step);
}

function setPaletteColor(color, select = false) {
	store.dispatch({ type: 'UPDATE_COLOR', color0: color, select });
}

function pickColor(type = 'pipette') {
	canvasManager.setOnKeyUp(function() {
		globalState.pickingColor = false;
		colorPicker.setVisible(false);
		setPaletteColor(globalState.colorPickerColor, true);
	});
	colorPicker.setVisible(true);
	globalState.pickingColor = true;
}

function doPickColor(input) {
	var x, y;
	if (input.isLeftDown)
		x = input.mouseOffsetX, y = input.mouseOffsetY;
	else if (input.touches.length > 0)
		x = input.touches[0].offsetX, y = input.touches[0].offsetY;
	else if (input.penPressure > 0)
		x = input.penOffsetX, y = input.penOffsetY;
	else {
		globalState.pickColor = false;
		colorPicker.setVisible(false);
		return 'stop';
	}
	let coord = canvasManager.normalizeCoord(x, y);
	let sampler = layerTree.root;
	let newColor = sampler.getColor(coord.x, coord.y);
	for (let i = 0; i < 3; ++i)
		newColor[i] = Math.round(newColor[i] * newColor[3] / 255);
	x *= canvasManager.pixelRatio, y *= canvasManager.pixelRatio;
	let nc = 'rgb(' + newColor[0].toString() + ',' + newColor[1].toString() 
			+ ',' + newColor[2].toString() + ')';
	let oc = 'rgb(';
	for (let i = 0; i < 3; ++i) {
		let c = i != 2 ? ',' : ')';
		oc += Math.round(brushSet.color0[i] * 255).toString() + c;
	}
	colorPicker.drawRing(x, y, oc, nc);
	globalState.colorPickerColor = newColor;
	return 'picking';
}

function mapHotkeyCallback(hc) {
	for (var i in config.keyMap)
		hc[i] = null;
	hc['thinner'] = brushThinner;
	hc['thicker'] = brushThicker;
	hc['undo'] = undo;
	hc['pipette'] = pickColor;
	hc['magnify'] = zoomIn;
	hc['minify'] = zoomOut;
	for (let i = 0; i < brushSet.brushes.length; ++i) {
		hc[brushSet.brushes[i].name] = selectBrush;
	}
}

let tooltipCallback = {
	undo: undo,
	thicker: brushThicker,
	thinner: brushThinner,
	selectBrush: selectBrush
};

function selectLayer(layerId) {
	globalState.selectedLayer = layerId;
	globalState.selectedNode = layerTree.selectNode(layerId);
}

function setToolType(type) {
	if (type != 'palette' && type != 'layer' && type != 'settings')
		globalState.toolType = type;
	if (type == 'eraser' || type == 'brush') {
		globalState.toolType = 'brush';
		colorPicker.setVisible(false);
		globalState.pickingColor = false;
	}
	if (type == 'picker') {
		globalState.pickingColor = true;
		colorPicker.setVisible(true);
	}
	if (type == 'rotate') {

	}
}

function updateBrushSet(newBrushSet) {
	config.brushSet = newBrushSet;
	brushSet.loadBrushes(config.brushSet, true);
	mapHotkeyCallback(hotkeyCallback);
}

function setColor(color = store.getState().palette.color0) {
	brushSet.color0 = [color[0] / 255, color[1] / 255, color[2] / 255, 1.0];
}

function selectBrush(brushName, updateUI = true) {
	for (var i = 0; i < brushSet.brushes.length; ++i) {
		if (brushSet.brushes[i].name == brushName) {
			brushSet.selectBrush(i);
			if (updateUI) {
				store.dispatch({type: 'UPDATE_TOOLTIP_UI', selectedTool: brushName});
				store.dispatch({
					type: 'TOOLTIP_SELECT_TOOL',
					selectedTool: brushName
				});
			}
			break;
		}
	}
	if (brushName == '*eraser*') {
		for (var i = 0; i < brushSet.brushes.length; ++i)
			if (brushSet.brushes[i].blendingMode == 'ERASER') {
				brushSet.selectBrush(i);
			}
	}
	globalState.toolType = 'brush';
}

function endDrawing() {
	globalState.drawing = false;
	brushSet.endStroke();
	layerTree.composite();
	canvasManager.updateDisplay();
}

function zoomIn(type = 'magnify', rate = 0.1) {
	canvasManager.adjustPerspective(0.0, 0.0, rate, 0);
	canvasManager.updateDisplay();
}

function zoomOut(type = 'minify', rate = -0.1) {
	canvasManager.adjustPerspective(0.0, 0.0, rate, 0);
	canvasManager.updateDisplay();
}

function brushPressureCb(input) {
	var coord = canvasManager.normalizeCoord(input.penOffsetX, input.penOffsetY);
	var p = input.penPressure;
	var t = new Date().getTime();
	var tx = input.penTiltX;
	var ty = input.penTiltY;
	if (!globalState.drawing) {
		if (globalState.selectedLayer > 0) {
			brushSet.beginStroke(globalState.selectedLayer);
			globalState.drawing = true;
		}
		else {
			message.warning('Please select a drawable layer first.');
			return;
		}
	}
	brushSet.color0[3] = globalState.opacity;
	var rect = brushSet.strokeTo(coord.x, coord.y, p, tx, ty, brushSet.color0, t, globalState.radius);
	layerTree.composite(rect);
	canvasManager.updateDisplay(input.penOffsetX, input.penOffsetY);
}

function pointerDrawCb(input) {
	var x, y, f = false;
	if (input.isLeftDown)
		x = input.mouseOffsetX, y = input.mouseOffsetY, f = true;
	else if (input.touches.length == 1)
		x = input.touches[0].offsetX, y = input.touches[0].offsetY, f = true;
	else if (input.touches == 0 && !input.isLeftDown && globalState.drawing) {
		endDrawing();
		canvasManager.updatePointerInput(input);
	}
	if (f) {
		var coord = canvasManager.normalizeCoord(x, y);
		var p = 1.0, tx = 0.0, ty = 0.0, t = new Date().getTime();
		if (!globalState.drawing) {
			if (globalState.selectedLayer > 0) {
				brushSet.beginStroke(globalState.selectedLayer);
				globalState.drawing = true;
			}
			else {
				message.warning('Please select a drawable layer first.');
				return;
			}
		}
		brushSet.color0[3] = globalState.opacity;
		var rect = brushSet.strokeTo(coord.x, coord.y, p, tx, ty, brushSet.color0, t, globalState.radius);
		layerTree.composite(rect);
		canvasManager.updateDisplay();
	}
}

function clip(input) {
	let end = function() {
		globalState.drawing = false;
		globalState.mouseDown = false;
		globalState.penDown = false;
		if (globalState.clipLogger.length >= 8) {
			let newLayer = globalState.selectedNode.selectArea(globalState.clipLogger, true);
			newLayer.name = '*Area*';
			layerTree.addExistingNode(layerTree.positionById(globalState.selectedNode.nodeId),
										globalState.selectedNode.parent.nodeId, newLayer);
			updateLayerPanel();
			boundingBox.setVisible(true);
			var c1 = canvasManager.pixelCoord(globalState._left, globalState._top);
			var c2 = canvasManager.pixelCoord(globalState._right, globalState._top);
			var c3 = canvasManager.pixelCoord(globalState._left, globalState._bottom);
			var c4 = canvasManager.pixelCoord(globalState._right, globalState._bottom);
			boundingBox.setVertex(0, c1.x, c1.y);
			boundingBox.setVertex(1, (c1.x + c2.x) / 2, (c1.y + c2.y) / 2);
			boundingBox.setVertex(2, c2.x, c2.y);
			boundingBox.setVertex(3, (c1.x + c3.x) / 2, (c1.y + c3.y) / 2);
			boundingBox.setVertex(4, (c1.x + c4.x) / 2, (c1.y + c4.y) / 2);
			boundingBox.setVertex(5, (c2.x + c4.x) / 2, (c2.y + c4.y) / 2);
			boundingBox.setVertex(6, c3.x, c3.y);
			boundingBox.setVertex(7, (c3.x + c4.x) / 2, (c3.y + c4.y) / 2);
			boundingBox.setVertex(8, c4.x, c4.y);
			boundingBox.show();
			filter.selectLayer(newLayer);
			filter.startWarp();
			boundingBox.setOnChange(function(grid) {
				var box = new Float32Array(18);
				var cnt = 0;
				for (var i = 0; i < 9; ++i) {
					var coord = canvasManager.normalizeCoord(grid[i].x / canvasManager.pixelRatio,
															grid[i].y / canvasManager.pixelRatio);
					box[cnt++] = coord.x;
					box[cnt++] = coord.y;
				}
				filter.updateWarp(box);
				layerTree.composite();
				canvasManager.updateDisplay();
			});
			boundingBox.setOnOut(function() {
				filter.endWarp();
				boundingBox.setVisible(false);
			});
		}
	};

	if (!globalState.drawing && (input.isLeftDown || input.penPressure > 0)) {
		globalState.drawing = true;
		globalState.clipLogger = [];
		globalState._segment = [];
		globalState._left = 65536, globalState._right = -65536;
		globalState._top = 65536, globalState._bottom = -65536;
		if (input.isLeftDown)
			globalState.mouseDown = true;
		else if (input.penPressure > 0)
			globalState.penDown = true;
	}
	else if (globalState.drawing && !input.isLeftDown && input.penPressure <= 0) {
		end();
	}
	if (globalState.drawing) {
		if (globalState.selectedLayer <= 0) {
			end();
			message.warning('Please select the desired layer first.');
		}
		var x, y;
		if (globalState.mouseDown) {
			x = input.mouseOffsetX;
			y = input.mouseOffsetY;
		}
		else if (globalState.penPressure > 0) {
			x = input.penOffsetX;
			y = input.penOffsetY;
		}
		else {
			x = input.penOffsetX;
			y = input.penOffsetY;
		}
		var nc = canvasManager.normalizeCoord(x, y);
		if (nc.x > 1.0) nc.x = 1.0;
		else if (nc.x < -1.0) nc.x = -1.0;
		if (nc.y > 1.0) nc.y = 1.0;
		else if (nc.y < -1.0) nc.y = -1.0;
		if (nc.x < globalState._left)
			globalState._left = nc.x;
		else if (nc.x > globalState._right)
			globalState._right = nc.x;
		if (nc.y < globalState._top)
			globalState._top = nc.y;
		else if (nc.y > globalState._bottom)
			globalState._bottom = nc.y;
		let coord = canvasManager.normalizeCoord(x, y, true);
		coord.x = coord.x < 0 ? 0 : coord.x;
		coord.x = coord.x > layerTree.canvasWidth ? layerTree.canvasWidth : coord.x;
		coord.y = coord.y < 0 ? 0 : coord.y;
		coord.y = coord.y > layerTree.canvasHeight ? layerTree.canvasHeight : coord.y;
		coord.x = Math.round(coord.x), coord.y = Math.round(coord.y);
		globalState.clipLogger.push(coord.x, coord.y);
		globalState._segment.push(x * canvasManager.pixelRatio / canvasManager.width * 2 - 1.0);
		globalState._segment.push(1.0 - y * canvasManager.pixelRatio / canvasManager.height * 2);
		canvasManager.drawLine(new Float32Array(globalState._segment), globalState._segment.length / 2, [0, 0, 0, 1]);
	}
}

function doubleTapGesture(input) {
	if (config.gesture.doubleTap)
		undo();
}

function onTouch(input) {
	let dynamics = canvasManager.pointerDynamics;
	switch (input.touches.length) {
	case 3:
		if (globalState.nTouch != 3) {
			brushGesture.setVisible(true);
			let r = canvasManager.getPixelRadius();
			let color  = new Array(3);
			for (let i = 0; i < 3; ++i)
				color[i] = Math.round(brushSet.color0[i] * 255);
			brushGesture.setState(color, r);
		}
		else {
			brushGesture.drawWheel(input, dynamics);
			setBrushRadius(canvasManager.getNormalizedRadius(brushGesture.size));
		}
		globalState.nTouch = 3;
		break;
	case 2:
		if (globalState.nTouch == 3) {
			brushGesture.setVisible(false);
			setColor(brushGesture.color);
			setPaletteColor(brushGesture.color, true);
		}
		else {
			canvasManager.adjustPerspective();
			canvasManager.updateDisplay();
		}
		globalState.nTouch = 2;
		break;
	case 1:
		let time = new Date().getTime();
		if (time - globalState.lastTouch < 300 && time - globalState.lastTouch > 100)
			doubleTapGesture(input);
		globalState.lastTouch = time;
		break;
	default:
		break;
	}
}

function onPointerInput(pointerInputModel) {
	var tool = globalState.toolType;
	if (!globalState.drawing) {
		let x = pointerInputModel.mouseOffsetX > 0 ?
				pointerInputModel.mouseOffsetX : pointerInputModel.penOffsetX;
		let y = pointerInputModel.mouseOffsetY > 0 ?
				pointerInputModel.mouseOffsetY : pointerInputModel.penOffsetY;
		window.requestAnimationFrame(function() { canvasManager.updateDisplay(x, y, false); });
	}
	if (globalState.pickingColor || tool == 'picker') {
		tool = 'picker';
		let state = doPickColor(pointerInputModel);
		if (state == 'stop' && tool == 'picker')
			setPaletteColor(globalState.colorPickerColor, true);
		else if (state == 'picking' && !colorPicker.visible)
			colorPicker.setVisible(true);
	}
	else if (tool == 'zoom in' && canvasManager.scale < 8.0) {
		if (pointerInputModel.isLeftDown || pointerInputModel.penPressure > 0 
			|| pointerInputModel.touches.length == 1) {
			zoomIn();
		}
	}
	else if (tool == 'zoom out' && canvasManager.scale > 0.25) {
		if (pointerInputModel.isLeftDown || pointerInputModel.penPressure > 0 
			|| pointerInputModel.touches.length == 1) {
			zoomOut();
		}
	}
	if (pointerInputModel.dxScroll != 0 || pointerInputModel.dyScroll != 0) {
		canvasManager.adjustPerspective(-pointerInputModel.dxScroll, -pointerInputModel.dyScroll, 0, 0);
		canvasManager.updateDisplay();
		pointerInputModel.dxScroll = 0, pointerInputModel.dyScroll = 0;
	}
	if (pointerInputModel.penPressure <= 0 && pointerInputModel.touches.length > 0
			&& globalState.pointerMode == 'hand') {
		canvasManager.updatePointerInput(pointerInputModel);
		onTouch(pointerInputModel);
	}
	if (tool == 'arbitrary_lasso')
		clip(pointerInputModel);
	else if (pointerInputModel.penPressure > 0 && tool == 'brush') {
		brushPressureCb(pointerInputModel);
	}
	else if (globalState.pointerMode == 'mouse' && tool == 'brush')
		window.requestAnimationFrame(function() { pointerDrawCb(pointerInputModel); });
	else if (pointerInputModel.penPressure <= 0 && globalState.drawing && tool == 'brush') {
		endDrawing();
		canvasManager.updatePointerInput(pointerInputModel);
	}
	else {
		canvasManager.updatePointerInput(pointerInputModel);
	}
	if (pointerInputModel.isLeftDown && !globalState.drawing) {
		canvasManager.updatePointerInput(pointerInputModel);
	}
}

function onSettingsLoaded(response) {
	if (!response)
		connectionErrorDialog();
	PSD.fromURL(fileUrl).then(function(psd) {
		if (isNaN(psd.file.pos))
			connectionErrorDialog();
		canvasManager = new CanvasManager('mainCanvas', config.keyMap, hotkeyCallback);
		layerTree = new LayerTree(canvasManager, psd.header.cols, psd.header.rows, 
									window.devicePixelRatio || 1);
		undoManager = new UndoManager(canvasManager);
		layerTree = parsePSD(canvasManager, psd, function() {
			layerTree.composite();
			layerTree.canvasManager = canvasManager;
			canvasManager.originalView();
			canvasManager.updateDisplay();
			canvasManager.setPointerStateUpdateCallback(onPointerInput);
			canvasManager.setRadius(globalState.radius);
			brushSet = new BrushSet(layerTree);
			brushSet.loadBrushes(config.brushSet, true);
			brushSet.setRadius(globalState.radius);
			brushSet.bindUndoManager(undoManager);
			mapHotkeyCallback(hotkeyCallback);
			filter = new Filter(layerTree);
			initState = {
				tooltipSelectReducer: {currentBrushId: 0, selectBrushCb: selectBrush, shortcutCb: tooltipCallback,
										setInputModeCb: setInputMode, updateBrushCb: updateBrushSet,
										setToolTypeCb: setToolType, canvasManager: canvasManager},
				brushes: config.brushSet,
				palette: {color0: [0, 0, 0, 1], visibility: false, setColorCb: setColor},
				layer: {layerTree: layerTree, activeLayer: -1, selectLayerCb: selectLayer},
				brushGeneralSettings: {opacity: 100, radius: 30, globalState: globalState,
										setRadiusCb: setBrushRadius, setOpacityCb: setBrushOpacity},
				folderSetting: {selectedLayers: []},
				gestureSetting: {config: config, loadGestureSetting: loadGestureSetting},
				hotkeySetting: {config: config, keyThicker: 'default', keyThiner: 'default', keyZoomIn: 'default',
								keyZoomOut: "default", keyPipette: "default", keyUndo: 'default'}
			};
			
			store = createStore(reducers, initState);
			ReactDOM.render(
				<Provider store = {store}>
					<App />
				</Provider>,
				document.getElementById('root')
			);
			store.dispatch({type:'UPDATE_LAYERTREE', payload: layerTree});
			loadGestureSetting(config);
		});
	});
}

function loadConfig(config, url) {
	config.setConfigUrl(url);
	config.loadSettings(onSettingsLoaded);
	//config.setId();
	//config.saveSettings();
}

loadConfig(config, configUrl);