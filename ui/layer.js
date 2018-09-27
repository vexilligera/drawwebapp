import React from 'react';
import ReactDom from 'react-dom';
import { connect } from 'react-redux';
import { message, Select, Row, Col, InputNumber, Button, Slider, Radio, Icon, List } from 'antd';
import './layer.less';

let ui = null;

class UILayer extends React.Component {
	constructor(props) {
		super(props);
		this.state = { left: 0, top: 0, offsetX: 0, offsetY: 0, dragging: false, bgColor: '#404040', pixelRatio: window.devicePixelRatio || 1, zIndex: this.props.style.zIndex,
					   width: this.props.style.width, height: this.props.style.height, selectedBgColor: '#5e5e5e', listDat: [], opacity: 100, visible: false,
					   layerTree: props.layerTree, thumbnailWidth: 0, thumbnailHeight: 0, selectedNode: null, blendmode: 'normal', settingVisible: false };
		this.initListData();
		ui = this;
	}

	dataToCanvas(imagedata, width, height) {
		var canvas = document.createElement('canvas');
	    var ctx = canvas.getContext('2d');
	    canvas.width = imagedata.width;
	    canvas.height = imagedata.height;
	    ctx.putImageData(imagedata, 0, 0);
	    var thumbnail = document.createElement('canvas');
	    thumbnail.width = width;
	    thumbnail.height = height;
	    ctx = thumbnail.getContext('2d');
	    ctx.drawImage(canvas, 0, 0, width, height);
	    return thumbnail;
	}

	setVisibility(f) {
		this.setState({visible: f});
	}

	initListData() {
		let depth = 0;
		let layerTree = this.state.layerTree;
		let height = 50;
		let width = height / layerTree.canvasHeight * layerTree.canvasWidth;
		this.state.thumbnailWidth = width, this.state.thumbnailHeight = height;
		this.state.listDat = [];
		const _build = (node) => {
			let dat = new ImageData(new Uint8ClampedArray(node.getLayerImageData()), layerTree.canvasWidth, layerTree.canvasHeight);
			var image = this.dataToCanvas(dat, width, height);
			this.state.listDat.push({depth: depth++, node: node, thumbnail: image, type: node.type});
			if (!node.children.length) {
				--depth;
				return;
			}
			for (var i = 0; i < node.children.length; ++i)
				_build(node.children[i]);
		};
		_build(layerTree.root);
		this.state.listDat.shift();
	}

	genName(prefix = 'Layer ') {
		let conflict = true;
		let cnt = this.state.listDat.length;
		while (conflict) {
			var i;
			for (i = 0; i < this.state.listDat.length; ++i) {
				if (this.state.listDat[i].node.name == prefix + cnt.toString()) {
					++cnt;
					break;
				}
			}
			if (i == this.state.listDat.length)
				conflict = false;
		}
		return prefix + cnt.toString();
	}

	updateListData() {
		let depth = 0;
		let layerTree = this.state.layerTree;
		let height = 50;
		let width = height / layerTree.canvasHeight * layerTree.canvasWidth;
		this.state.thumbnailWidth = width, this.state.thumbnailHeight = height;
		let cnt = 0;
		this.state.listDat.splice(0, 0, {node: {nodeId: 0, type: 'folder'}});
		const _build = (node) => {
			if (this.state.listDat[cnt].node.nodeId != node.nodeId) {
				let dat = new ImageData(new Uint8ClampedArray(node.getLayerImageData()), layerTree.canvasWidth, layerTree.canvasHeight);
				var image = this.dataToCanvas(dat, width, height);
				this.state.listDat.splice(cnt, 0, {depth: depth, node: node, thumbnail: image, type: node.type});
			}
			++cnt;
			if (!node.children.length)
				return;
			for (var i = 0; i < node.children.length; ++i) {
				++depth;
				_build(node.children[i]);
				--depth;
			}
		};
		_build(layerTree.root);
		this.state.listDat.shift();
	}

