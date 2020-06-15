import React from 'react';
import ReactDOM from 'react-dom';
import { Menu, Icon, Button, Col, Row } from 'antd';
import { connect } from 'react-redux';
import './tooltip.less';

const SubMenu = Menu.SubMenu;

let ui = null;
let setToolType = null;

class UITooltip extends React.Component {
	constructor(props) {
		super(props);
		this.style = props.style;
		this.state = {toggled: true, selectedTool: 'hand', shortcutToggled: false};
		ui = this;
		setToolType = props.setToolTypeCb;
		this.iconMap = {};
		this.iconMap['hand'] = 'fa fa-hand-paper-o';
		this.iconMap['mouse'] = 'fa fa-mouse-pointer';
		this.iconMap['eraser'] = 'fa fa-eraser';
		this.iconMap['lasso'] = 'fa fa-scissors';
		this.iconMap['zoom'] = 'fa fa-search';
		let s = this.props.brushes[0].name;
		var icon;
		if (s.indexOf('pencil') >= 0 || s.indexOf('Pencil') >= 0) {
			icon = 'fa fa-pencil';
			this.iconMap[s] = 'fa fa-pencil';
		}
		else {
			icon = 'fa fa-paint-brush';
			this.iconMap[s] = 'fa fa-paint-brush';
		}

		this.itemMap = {};
		this.itemMap['pointer'] = 'hand';
		this.itemMap['lasso'] = 'arbitrary';
		this.itemMap['eraser'] = 'eraser';
		this.itemMap['brush'] = s;
	}

	setSelectedTool = (selectedTool) => {
		return {
			type: 'TOOLTIP_SELECT_TOOL',
			selectedTool
		};
	}

	notify = (eventType) => {
		return {
			type: 'TOOLTIP_NOTIFY',
			eventType
		};
	}

	animate = () => {
		this.setState({
			opacity: this.state.opacity + this.stepOpacity,
			menuTop: this.state.menuTop + this.stepTop
		});
		if (Math.abs(this.state.opacity - this.finalOpacity) < 0.01)
			this.animateDone = true;
		if (this.animateDone) {
			clearInterval(this.timerID);
			this.setState({
				opacity: this.finalOpacity,
				menuTop: this.finalMenuTop,
				visibility: this.state.toggled ? 'visible' : 'hidden',
				display: this.state.toggled ? 'inherit' : 'none'
			});
		}
	}

	handleButtonClick = () => {
		if (this.state.toggled) {
			this.stepOpacity = -0.05;
			this.stepTop = -0.8;
			this.state.opacity = 1.0;
			this.state.menuTop = 0.0;
			this.finalOpacity = 0.0;
			this.finalMenuTop = -16;
		}
		else {
			this.stepOpacity = 0.05;
			this.stepTop = 0.8;
			this.state.opacity = 0.0;
			this.state.menuTop = -16;
			this.finalOpacity = 1.0;
			this.finalMenuTop = 0;
		}
		this.setState({
			toggled: !this.state.toggled,
			visibility: 'visible'
		});
		this.animateDone = false;
		this.timerID = setInterval(
			() => this.animate(),
			1
		);
	}

	isBrush = (s) => {
		for (var i = 0; i < this.props.brushes.length; ++i) {
			let name = this.props.brushes[i].name;
			if (s == name)
				return true;
		}
		return false;
	}

	handleMenuSelect = (e) => {
		if (e.key == 'hand' || e.key == 'mouse') {
			this.props.setInputModeCb(e.key);
			this.itemMap['pointer'] = e.key;
		}
		else if (e.key == 'eraser') {
			this.props.selectBrushCb('*eraser*', false);
		}
		else if (this.isBrush(e.key)) {
			this.itemMap['brush'] = e.key;
			this.props.setToolTypeCb('brush');
			this.props.dispatchEvent(this.setSelectedTool(e.key));
			this.props.selectBrushCb(e.key, false);
			this.setState({selectedTool: e.key});
			return
		}
		if (e.key != 'settings') {
			if (e.key == 'palette')
				this.props.dispatchEvent({type: 'PALETTE_OPEN', open: true});
			else if (e.key == 'layer')
				this.props.dispatchEvent({type: 'LAYER_PANEL_OPEN', open: true});
			else {
				this.setState({selectedTool: e.key});
				this.props.dispatchEvent(this.setSelectedTool(e.key));
			}
		}
		else {
			this.props.dispatchEvent(this.notify('settings open'));
		}
		this.props.setToolTypeCb(e.key);
	}

