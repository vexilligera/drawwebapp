import React from 'react';
import ReactDom from 'react-dom';
import { Row, Col, Icon, Slider, InputNumber, Input, Select, Collapse, Switch } from 'antd';

class TextSlide extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			inputValue: props.defaultVal,
			titleText: props.titleText,
			min: props.min,
			max: props.max,
			name: props.name,
			suffix: props.suffix == undefined ? '' : props.suffix,
		}
		this.style = props.style;
	}

	UNSAFE_componentWillReceiveProps(nextProps) {
		this.state.inputValue = Math.round(nextProps.defaultVal);
	}

	onChange = (value) => {
		this.setState({
			inputValue: value,
		});
		if (this.props.onChange != undefined)
			this.props.onChange(this.state.name, value);
	}

	render() {
		return (
			<Row>
				<Col span={6}>
					<div style={{ marginTop: 4 }}>{this.state.titleText}</div>
				</Col>
				<Col span={16}>
					<Slider min={this.state.min} max={this.state.max} onChange={this.onChange} value={this.state.inputValue} />
				</Col>
				<Col span={2}>
					<div style={{ marginTop: 6, marginLeft: 4}}>
						{this.state.inputValue.toString() + this.state.suffix}
					</div>
				</Col>
			</Row>
		);
	}
}

class IntegerStep extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			inputValue: props.defaultVal,
			titleText: props.titleText,
			min: props.min,
			max: props.max,
			name: props.name
		}
		this.style = props.style;
	}

	onChange = (value) => {
		this.setState({
			inputValue: value,
		});
		if (this.props.onChange != undefined)
			this.props.onChange(this.state.name, value);
	}

	UNSAFE_componentWillReceiveProps(nextProps) {
		this.state.inputValue = Math.round(nextProps.defaultVal);
	}

	render() {
		if (window.devicePixelRatio > 1 && window.devicePixelRatio < 3)
			return (
					<Row>
						<Col span={4}>
							<div style={{ marginTop: 6 }}>{this.state.titleText}</div>
						</Col>
						<Col span={1}/>
						<Col span={11}>
							<Slider size='small' min={this.state.min} max={this.state.max} onChange={this.onChange} value={this.state.inputValue} />
						</Col>
						<Col span={2}>
							<InputNumber
								min={this.state.min}
								max={this.state.max}
								style={{ marginLeft: 16, width: 62 }}
								value={this.state.inputValue}
								onChange={this.onChange}
								size='small'
							/>
						</Col>
					</Row>
				);

		return (
			<Row>
				<Col span={1}/>
				<Col span={4}>
					<div style={{ marginTop: 6 }}>{this.state.titleText}</div>
				</Col>
				<Col span={12}>
					<Slider min={this.state.min} max={this.state.max} onChange={this.onChange} value={this.state.inputValue} />
				</Col>
				<Col span={4}>
					<InputNumber
						min={this.state.min}
						max={this.state.max}
						style={{ marginLeft: 16, width: 62 }}
						value={this.state.inputValue}
						onChange={this.onChange}
					/>
				</Col>
			</Row>
		);
	}
}

class TextSwitch extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			text: props.text
		};
	}

	render() {
		return (
			<div>
				<Row>
					<Col span={19}>
						<span>{this.state.text}</span>
					</Col>
					<Col span={5}>
						<Switch />
					</Col>
				</Row>
			</div>
		);
	}
}

class TextInput extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			onChange: props.onChange,
			title: props.title,
			value: props.value,
			defaultValue: props.defaultValue
		};
	}

	UNSAFE_componentWillReceiveProps(nextProps) {
		this.state.title = nextProps.title;
		this.state.value = nextProps.value;
		this.state.defaultValue = nextProps.defaultValue;
	}

	onChange = (v) => {
		let { value } = v.target;
		this.setState({
			value: value,
		});
		if (this.props.onChange != undefined)
			this.props.onChange(value);
	}

	render() {
		return (
			<div>
				<Row style={{marginTop: 10}}>
					<Col span={14} offset={2}>
						{this.state.title}
					</Col>
					<Col span={8}>
						<Input size='small' onChange={this.onChange} defaultValue={this.state.defaultValue}/>
					</Col>
				</Row>
			</div>
		);
	}
}

class TextSlideInput extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			inputValue: props.value == undefined ? this.props.defaultVal : this.props.value,
			titleText: props.titleText,
			min: props.min,
			max: props.max,
			name: props.name,
			suffix: props.suffix == undefined ? '' : props.suffix,
			onChange: props.onChange
		};
		this.style = props.style;
	}

	UNSAFE_componentWillReceiveProps(nextProps) {
		this.state.inputValue = Math.round(nextProps.value == undefined ? nextProps.defaultVal : nextProps.value);
		this.state.titleText = nextProps.titleText;
		this.state.max = nextProps.max;
		this.state.min = nextProps.min;
	}

	onChange = (value) => {
		this.setState({
			inputValue: value,
		});
		if (this.props.onChange != undefined)
			this.props.onChange(value);
	}

	render() {
		return (
			<div className='UITextSlideInput' style={this.style}>
				<Row>
					<Col span={2}/>
					<Col span={5}>
						<div style={{ marginTop: 2, color: '#c0c0c0' }}>{this.state.titleText}</div>
					</Col>
					<Col span={6} />
					<Col span={1}>
						<InputNumber
							min={this.state.min}
							max={this.state.max}
							style={{ marginLeft: 16, width: 62 }}
							value={this.state.inputValue}
							onChange={this.onChange}
							size='small'
						/>
					</Col>
					<Col span={2} />
				</Row>
				<Row>
					<Col span={2} />
					<Col span={20}>
						<Slider size='small' min={this.state.min} max={this.state.max} onChange={this.onChange} value={this.state.inputValue} />
					</Col>
					<Col span={2} />
				</Row>
			</div>
		);
	}
}

export { TextInput, TextSlide, TextSlideInput, IntegerStep, TextSwitch };