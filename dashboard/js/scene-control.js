'use strict';

const speedcontrolBundle = 'nodecg-speedcontrol';
let previewScene;

window.addEventListener('load', function() {

	if (nodecg.bundleConfig.speedcontrol.useSpeedcontrolData) {
		let runDataActiveRun = nodecg.Replicant('runDataActiveRun', speedcontrolBundle);

		NodeCG.waitForReplicants(runDataActiveRun).then(loadFromSpeedControl);

		function loadFromSpeedControl() {
			runDataActiveRun.on('change', (newVal, oldVal) => {
				nodecg.sendMessage('getCurrentRun', '', (error, result) => {
					if (result !== newVal.id) {
						nodecg.sendMessage('setCurrentRun', newVal.id);
						updateSource(newVal, true);
					}
				});
			});
		}
	}

	nodecg.sendMessage('obsRequest', {
		request: 'GetPreviewScene',
	}, (error, result) => {
		previewScene = result.name;
	});
	nodecg.sendMessage('obsRequest', {
		request: 'GetSceneList',
	}, (error, result) => {
		const dropdownContent = document.getElementById("sceneList");
		for (let i = 0; i < result.scenes.length; i++) {
			let paperItem = document.createElement("paper-item");
			paperItem.setAttribute("role", "option");
			paperItem.innerHTML = result.scenes[i].name;
			if (result.scenes[i].name === previewScene)
				dropdownContent.setAttribute('selected', i)
			dropdownContent.appendChild(paperItem);
		}
	});

	nodecg.sendMessage('getRunners', '', (error, result) => {
		for (let i = 0; i < 4; i++) {
			if (result[i] !== undefined)
				document.getElementById(i).setAttribute('value', result[i]);
			else
				document.getElementById(i).setAttribute('value', '');
		}
		const dropdownContent = document.getElementById("qualityList");
		let items = dropdownContent.items;
		for (let i = 0; i < items.length; i++) {
			if (items[i].outerText === result[4]) {
				dropdownContent.selectIndex(i);
				break;
			}
			else if (i + 1 === items.length)
				dropdownContent.selectIndex(0);
		}
	});

	nodecg.listenFor('obsEvent', (value, ack) => {
		if (value.updateType === 'PreviewSceneChanged') {
			const dropdownContent = document.getElementById("sceneList");
			const items = dropdownContent.items;
			for (let i = 0; i < items.length; i++) {
				if (items[i].outerText === value.sceneName) {
					dropdownContent.selectIndex(i);
					break;
				}
			}
		}
	});
});

function changeScene() {
	const scene = document.getElementById("sceneList").selectedItem.innerHTML;
	nodecg.sendMessage('obsRequest', {
		request: 'SetPreviewScene',
		args: {
			"scene-name": scene,
		}
	})
}

function updateSource(data, autoUpdate) {
	let quality;
	try {
		const qualityOption = document.getElementById("qualityList").selectedItem.innerHTML;
		if (qualityOption === 'Auto')
			quality = '';
		else if (qualityOption === 'Source')
			quality = '&quality=chunked';
		else if (qualityOption === '720p60')
			quality = '&quality=720p60';
		else if (qualityOption === '720p')
			quality = '&quality=720p30';
		else if (qualityOption === '480p')
			quality = '&quality=480p30';
		else if (qualityOption === '360p')
			quality = '&quality=360p30';
		else if (qualityOption === '160p')
			quality = '&quality=160p30';
	} catch { quality = ''; };

	let playerNames = ['', '', '', '', quality];
	if (nodecg.bundleConfig.speedcontrol.useSpeedcontrolData && autoUpdate) {
		for (let i = 0; i < data.teams.length; i++) {
			let streamKey = '';
			if (nodecg.bundleConfig.speedcontrol.setRunnerStream && data.teams[i].players[0].social.hasOwnProperty('twitch'))
				streamKey = data.teams[i].players[0].social.twitch;
			setStreamKey(streamKey, i, quality);
			playerNames[i] = streamKey;
			if (nodecg.bundleConfig.speedcontrol.setLayout && data.customData.hasOwnProperty('layout') && i < 1) {
				nodecg.sendMessage('obsRequest', {
					request: 'SetPreviewScene',
					args: {
						"scene-name": data.customData.layout,
					}
				})
			}
		}
	}
	else {
		for (let i = 0; i < 4; i++) {
			let streamKey = document.getElementById(i).value;
			setStreamKey(streamKey, i, quality);
			playerNames[i] = streamKey;
		}
	}
	for (let i = 0; i < 4; i++) {
		document.getElementById(i).setAttribute("value", playerNames[i]);
	}
	nodecg.sendMessage('storeRunners', {
		p1: playerNames[0],
		p2: playerNames[1],
		p3: playerNames[2],
		p4: playerNames[3],
		quality: document.getElementById("qualityList").selectedItem.innerHTML,
	})
}

function setStreamKey(streamKey, index, quality) {
	if (nodecg.bundleConfig.useRTMP) {
		nodecg.sendMessage('obsRequest', {
			request: 'SetSourceSettings',
			args: {
				sourceName: nodecg.bundleConfig.playerFeeds[index],
				sourceSettings: {
					input: nodecg.bundleConfig.RTMPServerURL + streamKey,
				}
			}
		})
	}
	else {
		nodecg.sendMessage('obsRequest', {
			request: 'SetSourceSettings',
			args: {
				sourceName: nodecg.bundleConfig.playerFeeds[index],
				sourceSettings: {
					url: 'https://player.twitch.tv/?parent=BLAH&volume=1&!muted&channel=' + streamKey + quality,
				}
			}
		})
	}
}

function refreshSource() {
	let source;
	for (let i = 0; i < 4; i++) {
		source = nodecg.bundleConfig.playerFeeds[i];
		if (nodecg.bundleConfig.useRTMP) {
			nodecg.sendMessage('obsRequest', {
				request: 'RestartMedia',
				args: {
					sourceName: source,
					sourceSettings: {
						url: '',
					}
				}
			})
		}
		else {
			nodecg.sendMessage('obsRequest', {
				request: 'RefreshBrowserSource',
				args: {
					sourceName: source,
					sourceSettings: {
						url: '',
					}
				}
			})
		}
	}
}