	updatePanel(f = false) {
		if (f)
			this.updateListData();
		else this.updateListDat();
		this.setState({selectedNode: null});
		this.state.layerTree.composite();
		this.state.layerTree.canvasManager.updateDisplay();
	}

	updateListDat(getImage = false) {
		if (getImage)
			this.initListData();
		else {
			let newList = [];
			let depth = 0;
			let layerTree = this.state.layerTree;
			const _build = (node) => {
				var t = this.getDataById(node.nodeId);
				if (!t) {
					let height = 50;
					let width = height / layerTree.canvasHeight * layerTree.canvasWidth;
					let dat = new ImageData(new Uint8ClampedArray(node.getLayerImageData()), layerTree.canvasWidth, layerTree.canvasHeight);
					var image = this.dataToCanvas(dat, width, height);
					t = {thumbnail: image, type: node.type};
				}
				if (node.nodeId == 0)
					t = {node: {nodeId: 0, thumbnail: null, depth: 0, type: 'folder'}};
				newList.push({depth: depth, node: node, thumbnail: t.thumbnail, type: t.type});
				if (!node.children.length)
					return;
				for (var i = 0; i < node.children.length; ++i) {
					++depth;
					_build(node.children[i]);
					--depth;
				}
			};
			_build(layerTree.root);
			newList.shift();
			this.state.listDat = newList;
		}
	}

	getDataById(id) {
		for (var i = 0; i < this.state.listDat.length; ++i) {
			if (id == this.state.listDat[i].node.nodeId)
				return this.state.listDat[i];
		}
		return null;
	}

	handleDrag(x, y) {
		var xp = (x - this.state.left) * this.state.pixelRatio, yp = (y - this.state.top) * this.state.pixelRatio;
		if (this.state.dragging)
			this.setState({left: x - this.state.offsetX, top: y - this.state.offsetY});
	}

	handleTouchDrag = (e) => {
		this.handleDrag(e.touches[0].pageX, e.touches[0].pageY);
	}

	handleMouseDrag = (e) => {
		this.handleDrag(e.pageX, e.pageY);
	}

	handlePointerDown(x, y) {
		var xp = x, yp = y;
		x = (x - this.state.left) * this.state.pixelRatio, y = (y - this.state.top) * this.state.pixelRatio;
		this.setState({dragging: true, offsetX: xp - this.state.left, offsetY: yp - this.state.top});
	}

	handleMouseStart = (e) => {
		this.handlePointerDown(e.pageX, e.pageY);
	}

	handleTouchStart = (e) => {
		this.handlePointerDown(e.touches[0].pageX, e.touches[0].pageY);
	}

	handleDragEnd = (e) => {
		this.setState({dragging: false});
	}

	componentDidUpdate() {

	}