	handleSubMenuSelect = (e) => {
		this.setState({selectedTool: this.itemMap[e.key]});
		this.props.dispatchEvent(this.setSelectedTool(this.itemMap[e.key]));
		this.props.setToolTypeCb(e.key);
		if (this.isBrush(this.itemMap[e.key])) {
			this.props.selectBrushCb(this.itemMap[e.key], false);
		}
	}

	getBrushes = () => {
		let l = [];
		for (var i = 0; i < this.props.brushes.length; ++i) {
			let s = this.props.brushes[i].name;
			var icon;
			if (s.indexOf('pencil') >= 0 || s.indexOf('Pencil') >= 0) {
				icon = 'fa fa-pencil';
				this.iconMap[s] = 'fa fa-pencil';
			}
			else if (s.indexOf('eraser') >= 0 || s.indexOf('Eraser') >= 0) {
				icon = 'fa fa-eraser';
				this.iconMap[s] = 'fa fa-eraser';
			}
			else {
				icon = 'fa fa-paint-brush';
				this.iconMap[s] = 'fa fa-paint-brush';
			}
			l.push(
				<Menu.Item key={s}>
					<i class="anticon" ><i className={icon} /></i>
					<span>{s}</span>
				</Menu.Item>
			);
		}
		return l;
	}

	render() {
		let panel = (<div />);
		if (this.state.selectedTool == 'rotate')
			panel = (
				<div>
					<Col span={6}>
						<Button onClick={()=>{
							this.props.canvasManager.adjustPerspective(0, 0, 0, -5 / 180 * Math.PI);
							this.props.canvasManager.updateDisplay();
						}}>
							<Icon type="left" />
						</Button>
					</Col>
					<Col span={6}>
						<Button onClick={()=>{
							this.props.canvasManager.originalView();
							this.props.canvasManager.updateDisplay();
						}}>
							<Icon type="retweet" />
						</Button>
					</Col>
					<Col span={6}>
						<Button onClick={()=>{
							this.props.canvasManager.adjustPerspective(0, 0, 0, 5 / 180 * Math.PI);
							this.props.canvasManager.updateDisplay();
						}}>
							<Icon type="right" />
						</Button>
					</Col>
				</div>
			);
		else if (this.state.shortcutToggled)
			panel = (
				<div>
					<Col span={5}>
						<Button onClick={()=>{
							this.props.shortcutCb.thinner();
							this.props.canvasManager.updateDisplay();
						}}>
							[
						</Button>
					</Col>
					<Col span={6}>
						<Button onClick={()=>{
							this.props.shortcutCb.undo();
							this.props.canvasManager.updateDisplay();
						}}>
							<Icon type="step-backward" />
						</Button>
					</Col>
					<Col span={7}>
						<Button onClick={()=>{
							console.log(this.state._prevBrush, this.state.prevBrush);
							if (this.state.prevBrush == this.state._prevBrush)
								this.state.prevBrush = '*eraser*';
							else this.state.prevBrush = this.state._prevBrush;
							this.props.shortcutCb.selectBrush(this.state.prevBrush);
							this.forceUpdate();
						}}>
							{this.state.prevBrush == '*eraser*' ? (<i class="anticon" ><i className='fa fa-eraser' /></i>)
															: (<i class="anticon" ><i className='fa fa-paint-brush' /></i>)}
						</Button>
					</Col>
					<Col span={6}>
						<Button onClick={()=>{
							this.props.shortcutCb.thicker();
							this.props.canvasManager.updateDisplay();
						}}>
							]
						</Button>
					</Col>
				</div>
			);
		let width = this.state.selectedTool == 'rotate' || this.state.shortcutToggled ? 250 : 50;
		return (
			<div className='UITooltip' style={this.style}>
				<Row style={{width}}>
					<Col span={6}>
						<Button type={this.state.toggled ? 'border' : 'primary'} onClick={this.handleButtonClick} style={{marginBottom: 16}}>
							<Icon type={this.state.toggled ? 'menu-unfold' : 'menu-fold'} />
						</Button>
					</Col>
					<Col span={18}>
						{panel}
					</Col>
				</Row>
				<Menu style={{opacity: this.state.opacity, marginTop: this.state.menuTop, visibility: this.state.visibility, display: this.state.display}}
					selectedKeys={[this.state.selectedTool]} onClick={(e) => {
						if (this.isBrush(this.state.selectedTool)) {
							this.state.prevBrush = '*eraser*';
							this.state._prevBrush = this.state.selectedTool;
						}
						else {
							this.state.prevBrush = '*eraser*';
							this.state._prevBrush = '*eraser*';
						}
						if (e.key == 'shortcut')
							this.setState({shortcutToggled: !this.state.shortcutToggled});
					}}
					defaultSelectedKeys={['hand']} mode="inline" theme="dark" inlineCollapsed={true} onSelect={this.handleMenuSelect}>
					<SubMenu onTitleClick={this.handleSubMenuSelect} key='pointer' title={<i class="anticon" ><i className={this.iconMap[this.itemMap['pointer']]} /></i>}>
						<Menu.Item key='hand'>
							<i class="anticon" ><i className='fa fa-hand-paper-o' /></i>
							<span>Touch</span>
						</Menu.Item>
						<Menu.Item key='mouse'>
							<i class="anticon" ><i className='fa fa-mouse-pointer' /></i>
							<span>Mouse</span>
						</Menu.Item>
					</SubMenu>
					<Menu.Item key='arbitrary_lasso'>
						<i class="anticon" ><i className='fa fa-scissors' /></i>
						<span>Lasso</span>
					</Menu.Item>
					<Menu.Item key='eraser'>
						<i class="anticon" ><i className='fa fa-eraser' /></i>
						<span>Eraser</span>
					</Menu.Item>
					<SubMenu onTitleClick={this.handleSubMenuSelect} key='brush' title={<i class="anticon" ><i className={this.iconMap[this.itemMap['brush']]} /></i>}>
						{this.getBrushes()}
					</SubMenu>
					<Menu.Item key='picker'>
						<i class="anticon" ><i className='fa fa-eyedropper' /></i>
						<span>Color picker</span>
					</Menu.Item>
					<Menu.Item key='palette'>
						<i class="anticon" ><i className='fa fa-tachometer' /></i>
						<span>Palette</span>
					</Menu.Item>
					<SubMenu key='zoom' title={<i class="anticon" ><i className={this.iconMap['zoom']} /></i>}>
						<Menu.Item key='zoom in'>
							<span>Zoom in</span>
						</Menu.Item>
						<Menu.Item key='zoom out'>
							<span>Zoom out</span>
						</Menu.Item>
						<Menu.Item key='rotate'>
							<span>Rotate</span>
						</Menu.Item>
					</SubMenu>
					<Menu.Item key='layer'>
						<i class="anticon" ><i className='fa fa-clone' /></i>
						<span>Layers</span>
					</Menu.Item>
					<Menu.Item key='shortcut'>
						<i class="anticon" ><i className='fa fa-keyboard-o' /></i>
						<span>Shortcut</span>
					</Menu.Item>
					<Menu.Item key='settings'>
						<i class="anticon" ><i className='fa fa-cog' /></i>
						<span>Settings</span>
					</Menu.Item>
				</Menu>
			</div>
		);
	}
}

