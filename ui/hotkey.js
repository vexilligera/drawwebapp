import React from 'react';
import ReactDOM from 'react-dom';
import { Provider, connect } from 'react-redux';
import { combineReducers, createStore } from 'redux';
import { TextInput } from './gadgets';
import { Col, Row, Button, Select } from 'antd';

class UIHotkeySetting extends React.Component {
	constructor(props) {
		super(props);
		this.state = {text: ''};
	}

	render() {
		return (
			<div>
				<Row>
					<Col offset={2} span={15} style={{fontSize: 16}}>
						Keyboard
					</Col>
				</Row>
				<TextInput 
					title='Thicker '
					defaultValue={this.props.config.keyMap.thicker}
					onChange={(value) => {this.props.setThicker(value, this.props.config)}}
				/>
				<TextInput 
					title='Thinner '
					defaultValue={this.props.config.keyMap.thinner}
				    onChange={(value) => {this.props.setThiner(value, this.props.config)}} 
				/>
				<TextInput 
					title='Zoom in '
					defaultValue={this.props.config.keyMap.magnify}
					onChange={(value) => {this.props.setZoomIn(value, this.props.config)}} 
				/>
				<TextInput
					title='Zoom out'
					defaultValue={this.props.config.keyMap.minify}
					onChange={(value) => {this.props.setZoomOut(value, this.props.config)}}
				/>
				<TextInput 
					title='Pipette '
					defaultValue={this.props.config.keyMap.pipette}
					onChange={(value) => {this.props.setPipette(value, this.props.config)}} 
				/>
				<TextInput 
					title='Undo   '
					defaultValue={this.props.config.keyMap.undo}
					onChange={(value) => {this.props.setUndo(value, this.props.config)}} 
				/>
				<Row style={{marginTop: 30}}>
					<Col offset={2} span={15} style={{fontSize: 16}}>
						Mouse
					</Col>
				</Row>
				<Row style={{marginTop: 10}}>
					<Col offset={2} span={17}>
						Mouse scroll
					</Col>
					<Col span={4}>
						<Select defaultValue="move" size='small'>
							<Select.Option value="move">Move</Select.Option>
							<Select.Option value="zoom">Zoom</Select.Option>
						</Select>
					</Col>
				</Row>
				<Row style={{marginTop: 35}}>
					<Col offset={19}>
						<Button type="danger">Reset</Button>
					</Col>
				</Row>
			</div>
		);
	}
}

const hotkeySettingReducer = (state = {}, action) => {
	switch (action.type) {
		case 'SET_THICKER_HOTKEY':
			return { ...state, keyThicker: action.payload, config: action.newConfig};
		case 'SET_THINER_HOTKEY':
			return { ...state, keyThiner: action.payload, config: action.newConfig};
		case 'SET_ZOOMIN_HOTKEY':
			return { ...state, keyZoomIn: action.payload, config: action.newConfig };
		case 'SET_ZOOMOUT_HOTKEY':
			return { ...state, keyZoomOut: action.payload, config: action.newConfig };
		case 'SET_PIPETTE_HOTKEY':
			return { ...state, keyPipette: action.payload, config:action.newConfig};
		case 'SET_UNDO_HOTKEY':
			return { ...state, keyUndo: action.payload, config: action.newConfig};
		default:
			return state;
	}
};

const mapDispatchToProps = (dispatch, ownProps) => {
	return {
		setThicker: (key, config) => {
			dispatch({
				type: 'SET_THICKER_HOTKEY',
				payload: key,
				newConfig: config.editHotkey('thicker', key)
			});
		},

		setThiner: (key, config) => {
			dispatch({
				type: 'SET_THINER_HOTKEY',
				payload: key,
				newConfig: config.editHotkey('thinner', key)
			});
		},

		setZoomIn: (key, config) => {
			dispatch({
				type: 'SET_ZOOMIN_HOTKEY',
				payload: key,
				newConfig: config.editHotkey('magnify', key)
			});
		},

		setZoomOut: (key, config) => {
			dispatch({
				type: 'SET_ZOOMOUT_HOTKEY',
				payload: key,
				newConfig: config.editHotkey('minify', key)
			});
		},

		setPipette: (key, config) => {
			dispatch({
				type: 'SET_PIPETTE_HOTKEY',
				payload: key,
				newConfig: config.editHotkey('pipette', key)
			});
		},

		setUndo: (key, config) => {
			dispatch({
				type: 'SET_UNDO_HOTKEY',
				payload: key,
				newConfig: config.editHotkey('undo', key)
			});
		}
	};
};

const mapStateToProps = (state, ownProps) => {
	return {
		config: state.hotkeySetting.config,
		keyThicker: state.hotkeySetting.keyThicker,
		keyThiner: state.hotkeySetting.keyThiner,
		keyZoomIn: state.hotkeySetting.keyZoomIn,
		keyZoomOut: state.hotkeySetting.keyZoomOut,
		keyPipette: state.hotkeySetting.keyPipette,
		keyUndo: state.hotkeySetting.keyUndo 
	};
};

const HotkeySetting = connect(mapStateToProps, mapDispatchToProps)(UIHotkeySetting);

export { HotkeySetting, hotkeySettingReducer };