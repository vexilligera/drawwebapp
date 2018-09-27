import React from 'react';
import ReactDOM from 'react-dom';
import { Provider, connect } from 'react-redux';
import { combineReducers, createStore } from 'redux';
import { Col, Row, Select } from 'antd';

class UIFile extends React.Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		return (
			<div>
			</div>
		);
	}
}

const fileReducer = (state = {}, action) => {
	switch (action.type) {

	}
};

const mapDispatchToProps = (dispatch, ownProps) => {
	return {

	};
};

const mapStateToProps = (state, ownProps) => {
	return {

	};
};

const File = connect(mapStateToProps, mapDispatchToProps)(UIFile);

export { File, fileReducer };