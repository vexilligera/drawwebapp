import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { Switch, Select, Collapse, Modal, Button, Menu, Layout, Row, Col, Input } from 'antd';
import { IntegerStep, TextSlide } from './gadgets';

const Panel = Collapse.Panel;
const InputGroup = Input.Group;
const Option = Select.Option;
const { SubMenu } = Menu;
const { Header, Content, Sider } = Layout;

const copySettings = (s) => {
	let l = [];
	for (var i = 0; i < s.length; ++i)
		l.push({...s[i]});
	return l;
}

var uibrushes = [], brushName = '';
var brush;

var updateBrushCb;

class UIBrushPreset extends React.Component {
	constructor(props) {
		super(props);
		uibrushes = copySettings(this.props.brushes);
		var s = this.props.brushes[0].name;
		this.state = { selectedBrush: s, input1: 'name', enableJitter: s.enableJitter,
						enableColorMixing: s.enableColorMixing };
	}

	getBrushList() {
		let l = [];
		for (var i = 0; i < uibrushes.length; ++i) {
			let s = uibrushes[i].name;
			l.push(<Menu.Item key={s}>{s}</Menu.Item>);
		}
		return l;
	}

	handleMenuSelect = (e) => {
		brushName = e.selectedKeys[0];
		// save current ui setting to uibrushes
		this.setState({selectedBrush: e.selectedKeys[0], input1: 'name'});
	}

	handleSlideChange = (name, value) => {
		if (name == 'density')
			brush.density = value / 100.0;
		else if (name == 'opacity')
			brush.opacity = value / 100.0;
		else if (name == 'polygon')
			brush.polygon = value;
		else if (name == 'mixThreshold') {
			if (brush.blendingMode == 'NORMAL' || brush.blendingMode == 'ERASER')
				brush.mixThreshold = value / 100.0;
			else if (brush.blendingMode == 'FILTER') {
				if (brush.filterType == 'gaussian')
					brush.kernelSize = Math.floor(value / 100.0 * 16);
			}
		}
		else if (name == 'mixStrength') {
			if (brush.blendingMode == 'NORMAL' || brush.blendingMode == 'ERASER')
				brush.mixStrength = value / 100.0;
			else if (brush.blendingMode == 'FILTER') {
				if (brush.filterType == 'gaussian')
					brush.sigma = value / 100 * 20;
			}
		}
		else if (name == 'pressureColorSensitivity')
			brush.pressureColorSensitivity = value / 100.0;
		else if (name == 'pressureSizeSensitivity')
			brush.pressureSizeSensitivity = value / 100.0;
		else if (name == 'innerThreshold')
			brush.innerThreshold = value / 100.0;
		else if (name == 'sizeJitter')
			brush.sizeJitter = value / 100.0;
		else if (name == 'positionJitter')
			brush.positionJitter = value / 100.0;
	}

	getBlendingMode(b) {
		if (b.blendingMode == 'NORMAL')
			return 'NORMAL';
		else if (b.blendingMode == 'ERASER')
			return 'ERASER';
		if (b.blendingMode == 'FILTER' && b.filterType == 'gaussian')
			return 'FILTER_BLUR';
	}

	getMixRadius(b) {
		if (b.blendingMode == 'NORMAL' || brush.blendingMode == 'ERASER')
			return b.mixThreshold * 100;
		if (b.blendingMode == 'FILTER' && b.filterType == 'gaussian')
			return b.kernelSize / 16 * 100;
	}

	getMixStrength(b) {
		if (b.blendingMode == 'NORMAL' || brush.blendingMode == 'ERASER')
			return b.mixStrength * 100;
		if (b.blendingMode == 'FILTER' && b.filterType == 'gaussian')
			return b.sigma / 20 * 100;
	}

