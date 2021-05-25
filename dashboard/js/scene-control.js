const speedcontrolBundle = 'nodecg-speedcontrol';
const activeRunners = nodecg.Replicant('activeRunners');
const quality = nodecg.Replicant('quality');
const sceneList = nodecg.Replicant('sceneList');
const currentScene = nodecg.Replicant('currentScene');

window.addEventListener('load', function () {

	// Load replicants.
	NodeCG.waitForReplicants(activeRunners, quality, sceneList, currentScene).then(() => {

		// Populates dropdown with current scenes.
		sceneList.on('change', (newVal, oldVal) => {
			const dropdownContent = document.getElementById("sceneList");
			dropdownContent.innerHTML = '';
			for (let i = 0; i < newVal.length; i++) {
				let paperItem = document.createElement("paper-item");
				paperItem.innerHTML = newVal[i].name;
				if (newVal[i].name === currentScene.value.preview)
					dropdownContent.setAttribute('selected', i)
				dropdownContent.appendChild(paperItem);
			}
		});

		// Update selected scene if changed in OBS.
		currentScene.on('change', (newVal, oldVal) => {
			const dropdownContent = document.getElementById('sceneList');
			const items = dropdownContent.items;
			for (let i = 0; i < items.length; i++) {
				if (items[i].outerText === newVal.preview) {
					dropdownContent.selectIndex(i);
					break;
				}
			}
		});

		// Update active runners.
		activeRunners.on('change', (newVal, oldVal) => {
			for (let i = 0; i < 4; i++) {
				if (newVal[i] === null || newVal[i] === undefined)
					newVal[i] = '';
				document.getElementById('input' + i).setAttribute('value', newVal[i]);
			}
		});

		// Update quality.
		quality.on('change', (newVal, oldVal) => {
			const dropdownContent = document.getElementById("qualityList");
			let items = dropdownContent.items;
			for (let i = 0; i < items.length; i++) {
				if (items[i].outerText === newVal) {
					dropdownContent.selectIndex(i);
					break;
				}
				else if (i + 1 === items.length)
					dropdownContent.selectIndex(0);
			}
		});
	});
});

function changeScene(element) {
	currentScene.value.preview = element.selectedItem.innerHTML;
}

function updateSource() {
	activeRunners.value = [document.getElementById('input0').value, document.getElementById('input1').value, document.getElementById('input2').value, document.getElementById('input3').value]
}

function updateQuality(element) {
	quality.value = element.selectedItem.innerHTML;
}

function refreshSource() {
	nodecg.sendMessage('refreshSource');
}