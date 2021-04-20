'use strict';

const OBSWebSocket = require('obs-websocket-js');
const websocketEvents = ['PreviewSceneChanged', 'TransitionBegin', 'TransitionEnd', 'StreamStarted', 'StreamStopped', 'RecordingStarted', 'RecordingStopped', 'SourceMuteStateChanged', 'SourceVolumeChanged', 'StreamStatus', 'SourceAudioSyncOffsetChanged'];
let runnerArray = ['', '', '', '', ''];
let connectionError = false;
let currentRun;
let autoRecord;

module.exports = function(nodecg) {
	autoRecord = nodecg.bundleConfig.autoRecord;
	const obs = new OBSWebSocket();

	obs.connect({ address: nodecg.bundleConfig.obsWebsocket.address, password: nodecg.bundleConfig.obsWebsocket.password }).then(() => {
		nodecg.log.info('Connected to OBS instance!');

		nodecg.listenFor('obsRequest', (value, ack) => {
			if (value.args === undefined) {
				obs.send(value.request).then(data => {
					ack(null, data);
				}).catch((error) => {
					websocketError(error);
				});
			}
			else {
				obs.send(value.request, value.args).then(data => {
					ack(null, data);
				}).catch((error) => {
					websocketError(error, value);
				});
			}
		});

		for (let i = 0; i < websocketEvents.length; i++) {
			obs.on(websocketEvents[i], (data) => nodecg.sendMessage('obsEvent', data));
		}

		obs.on('error', err => {
			websocketError(error, '');
		});

	}).catch((error) => {
		nodecg.log.warn('Could not connect to OBS. Check the address and password in the config!')
	});

	nodecg.listenFor('storeRunners', (value) => {
		runnerArray[0] = value.p1;
		runnerArray[1] = value.p2;
		runnerArray[2] = value.p3;
		runnerArray[3] = value.p4;
		runnerArray[4] = value.quality;
	});

	nodecg.listenFor('getRunners', (value, ack) => {
		ack(null, runnerArray);
	});

	nodecg.listenFor('setCurrentRun', (value, ack) => {
		currentRun = value;
	});

	nodecg.listenFor('getCurrentRun', (value, ack) => {
		ack(null, currentRun);
	});

	function websocketError(error, value) {
		if (error.code === 'NOT_CONNECTED' || error.code === 'CONNECTION_ERROR' || error.error === 'Not Authenticated') {
			if (!connectionError) {
				connectionError = true;
				nodecg.log.warn('Disconnected from OBS. Retrying every 10s, please check your connection.')
				let obsReconnect = setInterval(function() {
					obs.connect({ address: nodecg.bundleConfig.obsWebsocket.address, password: nodecg.bundleConfig.obsWebsocket.password }).then(() => {
						nodecg.log.info('Reconnected to OBS instance!');
						connectionError = false;
						clearInterval(obsReconnect);
					}).catch((error) => {
					});
				}, 10000);
			}
		}
		else
			nodecg.log.warn(JSON.stringify(error, null, 2))
		nodecg.log.warn(JSON.stringify(value, null, 2))
	}

	nodecg.listenFor('setAutoRecord', (value, ack) => {
		autoRecord = value;
	});

	nodecg.listenFor('getAutoRecord', (value, ack) => {
		ack(null, autoRecord);
	});

	nodecg.listenFor('reauthenticate', (value, ack) => {
		obs.disconnect();
		obs.connect({ address: nodecg.bundleConfig.obsWebsocket.address, password: nodecg.bundleConfig.obsWebsocket.password }).then(() => {
			nodecg.sendMessage('reconnected', '');
		});
	});
}