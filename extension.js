const path = require('path');
const express = require('express');
const app = express();
const transformMiddleware = require('express-transform-bare-module-specifiers').default;

app.use('*', transformMiddleware({
	rootDir: path.resolve(__dirname, '/bundles/obs-control'),
	modulesUrl: '/bundles/obs-control/node_modules'
}));

const OBSWebSocket = require('obs-websocket-js');
const speedcontrolBundle = 'nodecg-speedcontrol';
let connectionError = false;
let twitchQuality;

module.exports = function(nodecg) {
	const obs = new OBSWebSocket();

	// Initialize replicants.
	const activeRunners = nodecg.Replicant('activeRunners', { defaultValue: ['', '', '', ''] });
	const quality = nodecg.Replicant('quality', { defaultValue: 'Auto' })
	const streamStatus = nodecg.Replicant('streamStatus');
	const sceneList = nodecg.Replicant('sceneList');
	const currentScene = nodecg.Replicant('currentScene');
	const currentCrop = nodecg.Replicant('currentCrop');
	const cropItems = nodecg.Replicant('cropItems');
	const audioSources = nodecg.Replicant('audioSources');
	const previewProgram = nodecg.Replicant('previewProgram');
	const emergencyTransition = nodecg.Replicant('emergencyTransition', false);
	const autoRecord = nodecg.Replicant('autoRecord', { defaultValue: false });
	const stats = nodecg.Replicant('stats', {
		defaultValue: {
			cpuUsage: 0.00,
			fps: 0.00,
			kbitsPerSec: 0000,
			averageFrameTime: 0.0,
			renderMissedFrames: 0,
			renderTotalFrames: 0,
			outputSkippedFrames: 0,
			outputTotalFrames: 0,
			numDroppedFrames: 0,
			numTotalFrames: 0,
			totalStreamTime: 0,
			freeDiskSpace: 0
		}
	});
	let runDataActiveRun;

	// Connect to OBS.
	obs.connect({ address: nodecg.bundleConfig.obsWebsocket.address, password: nodecg.bundleConfig.obsWebsocket.password }).then(() => {
		nodecg.log.info('Connected to OBS instance!');

		// Load data from nodecg-speedcontrol (if active).
		if (nodecg.bundleConfig.general.speedcontrolSetRunner || nodecg.bundleConfig.general.speedcontrolSetLayout) {
			runDataActiveRun = nodecg.Replicant('runDataActiveRun', speedcontrolBundle)
			setTimeout(function() {
				runDataActiveRun.on('change', (newVal, oldVal) => {
					let runnersArray = ['', '', '', ''];
					let runnersArrayIndex = 0;
					try {
						for (let i = 0; i < newVal.teams.length; i++) {
							for (let j = 0; j < newVal.teams[i].players.length; j++) {
								runnersArray[runnersArrayIndex] = newVal.teams[i].players[j].social.twitch;
								runnersArrayIndex++;
							}
						}
						activeRunners.value = runnersArray;
					} catch { }
				});
			}, 3000)
		}

		// Get replicant data from OBS.
		obs.send('GetStreamingStatus').then(result => streamStatus.value = { streaming: result.streaming, recording: result.recording, });
		obs.send('GetSceneList').then(result => {
			sceneList.value = result.scenes;
			currentScene.value.program = result.currentScene;
		}).catch((error) => websocketError(error));
		obs.send('GetPreviewScene').then(result => {
			const blockedTypes = ['wasapi_input_capture', 'wasapi_output_capture', 'pulse_input_capture', 'pulse_output_capture', 'group'];
			let sourceArray = [];
			currentScene.value = { preview: result.name };
			for (let i = 0; i < result.sources.length; i++) {
				if (!blockedTypes.includes(result.sources[i].type))
					sourceArray.push(result.sources[i].name)
			}
			if (sourceArray.length > 0)
				cropItems.value = sourceArray;
			else
				cropItems.value = '';
		}).catch((error) => websocketError(error));
		getAudioSources();

		// Listening for OBS events.
		obs.on('ScenesChanged', (data) => sceneList.value = data.scenes)
		obs.on('SwitchScenes', (data) => currentScene.value.program = data.sceneName)
		obs.on('PreviewSceneChanged', (data) => {
			const blockedTypes = ['wasapi_input_capture', 'wasapi_output_capture', 'pulse_input_capture', 'pulse_output_capture', 'group']
			let sourceArray = [];
			currentScene.value.preview = data.sceneName;
			for (let i = 0; i < data.sources.length; i++) {
				if (!blockedTypes.includes(data.sources[i].type))
					sourceArray.push(data.sources[i].name)
			}
			if (sourceArray.length > 0)
				cropItems.value = sourceArray;
			else
				cropItems.value = '';
		})
		obs.on('StreamStatus', (data) => stats.value = data)
		obs.on('StreamStarted', (data) => streamStatus.value.streaming = true)
		obs.on('StreamStopped', (data) => streamStatus.value.streaming = false)
		obs.on('RecordingStarted', (data) => streamStatus.value.recording = true)
		obs.on('RecordingStopped', (data) => streamStatus.value.recording = false)
		obs.on('TransitionEnd', (data) => nodecg.sendMessage('transitionEnd'))
		obs.on('SourceVolumeChanged', (data) => {
			for (let i = 0; i < audioSources.value.length; i++) {
				if (audioSources.value[i].name === data.sourceName) {
					audioSources.value[i].volume = data.volume;
					audioSources.value[i].changed = true;
					break;
				}
			}
		})
		obs.on('SourceMuteStateChanged', (data) => {
			for (let i = 0; i < audioSources.value.length; i++) {
				if (audioSources.value[i].name === data.sourceName) {
					audioSources.value[i].muted = data.muted;
					audioSources.value[i].changed = true;
					break;
				}
			}
		})
		obs.on('SourceAudioSyncOffsetChanged', (data) => {
			for (let i = 0; i < audioSources.value.length; i++) {
				if (audioSources.value[i].name === data.sourceName) {
					audioSources.value[i].offset = data.syncOffset;
					audioSources.value[i].changed = true;
					break;
				}
			}
		})
		obs.on('SourceCreated', (data) => getAudioSources())
		obs.on('SourceDestroyed', (data) => getAudioSources())

		// Listening for requests from clients.
		nodecg.listenFor('toggleStream', (value) => obs.send('StartStopStreaming'))
		nodecg.listenFor('toggleRecording', (value) => obs.send('StartStopRecording'))
		nodecg.listenFor('transitionToProgram', (value) => obs.send('TransitionToProgram'))
		nodecg.listenFor('refreshSource', (value) => {
			const oldVal = activeRunners.value;
			activeRunners.value = ['', '', '', ''];
			setTimeout(function() { activeRunners.value = oldVal; }, 100)
		})
		nodecg.listenFor('reauthenticate', (value) => {
			obs.disconnect();
			obs.connect({ address: nodecg.bundleConfig.obsWebsocket.address, password: nodecg.bundleConfig.obsWebsocket.password })
			nodecg.log.warn('Reauthentication requestedons on ' + Date() + '.')
		})
		nodecg.listenFor('setVolume', (value) => obs.send('SetVolume', { source: value.source, volume: value.volume }))
		nodecg.listenFor('setMute', (value) => obs.send('SetMute', { source: value.source, mute: value.mute }))
		nodecg.listenFor('setOffset', (value) => obs.send('SetSyncOffset', { source: value.source, offset: value.offset }))
		nodecg.listenFor('getCrop', (value) => obs.send('GetSceneItemProperties', { "scene-name": currentScene.value.preview, item: value }).then(result => currentCrop.value = result))

		// Refresh OBS preview/program screenshot.
		setInterval(function() {
			obs.send('TakeSourceScreenshot', {
				sourceName: currentScene.value.preview,
				embedPictureFormat: 'png',
				width: 480,
				height: 270,
			}).then(previewResult => {
				obs.send('TakeSourceScreenshot', {
					embedPictureFormat: 'png',
					width: 480,
					height: 270,
				}).then(programResult => {
					previewProgram.value = { preview: previewResult.img, program: programResult.img };
				}).catch((error) => websocketError(error));
			}).catch((error) => websocketError(error));
		}, nodecg.bundleConfig.obsWebsocket.previewRefresh);

		// Change preview scene.
		currentScene.on('change', (newVal, oldVal) => {
			if (newVal !== undefined)
				obs.send('SetPreviewScene', { "scene-name": newVal.preview }).catch((error) => websocketError(error));
		});

		// Auto-Record logic.
		obs.on('TransitionEnd', (data) => {
			if (data.toScene === nodecg.bundleConfig.scenes.intermission && streamStatus.value.recording && autoRecord.value && emergencyTransition.value === false) {
				obs.send('StopRecording').catch((error) => websocketError(error));
			}
			else if (data.toScene !== nodecg.bundleConfig.scenes.intermission && autoRecord.value) {
				if (!streamStatus.value.recording) { obs.send('StartRecording').catch((error) => websocketError(error)); }
				emergencyTransition.value = false;
			}
		});

		// Emergency Transition logic.
		emergencyTransition.on('change', (newVal, oldVal) => {
			if (newVal) {
				obs.send('SetPreviewScene', { "scene-name": nodecg.bundleConfig.scenes.intermission }).then(function() {
					obs.send('TransitionToProgram').catch((error) => websocketError(error));
					nodecg.log.warn('Emergency transition activated on ' + Date() + '.')
				}).catch((error) => websocketError(error));
			}
		});

		// Update players.
		setTimeout(function() {
			activeRunners.on('change', (newVal, oldVal) => {
				if (nodecg.bundleConfig.general.speedcontrolSetLayout) {
					try {
						if (runDataActiveRun.value.customData !== undefined && runDataActiveRun.value.customData.layout !== undefined) {
							obs.send('SetPreviewScene', { "scene-name": runDataActiveRun.value.customData.layout }).catch((error) => nodecg.log.warn('Scene ' + runDataActiveRun.value.customData.layout + ' does not exist!'));
						}
					} catch { }
				}
				if (nodecg.bundleConfig.general.speedcontrolSetRunner) {
					for (let i = 0; i < 4; i++) {
						if (nodecg.bundleConfig.general.useRTMP) {
							if (newVal[i] === null || newVal[i] === undefined)
								newVal[i] = '';
							obs.send('SetSourceSettings', {
								sourceName: nodecg.bundleConfig.sources.player[i],
								sourceSettings: {
									input: nodecg.bundleConfig.general.RTMPServerURL + newVal[i],
								}
							}).catch((error) => websocketError(error));
						}
						else {
							if (newVal[i] === null || newVal[i] === undefined)
								newVal[i] = '';
							obs.send('SetSourceSettings', {
								sourceName: nodecg.bundleConfig.sources.player[i],
								sourceSettings: {
									url: 'https://player.twitch.tv/?parent=BLAH&volume=1&!muted&channel=' + newVal[i] + twitchQuality,
								}
							}).catch((error) => websocketError(error));
						}
					}
				}
			});
		}, 1000)

		// Update quality.
		quality.on('change', (newVal, oldVal) => {
			try {
				if (newVal === 'Auto')
					twitchQuality = '';
				else if (newVal === 'Source')
					twitchQuality = '&quality=chunked';
				else if (newVal === '720p60')
					twitchQuality = '&quality=720p60';
				else if (newVal === '720p')
					twitchQuality = '&quality=720p30';
				else if (newVal === '480p')
					twitchQuality = '&quality=480p30';
				else if (newVal === '360p')
					twitchQuality = '&quality=360p30';
				else if (newVal === '160p')
					twitchQuality = '&quality=160p30';
			} catch { twitchQuality = ''; };
		});

		// Populate audio sources.
		async function getAudioSources() {
			const audioSourceTypes = ['wasapi_input_capture', 'wasapi_output_capture', 'pulse_input_capture', 'pulse_output_capture', 'browser_source', 'ffmpeg_source', 'vlc_source']
			let playerSources = [];
			let mediaSources = [];
			let sortedArray = [];
			let getPlayerVolume, getSyncOffset;
			const getSources = obs.send('GetSourcesList').then(result => {
				for (let i = 0; i < result.sources.length; i++) {
					if (nodecg.bundleConfig.sources.player.includes(result.sources[i].name))
						playerSources.push(result.sources[i].name)
					else if (!result.sources[i].name.includes('nodecg') && !result.sources[i].name.includes('NodeCG') && audioSourceTypes.includes(result.sources[i].typeId))
						mediaSources.push(result.sources[i].name);
				}
			}).catch((error) => websocketError(error));
			await getSources;
			playerSources.sort((a, b) => a.localeCompare(b))
			mediaSources.sort((a, b) => a.localeCompare(b))

			playerSources.forEach(function(element) {
				getPlayerVolume = obs.send('GetVolume', { source: element }).then(result => {
					getSyncOffset = obs.send('GetSyncOffset', { source: element }).then(data => {
						sortedArray.push({ name: element, volume: result.volume, muted: result.muted, offset: data.offset, changed: false })
					}).catch((error) => websocketError(error));
				}).catch((error) => websocketError(error));
			});
			mediaSources.forEach(function(element) {
				getPlayerVolume = obs.send('GetVolume', { source: element }).then(result => {
					getSyncOffset = obs.send('GetSyncOffset', { source: element }).then(data => {
						sortedArray.push({ name: element, volume: result.volume, muted: result.muted, offset: data.offset, changed: false })
					}).catch((error) => websocketError(error));
				}).catch((error) => websocketError(error));
			});
			await getPlayerVolume;
			await getSyncOffset;
			audioSources.value = sortedArray;
		}

		// Set crops.
		currentCrop.on('change', (newVal, oldVal) => {
			if (newVal !== undefined) {
				obs.send('SetSceneItemProperties', {
					"scene-name": currentScene.value.preview,
					item: newVal.name,
					position: {
						x: newVal.position.x,
						y: newVal.position.y,
					},
					scale: {
						x: newVal.scale.x,
						y: newVal.scale.y,
					},
					crop: {
						top: newVal.crop.top,
						bottom: newVal.crop.bottom,
						left: newVal.crop.left,
						right: newVal.crop.right,
					}
				}).catch((error) => websocketError(error));
			}
		});
		// Catch errors.
		obs.on('error', err => {
			nodecg.log.warn(err);
		});

	}).catch((error) => {
		nodecg.log.error(error)
		nodecg.log.error('Could not connect to OBS. Check the address and password in the config!');
	});


	function websocketError(error) {
		if (error.code === 'NOT_CONNECTED' || error.code === 'CONNECTION_ERROR' || error.error === 'Not Authenticated') {
			if (!connectionError) {
				connectionError = true;
				nodecg.log.error('Disconnected from OBS. Retrying every 10s, please check your connection.');
				let obsReconnect = setInterval(function() {
					obs.connect({ address: nodecg.bundleConfig.obsWebsocket.address, password: nodecg.bundleConfig.obsWebsocket.password }).then(() => {
						nodecg.log.info('Reconnected to OBS instance!');
						connectionError = false;
						clearInterval(obsReconnect);
					}).catch((error));
				}, 10000);
			}
		}
		else
			nodecg.log.error(JSON.stringify(error, null, 2));
	}
};