	render() {
		let ret = this.state.visible ? (
			<div style={{boxShadow: '0 0 25px #888888', width:this.state.width, height:this.state.height, touchAction:'none', position:'absolute',
						left:this.state.left, top:this.state.top, backgroundColor: this.state.bgColor, zIndex: this.state.zIndex}}
				onTouchMove={this.handleTouchDrag} onTouchStart={this.handleTouchStart} onTouchEnd={this.handleDragEnd} className='UILayer'
				onMouseDown={this.handleMouseStart} onMouseMove={this.handleMouseDrag} onMouseUp={this.handleDragEnd} onMouseLeave={this.handleDragEnd}>
				<Button style={{marginTop: 4, marginLeft: 5}} type="default" shape='circle' size='small' ghost onClick = {() => {
					this.setState({visible: false});
				}}>
					<Icon type="close" />
				</Button>
				<Row style={{marginTop: 5, marginBottom: 5}}>
					<Col span={1} />
					<Col span={4}>
						<span style={{color:'#c0c0c0'}}>Opacity</span>
					</Col>
					<Col span={11} />
					<Col span={3}>
						<InputNumber size='small' defaultValue={100} min={0} max={100} style={{width:55}} value={this.state.opacity}
							formatter={value => `${value}%`} parser={value => value.replace('%', '')} onChange={(v)=>{
								v = parseInt(v);
								if (isNaN(v) || !this.state.selectedNode)
									this.state.opacity = 100;
								else {
									this.state.selectedNode.opacity = v / 100;
									this.setState({opacity: v});
									this.state.layerTree.composite();
									this.state.layerTree.canvasManager.updateDisplay();
								}
							}}/>
					</Col>
				</Row>
				<Row style={{marginTop: 5, marginBottom: 5}}>
					<Col span={4}>
						<Button style={{marginTop: 4, marginLeft: 5}} type="default" shape='circle' size='small' ghost onClick = {() => {
							var layerTree = this.state.layerTree;
							var id = layerTree.createNewNode(0, layerTree.getRootId());
							var node = layerTree.searchNodeById(id);
							node.setActive();
							node.type = 'layer';
							node.opacity = 1.0;
							node.name = this.genName();
							node.gl.clearColor(1.0, 1.0, 1.0, 0.0);
							node.gl.clear(node.gl.COLOR_BUFFER_BIT);
							if (this.state.selectedNode) {
								let pos = layerTree.positionById(this.state.selectedNode.nodeId) - 1;
								pos = pos < 0 ? 0 : pos;
								layerTree.moveNode(id, this.state.selectedNode.parent.nodeId, pos);
							}
							layerTree.composite();
							this.updateListData();
							this.forceUpdate();
							message.success('New layer created.');
						}}>
							<Icon type="plus" />
						</Button>
					</Col>
					<Col span={4}>
						<Button style={{marginTop: 4, marginLeft: 5}} type="default" shape='circle' size='small' ghost onClick = {() => {
							if (this.state.selectedNode) {
								let layerTree = this.state.layerTree;
								var pos, parent, parentId = this.state.selectedNode.parent.nodeId;
								pos = layerTree.positionById(this.state.selectedNode.nodeId) - 1;
								if (pos < 0 && parentId) {
									pos = layerTree.positionById(parentId) - 1;
									parentId = layerTree.searchNodeById(parentId).parent.nodeId;
								}
								if (pos < 0) pos = 0;
								layerTree.moveNode(this.state.selectedNode.nodeId, parentId, pos);
								layerTree.composite();
								layerTree.canvasManager.updateDisplay();
								this.updateListDat();
								this.forceUpdate();
							}
						}}>
							<Icon type="up" />
						</Button> 
					</Col>
					<Col span={4}>
						<Button style={{marginTop: 4, marginLeft: 5}} type="default" shape='circle' size='small' ghost onClick = {() => {
							if (this.state.selectedNode) {
								let layerTree = this.state.layerTree;
								var pos, parent, parentId = this.state.selectedNode.parent.nodeId;
								let node = this.state.selectedNode;
								pos = layerTree.positionById(this.state.selectedNode.nodeId) + 1;
								if (pos >= node.parent.children.length && parentId) {
									pos = layerTree.positionById(parentId) + 1;
									parentId = layerTree.searchNodeById(parentId).parent.nodeId;
								}
								if (pos >= node.parent.children.length) --pos;
								layerTree.moveNode(this.state.selectedNode.nodeId, parentId, pos);
								layerTree.composite();
								layerTree.canvasManager.updateDisplay();
								this.updateListDat();
								this.forceUpdate();
							}
						}}>
							<Icon type="down" />
						</Button>
					</Col>
					<Col span={4}>
						<Button style={{marginTop: 4, marginLeft: 5}} type="default" shape='circle' size='small' ghost onClick = {() => {
							var layerTree = this.state.layerTree;
							var id = layerTree.createNewNode(0, layerTree.getRootId());
							var node = layerTree.searchNodeById(id);
							node.setActive();
							node.opacity = 1.0;
							node.type = 'folder';
							node.name = this.genName('Folder ');
							node.gl.clearColor(1.0, 1.0, 1.0, 0.0);
							node.gl.clear(node.gl.COLOR_BUFFER_BIT);
							if (this.state.selectedNode) {
								let pos = layerTree.positionById(this.state.selectedNode.nodeId) - 1;
								pos = pos < 0 ? 0 : pos;
								layerTree.moveNode(id, this.state.selectedNode.parent.nodeId, pos);
							}
							layerTree.composite();
							this.updateListData();
							this.forceUpdate();
							message.success('New folder created.');
						}}>
							<Icon type="folder" />
						</Button>
					</Col>
					<Col span={4}>
						<Button style={{marginTop: 4, marginLeft: 5}} type="default" shape='circle' size='small' ghost onClick = {() => {
							if (this.state.selectedNode) {
								let layerTree = this.state.layerTree;
								let node = this.state.selectedNode;
								let pos = layerTree.positionById(node.nodeId);
								let parent = node.parent;
								if (parent.children.length > 1 && (node.type == 'layer' || node.type == 'area')) {
									let next = parent.children[pos + 1];
									let id = layerTree.createNewNode(pos, parent.nodeId,
															layerTree.canvasWidth, layerTree.canvasHeight, '*MERGE_DOWN*', 'folder');
									layerTree.moveNode(next.nodeId, id, 0);
									layerTree.moveNode(node.nodeId, id, 0);
									node = layerTree.searchNodeById(id);
									node.merge();
									node.name = next.name;
									this.setState({selectedNode: node});
									this.props.setActiveLayer(node.nodeId);
								}
								else if (node.type == 'folder') {
									node.merge();
									this.setState({selectedNode: node});
									this.props.setActiveLayer(node.nodeId);
								}
								this.updateListDat();
								layerTree.composite();
								layerTree.canvasManager.updateDisplay();
								layerTree.canvasManager.canvas.focus();
							}
						}}>
							<i className="fa fa-level-down" aria-hidden="true" />
						</Button>
					</Col>
				</Row>
				<div style={{height:325, overflow:'scroll', overflowX:'hidden'}} className='UIList'>
					<List itemLayout='vertical' size='small' dataSource={this.state.listDat} renderItem={item => (
						<List.Item style={{ height:60, backgroundColor: this.state.selectedNode && item.node.nodeId == this.state.selectedNode.nodeId ? '#5e5e5e' : '#404040'}}>
							<div onClick={(e) => {
								if (this.state.selectedNode) {
									let dat = this.getDataById(this.state.selectedNode.nodeId);
									let layerTree = this.state.layerTree;
									let imgDat = new ImageData(new Uint8ClampedArray(dat.node.getLayerImageData()),
															layerTree.canvasWidth, layerTree.canvasHeight);
									dat.thumbnail = this.dataToCanvas(imgDat, this.state.thumbnailWidth, this.state.thumbnailHeight);
								}
								this.props.setActiveLayer(item.node.nodeId);
								this.setState({selectedNode: item.node, opacity: item.node.opacity * 100, blendmode: item.node.blendMode.toString()});
							}}>
								<Row style={{bottom: 4}}>
									<Col span={4} offset={item.depth}>
										<img src={item.thumbnail.toDataURL()} style={{backgroundColor: 'white'}}/>
									</Col>
									<Col span={item.node.type != 'folder' ? 15 - item.depth : 11 - item.depth} offset={1}>
										<span style={{color: '#c0c0c0'}} onClick={() => {
											let name = prompt('Enter the name for the layer or folder:', item.node.name);
											if (!name)
												return;
											for (var i = 0; i < this.state.listDat.length; ++i)
												if (name == this.state.listDat[i].node.name && item.node.nodeId != this.state.listDat[i].node.nodeId) {
													message.error("Layer/folder named " + name + ' already exists.');
													return;
												}
											item.node.name = name;
											this.forceUpdate();
										}}>
											{item.node.name}
										</span>
									</Col>
									{item.node.type != 'folder' ? (<div />) : (<div>
										<Col span={4}>
											<Button style={{marginTop: 25, marginLeft: 5}} type="default" shape='circle' size='small' ghost onClick = {() => {
												this.props.showFolderSetting(this.state.listDat, this.state.layerTree, item.node);
											}}>
												<Icon type="setting" />
											</Button>
										</Col>
									</div>)}
									<Col span={4}>
										<Button style={{marginTop: 25, marginLeft: 5}} type="default" shape='circle' size='small' ghost onClick = {() => {
											item.node.setVisible(!item.node.visible);
											this.state.layerTree.composite();
											this.state.layerTree.canvasManager.updateDisplay();
											this.forceUpdate();
										}}>
											{ item.node.visible ? (<i className="fa fa-eye" aria-hidden="true" />) :
															(<i className="fa fa-eye-slash" aria-hidden="true" />) }
										</Button>
									</Col>
								</Row>
							</div>
						</List.Item>
					)} />
				</div>
				<Row style={{marginTop: 5}}>
					<Col span={1} />
					<Col span={3}>
						<Select size='small' value={this.state.blendmode} defaultValue='' style={{ width: 105 }} onChange={(v)=>{
							if (this.state.selectedNode) {
								this.state.selectedNode.blendMode = parseInt(v);
								this.setState({blendmode: v});
								this.state.selectedNode.setRenderPath();
								this.state.layerTree.composite();
								this.state.layerTree.canvasManager.updateDisplay();
							}
						}}>
							<Select.Option value='0'>Normal</Select.Option>
							<Select.Option value='1'>Multiply</Select.Option>
							<Select.Option value='2'>Luminance</Select.Option>
						</Select>
					</Col>
					<Col span={16} />
					<Col span={3}>
						<Button style={{marginLeft: 5}} type='danger' shape='circle' ghost onClick = {() => {
							if (this.state.layerTree.root.children.length > 1) {
								let node = this.state.selectedNode.removeFromParent();
								this.state.selectedNode = null;
								for (let i = 0; i < this.state.listDat.length; ++i) {
									if (this.state.listDat[i].nodeId == node.nodeId) {
										this.state.listDat.splice(i, 1);
										break;
									}
								}
								this.state.layerTree.composite();
								this.state.layerTree.canvasManager.updateDisplay();
								this.props.setActiveLayer(-1);
								this.updatePanel();
							}
						}}>
							<Icon type="delete" />
						</Button>
					</Col>
				</Row>
			</div>
		) : (<div />);
		return ret;
	}
}

