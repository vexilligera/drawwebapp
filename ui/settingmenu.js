import React from 'react';
import ReactDom from 'react-dom';
import { Menu, Modal, Layout, Button, Icon } from 'antd';
import { connect } from 'react-redux';
import { BrushGeneralSettings } from './generalsetting';
import { HotkeySetting } from './hotkey';
import { BrushPreset } from './brushpreset';
import { GestureSetting } from './gesture';
import { File } from './file';

const { Header, Content, Sider } = Layout;
const SubMenu = Menu.SubMenu;

class UISettingMenu extends React.Component {
	constructor(props) {
		super(props);
		this.state = {visible: false, option: 'init'};
	}

	handleMenuSelect = (e) => {
		this.setState({option: e.selectedKeys[0]});
	}

	handleSettingSave = () => {
		this.setState({visible: false, option: 'init'});
		this.props.closeSettingMenu();
		this.props.saveSettings();
	}

	handleSettingClose = () => {
		this.setState({visible: false, option: 'init'});
		this.props.closeSettingMenu();
	}

	displayPage = (option) => {
		let selectedTool = this.props.selectedTool;
		if (option == 'presets') {
			var t = false
			for (var i = 0; i < this.props.brushes.length; ++i)
				if (selectedTool == this.props.brushes[i].name) {
					t = true;
					break;
				}
			if (!t)
				selectedTool = this.props.brushes[0].name;
			this.props.setPresetKey(selectedTool);
			return (<BrushPreset status={selectedTool}/>);
		}
		else if (option == 'hotkey') {
			return (<HotkeySetting />)
		}
		else if (option == 'gesture') {
			return (<GestureSetting />);
		}
		else if (option == 'file') {
			return (<File />);
		}
		return (<BrushGeneralSettings />);
	}

	getOption = () => {
		var defaultOption = 'general';
		for (var i = 0; i < this.props.brushes.length; ++i) {
			if (this.props.selectedTool == this.props.brushes[i].name) {
				defaultOption = 'presets';
				break;
			}
		}
		if (!this.state.visible) {
			this.state.option = defaultOption;
		}
		return this.state.option;
	}

	render() {
		var option = this.getOption();
		this.state.visible = this.props.tooltipNotification == 'settings open';

		return (
			<div>
				<Modal
					visible={this.state.visible} mask={false}
					title={'Settings'}
					footer={[
						<Button key="setting_back" onClick={this.handleSettingClose}>Return</Button>,
						<Button key="setting_save" type="primary" onClick={this.handleSettingSave}>Save</Button>,
					]}
					closable={false}
				>
					<Layout>
						<Sider width={120}>
							<Menu
								mode="inline"
								onSelect={this.handleMenuSelect}
								selectedKeys={[option]}
								defaultOpenKeys={['brushes']}
								style={{ height: '100%', borderLeft: 1 }}
							>
								<SubMenu key="brushes" title={<Icon><i className={'fa fa-paint-brush'} /> Brushes</Icon>}>
									<Menu.Item key="general">General</Menu.Item>
									<Menu.Item key="presets">Presets <Icon type="menu-unfold" /></Menu.Item>
								</SubMenu>
								<Menu.Item key="palette"><Icon><i className={'fa fa-tachometer'} /> Color</Icon></Menu.Item>
								<Menu.Item key="hotkey"><Icon><i className={'fa fa-keyboard-o'} /> Hotkeys</Icon></Menu.Item>
								<Menu.Item key="gesture"><Icon><i className={'fa fa-hand-paper-o'} /> Gesture</Icon></Menu.Item>
								<Menu.Item key="tint"><Icon><i className={'fa fa-tint'} /> Tint</Icon></Menu.Item>
								<Menu.Item key="view"><Icon><i className={'fa fa-eye'} /> View</Icon></Menu.Item>
								<Menu.Item key="file"><Icon><i className={'fa fa-file'} /> File</Icon></Menu.Item>
							</Menu>
						</Sider>
						<Content style={{ background: '#fff' }}>
							{this.displayPage(option)}
						</Content>
					</Layout>
				</Modal>
			</div>
		);
	}
}

const settingMenuReducer = (state = {}, action) => {
	switch (action.type) {
	case 'TOOLTIP_NOTIFY':
		return {
			...state,
			tooltipNotification: action.eventType
		};
	default:
		return state;
	}
};

const mapDispatchToProps = (dispatch, ownProps) => {
	return {
		closeSettingMenu: () => {
			dispatch({
				type: 'TOOLTIP_NOTIFY',
				tooltipNotification: 'settings close'
			});
		},

		saveSettings: () => {
			dispatch({
				type: 'SAVE_SETTINGS'
			});
		},

		loadBrushPresets: () => {
			dispatch({
				type: 'LOAD_BRUSHES'
			});
		},

		setPresetKey: (s) => {
			dispatch({
				type: 'SET_PRESET_KEY',
				key: s
			});
		}
	};
};

const mapStateToProps = (state, ownProps) => {
	return {
		selectedTool: state.tooltipSelectReducer.selectedTool,
		tooltipNotification: state.tooltipSelectReducer.tooltipNotification,
		brushes: state.brushes
	};
};

const SettingMenu = connect(mapStateToProps, mapDispatchToProps)(UISettingMenu);

export { SettingMenu, settingMenuReducer };