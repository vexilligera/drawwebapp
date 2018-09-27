import React from 'react';
import ReactDom from 'react-dom';
import { IntegerStep } from './gadgets';
import { Col, Row } from 'antd';
import { connect } from 'react-redux';

var globalState = null;

class UIBrushGeneralSettings extends React.Component {
	constructor(props) {
		super(props);
		if (globalState == null)
			globalState = this.props.globalState;
		this.state = {radius: globalState.radius * 500, opacity: globalState.opacity * 100};
	}

	render() {
		return (
			<div>
				<Row>
					<Col span={23} offset={2}>
						<IntegerStep titleText='Radius' min={1} max={500} defaultVal={this.state.radius} onChange={(n, v) => {
							this.setState({radius: v});
							this.props.setRadius(v);
							this.props.setRadiusCb(v / 500);
						}}/>
					</Col>
				</Row>
				<Row>
					<Col span={23} offset={2}>
						<IntegerStep titleText='Flow' min={0} max={100} defaultVal={this.state.opacity} onChange={(n, v) => {
							this.setState({opacity: v});
							this.props.setOpacity(v);
							this.props.setOpacityCb(v / 100);
						}}/>
					</Col>
				</Row>
			</div>
		);
	}
}

const brushGeneralSettingsReducer = (state = {}, action) => {
	switch (action.type) {
	case 'SET_BRUSH_RADIUS':
		return {...state, radius: action.payload};
	case 'SET_BRUSH_OPACITY':
		return {...state, opacity: action.payload};
	case 'SAVE_SETTINGS':
		return {...state, radius: action.radius, opacity: action.opacity};
	default:
		return state;
	}
};

const mapDispatchToProps = (dispatch, ownProps) => {
	return {
		setRadius: (radius) => {
			dispatch({
				type: 'SET_BRUSH_RADIUS',
				payload: radius
			});
		},

		setOpacity: (opacity) => {
			dispatch({
				type: 'SET_BRUSH_OPACITY',
				payload: opacity
			});
		}
	};
};

const mapStateToProps = (state, ownProps) => {
	return {
		radius: state.brushGeneralSettings.radius,
		opacity: state.brushGeneralSettings.opacity,
		setOpacityCb: state.brushGeneralSettings.setOpacityCb,
		setRadiusCb: state.brushGeneralSettings.setRadiusCb,
		globalState: state.brushGeneralSettings.globalState
	};
};

const BrushGeneralSettings = connect(mapStateToProps, mapDispatchToProps)(UIBrushGeneralSettings);

export { BrushGeneralSettings, brushGeneralSettingsReducer };