const layerReducer = (state = {}, action) => {
	switch (action.type) {
	case 'UPDATE_LAYERTREE':
		state.layerTree = action.payload;
		return {...state, layerTree: action.payload};
	case 'SET_NEW_ACTIVELAYER':
		state.selectLayerCb(action.payload);
		return {...state, activeLayer: action.payload};
	case 'LAYER_PANEL_OPEN':
		if (ui) ui.setVisibility(action.open);
		return state;
	case 'UPDATE_LAYER_PANEL':
		if (ui) ui.updatePanel(action.payload);
	default:
		return state;
	}
};

const mapDispatchToProps = (dispatch, ownProps) => {
	return {
		setActiveLayer: (newLayerId) => {
			dispatch({
				type: 'SET_NEW_ACTIVELAYER',
				payload: newLayerId
			});
		},

		showFolderSetting: (listDat, layerTree, folder) => {
			dispatch({
				type: 'SHOW_FOLDER_SETTING',
				payload: {
					listDat,
					layerTree,
					folder
				}
			});
		}
	};
};

const mapStateToProps = (state, ownProps) => {
	return {
		layerTree: state.layer.layerTree,
		activeLayer: state.layer.activeLayer,
		selectLayerCb: state.layer.selectLayerCb
	};
};

const Layer = connect(mapStateToProps, mapDispatchToProps)(UILayer);

export { Layer, layerReducer };