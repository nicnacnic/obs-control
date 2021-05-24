const currentScene = nodecg.Replicant('currentScene');
const currentCrop = nodecg.Replicant('currentCrop');
const cropItems = nodecg.Replicant('cropItems');
const previewProgram = nodecg.Replicant('previewProgram');
let selectedSource;

window.addEventListener('load', function () {

	NodeCG.waitForReplicants(currentScene, currentCrop, cropItems, previewProgram).then(() => {

		previewProgram.on('change', (newVal, oldVal) => document.getElementById("previewImg").src = newVal.preview);

		cropItems.on('change', (newVal, oldVal) => {
			let dropdownContent = document.getElementById("sourceList");
			dropdownContent.innerHTML = '';
			for (let i = 0; i < newVal.length; i++) {
				let paperItem = document.createElement("paper-item");
				paperItem.innerHTML = newVal[i];
				dropdownContent.appendChild(paperItem);
			}
			dropdownContent.setAttribute('selected', 0);
			if (newVal !== '') {
				nodecg.sendMessage('getCrop', newVal[0]).then(value => {
					document.getElementById('refresh').setAttribute('disabled', 'true');
					if (value === 'browser_source')
						document.getElementById('refresh').removeAttribute('disabled');
				})
				selectedSource = newVal[0];
			}
		})

		currentCrop.on('change', (newVal, oldVal) => {
			if (newVal !== undefined) {
				document.getElementById("topCrop").value = newVal.crop.top;
				document.getElementById("leftCrop").value = newVal.crop.left;
				document.getElementById("rightCrop").value = newVal.crop.right;
				document.getElementById("bottomCrop").value = newVal.crop.bottom;
				document.getElementById("positionX").value = newVal.position.x;
				document.getElementById("positionY").value = newVal.position.y;
				document.getElementById("scaleWidth").value = newVal.scale.x.toFixed(3);
				document.getElementById("scaleHeight").value = newVal.scale.y.toFixed(3);
			}
		})
	});
});

function setSource(source) {
	selectedSource = source;
	nodecg.sendMessage('getCrop', source).then(value => {
		document.getElementById('refresh').setAttribute('disabled', 'true');
		if (value === 'browser_source')
			document.getElementById('refresh').removeAttribute('disabled');
	})
}

function setCrop() {
	let properties = currentCrop.value;
	properties.crop.top = parseFloat(document.getElementById("topCrop").value);
	properties.crop.left = parseFloat(document.getElementById("leftCrop").value);
	properties.crop.right = parseFloat(document.getElementById("rightCrop").value);
	properties.crop.bottom = parseFloat(document.getElementById("bottomCrop").value);

	if (properties.crop.left !== document.getElementById("leftCrop").value)
		properties.position.x = parseFloat(document.getElementById("leftCrop").value);
	if (properties.crop.top !== document.getElementById("topCrop").value)
		properties.position.y = parseFloat(document.getElementById("topCrop").value);
	currentCrop.value = properties;
}

function setPosition() {
	let properties = currentCrop.value;
	properties.position.x = parseFloat(document.getElementById("positionX").value);
	properties.position.y = parseFloat(document.getElementById("positionY").value);
	currentCrop.value = properties;
}

function setScale() {
	let properties = currentCrop.value;
	properties.scale.x = parseFloat(document.getElementById("scaleWidth").value);
	properties.scale.y = parseFloat(document.getElementById("scaleHeight").value);
	currentCrop.value = properties;
}


function reset() {
	let properties = currentCrop.value;
	properties.crop.top = 0;
	properties.crop.left = 0;
	properties.crop.right = 0;
	properties.crop.bottom = 0;
	properties.position.x = 0;
	properties.position.y = 0;
	properties.scale.x = 1;
	properties.scale.y = 1;
	currentCrop.value = properties;
}

function refresh() {
	nodecg.sendMessage('refreshBrowser', selectedSource)
}