const tooltipSelectReducer = (state = {selectedTool: 'hand', tooltipNotification: 'settings close'}, action) => {
	switch (action.type) {
	case 'TOOLTIP_SELECT_TOOL':
		return {
			...state,
			selectedTool: action.selectedTool
		};
	case 'UPDATE_TOOLTIP_UI':
		if (ui) {
			ui.setState({selectedTool: action.selectedTool});
			if (setToolType)
				setToolType(action.selectedTool);
		}
		return state;
	case 'TOOLTIP_NOTIFY':
		return {
			...state,
			tooltipNotification: action.eventType
		};
	default:
		return state;
	}
}

const mapDispatchToProps = (dispatch, ownProps) => {
	return {
		dispatchEvent: (e) => {
			dispatch(e);
		}
	};
};

const mapStateToProps = (state, ownProps) => {
	return {
		selectedTool: state.tooltipSelectReducer.selectedTool,
		tooltipNotification: state.tooltipSelectReducer.tooltipNotification,
		brushes: state.brushes,
		currentBrushId: state.tooltipSelectReducer.currentBrushId,
		selectBrushCb: state.tooltipSelectReducer.selectBrushCb,
		setToolTypeCb: state.tooltipSelectReducer.setToolTypeCb,
		setInputModeCb: state.tooltipSelectReducer.setInputModeCb,
		canvasManager: state.tooltipSelectReducer.canvasManager,
		shortcutCb: state.tooltipSelectReducer.shortcutCb
	};
};

const Tooltip = connect(mapStateToProps, mapDispatchToProps)(UITooltip);

export { Tooltip, tooltipSelectReducer };