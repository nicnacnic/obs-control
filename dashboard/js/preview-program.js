'use strict';

let previewScene;
let autoRecord;

nodecg.sendMessage('obsRequest', {
	request: 'GetPreviewScene',
}, (error, result) => {
	previewScene = result.name;
});

nodecg.listenFor('obsEvent', (value, ack) => {
	nodecg.sendMessage('getAutoRecord', '', (error, result) => { autoRecord = result; });
	if (value.updateType === 'PreviewSceneChanged')
		previewScene = value.sceneName;
	else if (value.updateType === 'TransitionBegin') {
		document.getElementById("transition").setAttribute("disabled", "true");
		nodecg.sendMessage('obsRequest', {
			request: 'GetRecordingStatus',
		}, (error, result) => {
			if (value.toScene === 'Intermission' && autoRecord && !document.getElementById("emergency").hasAttribute("disabled") && result.isRecording) {
				nodecg.sendMessage('obsRequest', {
					request: 'StopRecording',
				})
			}
		})
	}
	else if (value.updateType === 'TransitionEnd') {
		document.getElementById("transition").removeAttribute("disabled");
		if (value.toScene !== 'Intermission') {
			document.getElementById("emergency").removeAttribute("disabled");
			nodecg.sendMessage('obsRequest', {
				request: 'GetRecordingStatus',
			}, (error, result) => {
				if (autoRecord && !document.getElementById("emergency").hasAttribute("disabled") && !result.isRecording) {
					nodecg.sendMessage('obsRequest', {
						request: 'StartRecording',
					})
				}
			})
		}
	}
	else if (value.updateType === 'StreamStarted')
		document.getElementById("streaming").style.color = "limegreen";
	else if (value.updateType === 'StreamStopped')
		document.getElementById("streaming").style.color = "white";
	else if (value.updateType === 'RecordingStarted')
		document.getElementById("recording").style.color = "red";
	else if (value.updateType === 'RecordingStopped')
		document.getElementById("recording").style.color = "white";
})

window.setInterval(function() {
	takePreviewScreenshot();
	takeProgramScreenshot();
}, nodecg.bundleConfig.obsWebsocket.previewRefresh);

getStreamingStatus();

function takePreviewScreenshot() {
	nodecg.sendMessage('obsRequest', {
		request: 'TakeSourceScreenshot',
		args: {
			sourceName: previewScene,
			embedPictureFormat: 'png',
			width: 480,
			height: 270,
		}
	}, (error, result) => {
		document.getElementById("previewImg").src = result.img;
	})
}

function takeProgramScreenshot() {
	nodecg.sendMessage('obsRequest', {
		request: 'TakeSourceScreenshot',
		args: {
			embedPictureFormat: 'png',
			width: 480,
			height: 270,
		}
	}, (error, result) => {
		document.getElementById("programImg").src = result.img;
	})
}

function transitionToProgram() {
	nodecg.sendMessage('obsRequest', {
		request: 'TransitionToProgram',
	})
}

function emergencyTransition() {
	nodecg.sendMessage('obsRequest', {
		request: 'SetPreviewScene',
		args: {
			"scene-name": 'Intermission',
		}
	})
	nodecg.sendMessage('obsRequest', {
		request: 'TransitionToProgram',
	})
	document.getElementById("emergency").setAttribute("disabled", "true");
}

function getStreamingStatus() {
	nodecg.sendMessage('obsRequest', {
		request: 'GetStreamingStatus',
	}, (error, result) => {
		if (result.streaming)
			document.getElementById("streaming").style.color = "limegreen";
		if (result.recording)
			document.getElementById("recording").style.color = "red";
	})
}