	render() {
		var brushList = this.getBrushList();
		this.state.selectedBrush = brushName;
		console.log(brushName);

		for (var i = 0; i < uibrushes.length; ++i) {
			if (brushName == uibrushes[i].name) {
				brush = uibrushes[i];
				break;
			}
		}
		this.state.enableJitter = brush.enableJitter;

		return (
			<div>
				<Layout style={{ background: '#fff' }}>
					<Sider width={80} >
						<Menu
							mode="inline"
							selectedKeys={[this.state.selectedBrush]}
							style={{ height: '100%', borderRight: 0 }}
							onSelect={this.handleMenuSelect}
						>
							{brushList}
							<div style={{ textAlign: 'center '}}>
								<Button shape="circle" icon="plus" onClick={()=>{
									var s = 'No.' + (uibrushes.length + 1).toString();
									uibrushes.push({
										name: s,
										opacity: 1.0,
										density: 1.0,
										polygon: 32,
										pressureSizeSensitivity: 1.0,
										pressureColorSensitivity: 1.0,
										hotkey: 'x',
										innerThreshold: 1.0,
										blendingMode: 'NORMAL',
										enableColorMixing: false,
										mixThreshold: 0.5,
										mixStrength: 0.5,
										enableJitter: false,
										sizeJitter: 0.5,
										positionJitter: 0.5,
										tiltSensitivity: -1.0,
										texture: '',
										filterType: '',
										kernelSize: 1,
										sigma: 1.0
									});
									this.setState({...this.state});
								}}/>
							</div>
						</Menu>
					</Sider>
					<Content style={{ background: '#fff', marginLeft:6 }}>
						<Row style={{marginLeft:4, marginBottom: 6}}>
							<Col span={21}>
								<InputGroup compact>
									<Select
										defaultValue="name"
										onSelect = {(value, option) => {
											if (value == 'name') this.setState({input1: 'name'});
											else this.setState({input1: 'hotkey'});
										}}
										value = {this.state.input1}
									>
										<Option value="name">Name</Option>
										<Option value="hotkey">Hotkey</Option>
									</Select>
									<Input style={{ width: 100, textAlign: 'center' }} value={this.state.input1=='name'?brush.name:brush.hotkey} onChange={(e) => {
										let { value } = e.target;
										if (this.state.input1 == 'name') {
											brush.name = value;
											this.setState({selectedBrush: brush.name});
											brushName = brush.name;
										}
										else {
											brush.hotkey = value;
											this.setState({...this.state});
										}
									}}/>
								</InputGroup>
							</Col>
							<Col span={3}>
								<Button size='small' type='danger' icon="delete" onClick={this.addBrush}/>
							</Col>
						</Row>
						<IntegerStep name='opacity' titleText='Opacity' min={0} max={100} defaultVal={brush.opacity * 100} onChange={this.handleSlideChange} />
						<IntegerStep name='density' titleText='Density' min={0} max={500} defaultVal={brush.density * 100} onChange={this.handleSlideChange} />
						<IntegerStep name='polygon' titleText='Polygon' min={0} max={100} defaultVal={brush.polygon} onChange={this.handleSlideChange} />
						<Collapse style={{ background: '#fff', marginTop:8 }} defaultActiveKey={['size']} accordion>
							<Panel header='Size and texture' key="size">
								<TextSlide name='innerThreshold' titleText='Inner' min={0} max={100} defaultVal={brush.innerThreshold * 100}
									onChange={this.handleSlideChange} suffix='%' />
								<Row>
									<Col span={6}>
										Texture
									</Col>
									<Col span={17}>
										<Input size="small" value={brush.texture != '' ? brush.texture : '(None)'} onChange={(v) => {
											let {value} = v.target;
											brush.texture = value;
											this.forceUpdate();
										}}/>
									</Col>
								</Row>
							</Panel>
							<Panel header='Mixing' key="mixing">
								<Row>
									<Col span={18}>
										<span>Blending mode</span>
									</Col>
									<Col span={6}>
										<div style={{float:'right', marginTop: -6}}>
											<Select value={this.getBlendingMode(brush)} size='small' onChange={(value) => {
												brush.blendingMode = value;
												if (value == 'FILTER_BLUR') {
													brush.filterType = 'gaussian';
													brush.blendingMode = 'FILTER';
												}
												this.forceUpdate();
											}}>
												<Option value="NORMAL">Normal</Option>
												<Option value="FILTER_BLUR">Blur</Option>
												<Option value='ERASER'>Eraser</Option>
											</Select>
										</div>
									</Col>
								</Row>
								<Row style={{marginTop: 6, marginBottom: 4}}>
									<Col span={21}>
										<span>Enable color mixing</span>
									</Col>
									<Col span={3}>
										<Switch value={this.state.enableColorMixing} checked={brush.enableColorMixing} size='small' onChange={(checked) => {
											this.setState({enableColorMixing: checked});
											brush.enableColorMixing = checked;
										}}/>
									</Col>
								</Row>
								<TextSlide name='mixThreshold' titleText='Radius' min={0} max={100} defaultVal={this.getMixRadius(brush)} onChange={this.handleSlideChange} />
								<TextSlide name='mixStrength' titleText='Strength' min={0} max={100} defaultVal={this.getMixStrength(brush)} onChange={this.handleSlideChange} />
							</Panel>
							<Panel header={
										<div>
											<span>Jitter</span>
											<div style={{float: 'right', marginRight: 8}}>
												<Switch value = {this.state.enableJitter} checked={brush.enableJitter} onChange={(checked) => {
													this.setState({enableJitter: checked});
													brush.enableJitter = checked;
												}}/>
											</div>
										</div>
									}
									disabled={!this.state.enableJitter} key="jitter">
								<TextSlide name='sizeJitter' titleText='Size' min={0} max={100} defaultVal={brush.sizeJitter * 100} onChange={this.handleSlideChange}></TextSlide>
								<TextSlide name='positionJitter' titleText='Position' min={0} max={500} defaultVal={brush.positionJitter * 100} onChange={this.handleSlideChange}></TextSlide>
							</Panel>
							<Panel header='Hardware control' key="control">
								<div>
									<span>Pressure sensitivity</span>
									<TextSlide name='pressureColorSensitivity' titleText='Color' min={0} max={500} defaultVal={brush.pressureColorSensitivity * 100} onChange={this.handleSlideChange}></TextSlide>
									<TextSlide name='pressureSizeSensitivity' titleText='Radius' min={0} max={500} defaultVal={brush.pressureSizeSensitivity * 100} onChange={this.handleSlideChange}></TextSlide>
								</div>
								<br/>
								<div>
									<span>Tilt</span>
									<Row style={{marginTop: 6, marginBottom: 4}}>
										<Col span={21}>
											<span>Enable tilt shading</span>
										</Col>
										<Col span={3}>
											<Switch size='small' />
										</Col>
									</Row>
								</div>
							</Panel>
						</Collapse>
					</Content>
				</Layout>
			</div>
		);
	}
}

const brushPresetReducer = (state = {brushes: [], newSettings: []}, action) => {
	switch (action.type) {
	case 'LOAD_BRUSHES':
		brushName = '';
		uibrushes = copySettings(state.brushes);
		return {...state};
	case 'SET_PRESET_KEY':
		brushName = action.key;
		return state;
	case 'SAVE_SETTINGS':
		state = copySettings(uibrushes);
		updateBrushCb(state);
		return state;
	default:
		return state;
	}
};

const mapDispatchToProps = (dispatch, ownProps) => {
	return {
		updateBrushSettings: (newSettings) => {
			dispatch({
				type: 'LOAD_BRUSHES',
				newSettings
			});
		}
	};
};

const mapStateToProps = (state, ownProps) => {
	updateBrushCb = state.tooltipSelectReducer.updateBrushCb;
	return {
		selectedTool: state.tooltipSelectReducer.selectedTool,
		brushes: state.brushes,
		tooltipNotification: state.tooltipSelectReducer.tooltipNotification,
		updateBrushCb: state.tooltipSelectReducer.updateBrushCb
	};
};

const BrushPreset = connect(mapStateToProps, mapDispatchToProps)(UIBrushPreset);

export { BrushPreset, brushPresetReducer };