import React from 'react';
import ReactDOM from 'react-dom';
import { Provider, connect } from 'react-redux';
import { combineReducers, createStore } from 'redux';
import { Switch, Row, Col } from 'antd';

class TextSwitch extends React.Component {
	constructor(props) {
		super(props);
		this.state = {value: props.value};
	}

	render() {
		return (
			<Row>
				<Col span={18} offset={2}>
					<p>
						{this.props.text}
					</p>
				</Col>
				<Col span={2}>
					<Switch onChange={(value) => {
						this.props.onChange(value);
						this.setState({value: value});
					}} checked={this.state.value} />
				</Col>
			</Row>
		);
	}
};

class UIGestureSetting extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		let gesture = this.props.config.gesture;
		return (
			<div>
				<TextSwitch text={(<div>Undo<br /> (Double tap)</div>)} value={gesture.doubleTap}
							onChange={(value) => {
								this.props.changeDoubleTap(this.props.config, value);
								this.props.loadGestureSetting(this.props.config);
							}
						}/>
				<TextSwitch text={(<div>Zoom in/out<br />(Two-finger pinching)</div>)}
							onChange={(value) => {
								this.props.changePinch2(this.props.config, value);
								this.props.loadGestureSetting(this.props.config);
							}
						}  value={gesture.fingerPinch2}/>
				<TextSwitch text={(<div>Rotate canvas<br />(Two-finger rotation)</div>)} 
					onChange={(value) => {
						this.props.changeRotate2(this.props.config, value);
						this.props.loadGestureSetting(this.props.config);
						}
					} value={gesture.fingerRotate2}/>
				<TextSwitch text={(<div>Brush size<br />(Three-finger pinching)</div>)} 
					onChange={(value) => {
						this.props.changePinch3(this.props.config, value);
						this.props.loadGestureSetting(this.props.config);
						}
					} value={gesture.fingerPinch3}/>
				<TextSwitch text={(<div>Color hue<br />(Three-finger rotation)</div>)} 
					onChange={(value) => {
						this.props.changeRotate3(this.props.config, value);
						this.props.loadGestureSetting(this.props.config);
						}
					} value={gesture.fingerRotate3}/>
				<TextSwitch text={(<div>Color saturation<br />(Three-finger horizontal panning)</div>)}
					onChange={(value) => {
						this.props.changefingerPan3H(this.props.config, value);
						this.props.loadGestureSetting(this.props.config);
						}
					} value={gesture.fingerPan3Horizontal}/>
				<TextSwitch text={(<div>Color brightness<br /> (Three-finger vertical panning)</div>)} 
					onChange={(value) => {
						this.props.changefingerPan3V(this.props.config, value);
						this.props.loadGestureSetting(this.props.config);
						}
					} value={gesture.fingerPan3Vertical}/>
			</div>
		);
	}
}

const gestureSettingReducer = (state = {}, action) => {
	switch (action.type) {
		case 'CDT':
			return {...state, config: action.newConfig};
		case 'CFP3H':
			return {...state, config: action.newConfig};
		case 'CFP3V':
			return {...state, config: action.newConfig};
		case 'CP2':
			return { ...state, config: action.newConfig };
		case 'CP3':
			return { ...state, config: action.newConfig };
		case 'CR2':
			return { ...state, config: action.newConfig };
		case 'CR3':
			return { ...state, config: action.newConfig };
	default:
		return state;
	}
};

const mapDispatchToProps = (dispatch, ownProps) => {
	return {
		changeDoubleTap: (config, value) => {
			dispatch({
				type: 'CDT',
				newConfig: config.switchGestureState("doubleTap", value)
			});
		},
		changefingerPan3H: (config, value) => {
			dispatch({
				type: 'CFP3H',
				newConfig: config.switchGestureState("fingerPan3Horizontal", value)
			});
		},
		changefingerPan3V: (config, value) => {
			dispatch({
				type: 'CFP3V',
				newConfig: config.switchGestureState("fingerPan3Vertical", value)
			});
		},
		changePinch2: (config, value) => {
			dispatch({
				type: 'CP2',
				newConfig: config.switchGestureState("fingerPinch2", value)
			});
		},
		changePinch3: (config, value) => {
			dispatch({
				type: 'CP3',
				newConfig: config.switchGestureState("fingerPinch3", value)
			});
		},
		changeRotate2: (config, value) => {
			dispatch({
				type: 'CR2',
				newConfig: config.switchGestureState("fingerRotate2", value)
			});
		},
		changeRotate3: (config, value) => {
			dispatch({
				type: 'CR3',
				newConfig: config.switchGestureState("fingerRotate3", value)
			});
		}
	};
};

const mapStateToProps = (state, ownProps) => {
	return {
		loadGestureSetting: state.gestureSetting.loadGestureSetting,
		config: state.gestureSetting.config
	};
};

const GestureSetting = connect(mapStateToProps, mapDispatchToProps)(UIGestureSetting);

export { GestureSetting, gestureSettingReducer };