import React from 'react';
import ReactDom from 'react-dom';
import { connect } from 'react-redux';
import { Modal, Button, Checkbox } from 'antd';

let ui = null;

class UIFolderSetting extends React.Component {
	constructor(props) {
		super(props);
		this.state = { visible: false, title: 'Folder setting', checkedValues: [] };
		ui = this;
	}

	handleClose = (e) => {
		let checked = this.state.checkedValues;
		let tree = this.state.layerTree;
		let folder = this.state.folder;
		console.log(checked);
		for (let i = 0; i < checked.length; ++i) {
			let node = tree.searchNodeById(checked[i]);
			if (node && node.parent != this.state.folder)
				tree.moveNode(node.nodeId, folder.nodeId, 0);
		}
		for (let i = 0; i < folder.children.length; ++i) {
			let id = folder.children[i].nodeId;
			var j;
			for (j = 0; j < checked.length; ++j) {
				if (checked[j] == id)
					break;
			}
			if (j == checked.length)
				tree.moveNode(id, folder.parent.nodeId, 0);
		}
		this.setState({visible: false});
		this.props.updateLayerPanel();
	}

	render() {
		let checkBoxList = [];
		if (this.state.listDat) {
			for (var i = 0; i < this.state.listDat.length; ++i) {
				let node = this.state.listDat[i].node;
				if (node.type == 'layer')
					checkBoxList.push({label: node.name, value: node.nodeId});
			}
		}
		return (
			<div>
				<Modal visible={this.state.visible} title={this.state.title} onCancel={this.handleClose}
						footer={[<Button key='ok' onClick={this.handleClose} type='primary'>Ok</Button>]}>
					<Checkbox.Group options={checkBoxList} value={this.state.checkedValues}
									onChange={(checkedValues) => {
						this.setState({checkedValues: checkedValues});
					}} />
				</Modal>
			</div>
		);
	}
}

const folderSettingReducer = (state = {}, action) => {
	switch (action.type) {
	case 'SHOW_FOLDER_SETTING':
		let checkedValues = [];
		for (let i = 0; i < action.payload.folder.children.length; ++i)
			checkedValues.push(action.payload.folder.children[i].nodeId);
		let newState = {
			visible: true,
			listDat: action.payload.listDat,
			layerTree: action.payload.layerTree,
			folder: action.payload.folder,
			title: action.payload.folder.name,
			checkedValues: checkedValues
		};
		ui.setState(newState);
		return newState;
	default:
		return state;
	}
};

const mapDispatchToProps = (dispatch, ownProps) => {
	return {
		updateLayerPanel: () => {
			dispatch({
				type: 'UPDATE_LAYER_PANEL',
				payload: false
			});
		}
	};
};

const mapStateToProps = (state, ownProps) => {
	return {

	};
};

const FolderSetting = connect(mapStateToProps, mapDispatchToProps)(UIFolderSetting);

export { FolderSetting, folderSettingReducer };