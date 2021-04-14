'use strict';

let previewScene;
let itemProperties = [];

window.addEventListener('load', function() {

	nodecg.sendMessage('obsRequest', {
		request: 'GetPreviewScene',
	}, (error, result) => {
		previewScene = result.name;
		setSource();
	});

	const dropdownContent = document.getElementById("sourceList");
	if (nodecg.bundleConfig.useRTMP) {
		for (let i = 0; i < 4; i++) {
			let paperItem = document.createElement("paper-item");
			paperItem.setAttribute("role", "option");
			paperItem.innerHTML = nodecg.bundleConfig.RTMPSource[i];
			dropdownContent.appendChild(paperItem);
		}
	}
	else {
		const dropdownContent = document.getElementById("sourceList");
		for (let i = 0; i < 4; i++) {
			let paperItem = document.createElement("paper-item");
			paperItem.setAttribute("role", "option");
			paperItem.innerHTML = nodecg.bundleConfig.twitchSource[i];
			dropdownContent.appendChild(paperItem);
		}
	}

	dropdownContent.setAttribute('selected', 0);

	window.setInterval(takePreviewScreenshot, nodecg.bundleConfig.obsWebsocket.previewRefresh);

	nodecg.listenFor('obsEvent', (value, ack) => {
		if (value.updateType === 'PreviewSceneChanged') {
			previewScene = value.sceneName;
			setSource();
		}
	});
});

function setSource() {
	nodecg.sendMessage('obsRequest', {
		request: 'GetSceneItemProperties',
		args: {
			"scene-name": previewScene,
			"item": document.getElementById('sourceList').selectedItem.innerHTML,
		}
	}, (error, result) => {
		itemProperties = [];
		document.getElementById("topCrop").value = result.crop.top;
		document.getElementById("leftCrop").value = result.crop.left;
		document.getElementById("rightCrop").value = result.crop.right;
		document.getElementById("bottomCrop").value = result.crop.bottom;
		document.getElementById("positionX").value = result.position.x;
		document.getElementById("positionY").value = result.position.y;
		document.getElementById("scaleWidth").value = result.scale.x.toFixed(3);
		document.getElementById("scaleHeight").value = result.scale.y.toFixed(3);
		itemProperties = result;
	});
}

function takePreviewScreenshot() {
	nodecg.sendMessage('obsRequest', {
		request: 'TakeSourceScreenshot',
		args: {
			sourceName: previewScene,
			embedPictureFormat: 'png',
			width: 720,
			height: 405,
		}
	}, (error, result) => {
		document.getElementById("previewImg").src = result.img;
	})
}

function setCrop() {
	itemProperties.crop.top = document.getElementById("topCrop").value;
	itemProperties.crop.left = document.getElementById("leftCrop").value;
	itemProperties.crop.right = document.getElementById("rightCrop").value;
	itemProperties.crop.bottom = document.getElementById("bottomCrop").value;
	itemProperties.position.x = document.getElementById("leftCrop").value;
	itemProperties.position.y = document.getElementById("topCrop").value;
	nodecg.sendMessage('obsRequest', {
		request: 'SetSceneItemProperties',
		args: {
			"scene-name": previewScene,
			item: document.getElementById('sourceList').selectedItem.innerHTML,
			crop: {
				top: parseFloat(itemProperties.crop.top),
				left: parseFloat(itemProperties.crop.left),
				right: parseFloat(itemProperties.crop.right),
				bottom: parseFloat(itemProperties.crop.bottom),
			},
			position: {
				x: parseFloat(itemProperties.position.x),
				y: parseFloat(itemProperties.position.y),
			},
		},
	});
	document.getElementById("positionX").value = itemProperties.position.x;
	document.getElementById("positionY").value = itemProperties.position.y;
}

function setPosition() {
	itemProperties.position.x = document.getElementById("positionX").value;
	itemProperties.position.y = document.getElementById("positionY").value;
	nodecg.sendMessage('obsRequest', {
		request: 'SetSceneItemProperties',
		args: {
			"scene-name": previewScene,
			item: document.getElementById('sourceList').selectedItem.innerHTML,
			position: {
				x: parseFloat(itemProperties.position.x),
				y: parseFloat(itemProperties.position.y),
			},
		},
	});
}

function setScale() {
	itemProperties.scale.x = document.getElementById("scaleWidth").value;
	itemProperties.scale.y = document.getElementById("scaleHeight").value;
	nodecg.sendMessage('obsRequest', {
		request: 'SetSceneItemProperties',
		args: {
			"scene-name": previewScene,
			item: document.getElementById('sourceList').selectedItem.innerHTML,
			scale: {
				x: parseFloat(itemProperties.scale.x),
				y: parseFloat(itemProperties.scale.y),
			},
		},
	});
}


function reset() {
		nodecg.sendMessage('obsRequest', {
		request: 'SetSceneItemProperties',
		args: {
			"scene-name": previewScene,
			item: document.getElementById('sourceList').selectedItem.innerHTML,
			crop: {
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
			},
			position: {
				x: 0,
				y: 0,
			},
			scale: {
				x: 1,
				y: 1,
			},
		},
	});
	itemProperties.crop.top = 0;
	itemProperties.crop.left = 0;
	itemProperties.crop.right = 0;
	itemProperties.crop.bottom = 0;
	itemProperties.position.x = 0;
	itemProperties.position.y = 0;
	itemProperties.scale.x = 1;
	itemProperties.scale.y = 1;
	document.getElementById("topCrop").value = itemProperties.crop.top;
	document.getElementById("leftCrop").value = itemProperties.crop.left;
	document.getElementById("rightCrop").value = itemProperties.crop.right;
	document.getElementById("bottomCrop").value = itemProperties.crop.bottom;
	document.getElementById("positionX").value = itemProperties.position.x;
	document.getElementById("positionY").value = itemProperties.position.y;
	document.getElementById("scaleWidth").value = itemProperties.scale.x.toFixed(3);
	document.getElementById("scaleHeight").value = itemProperties.scale.y.toFixed(3);
}