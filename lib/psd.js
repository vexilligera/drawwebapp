function acquire(s) {
	return require(s);
}

function parsePSD(canvasManager, psd, cb = null) {
	var arr = new Array();
	var tree = canvasManager.layerTree;
	var build = function(troot, proot) {
		var children = proot.children();
		if (children.length == 0) {
			var id = tree.createNewNode(0, troot.nodeId);
			var node = tree.searchNodeById(id);
			node.type = 'layer';
			node.opacity = 1.0;
			node.name = 'Background';
			node.setActive();
			node.gl.clearColor(1.0, 1.0, 1.0, 1.0);
			node.gl.clear(node.gl.COLOR_BUFFER_BIT);
			if (cb)
				cb();
		}
		for (var i = children.length - 1; i >= 0; --i) {
			var id = tree.createNewNode(0, troot.nodeId);
			var node = tree.searchNodeById(id);
			node.type = children[i].hasChildren() ? 'folder' : 'layer';
			node.opacity = children[i].layer.opacity / 255;
			node.name = children[i].name;
			node.setActive();
			node.gl.clearColor(1.0, 1.0, 1.0, 0.0);
			node.gl.clear(node.gl.COLOR_BUFFER_BIT);
			arr.push({'treeNode': node, 'psdNode': children[i], 'hasChildren': false});
			if (children[i].hasChildren()) {
				arr[arr.length - 1]['hasChildren'] = true;
				build(node, children[i]);
			}
		}
	};
	build(tree.root, psd.tree());
	console.log(psd.tree());
	var cvs = document.createElement('canvas');
	cvs.width = tree.canvasWidth;
	cvs.height = tree.canvasHeight;
	var ctx = cvs.getContext('2d');
	for (var i = 0; i < arr.length; ++i) {
		arr[i]['img'] = arr[i]['psdNode'].layer.image.toPng();
		arr[i]['img'].node = arr[i]['treeNode'];
		arr[i]['img'].psd = arr[i]['psdNode'];
		arr[i]['img'].onload = function() {
			ctx.clearRect(0, 0, cvs.width, cvs.height);
			ctx.drawImage(this, this.psd.coords.left, this.psd.coords.top);
			var imageData = ctx.getImageData(0, 0, cvs.width, cvs.height);
			this.node.setLayerImageData(imageData);
			this.loaded = true;
			for (var i = 0; i < arr.length; ++i) {
				if (!arr[i]['img'].loaded)
					return;
			}
			if (cb)
				cb();
		}
	}
	return tree;
}