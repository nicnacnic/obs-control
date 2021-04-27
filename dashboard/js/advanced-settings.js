'use strict';

window.addEventListener('load', function() {
	checkStatus();
});

function getStreamingStatus(callback) {
	nodecg.sendMessage('obsRequest', {
		request: 'GetStreamingStatus',
	}, (error, result) => {
		callback(result.streaming);
	});
}

function getRecordingStatus(callback) {
	nodecg.sendMessage('obsRequest', {
		request: 'GetStreamingStatus',
	}, (error, result) => {
		callback(result.recording);
	});
}

async function checkStatus() {
	getStreamingStatus(function(streamStatus) {
		if (streamStatus) {
			document.getElementById("toggleStream").setAttribute("active", true);
			document.getElementById("toggleStream").innerHTML = "Stop Streaming";
		}

		else {
			document.getElementById("toggleStream").removeAttribute("active");
			document.getElementById("toggleStream").innerHTML = "Start Streaming";
		}
	});
	getRecordingStatus(function(recordingStatus) {
		if (recordingStatus) {
			document.getElementById("toggleRecording").setAttribute("active", true);
			document.getElementById("toggleRecording").innerHTML = "Stop Recording";
		}
		else {
			document.getElementById("toggleRecording").removeAttribute("active");
			document.getElementById("toggleRecording").innerHTML = "Start Recording";
		}
	})
	nodecg.readReplicant('autoRecord', value => {
		if (value) {
			document.getElementById("toggleAutoRecord").setAttribute("active", true);
			document.getElementById("toggleAutoRecord").innerHTML = 'Turn Off Auto Record';
		}
		else {
			document.getElementById("toggleAutoRecord").removeAttribute("active");
			document.getElementById("toggleAutoRecord").innerHTML = 'Turn On Auto Record';
		}
	})
}

function enableButton(element) {
	if (document.getElementById("password").value === nodecg.bundleConfig.settingsPassword)
		document.getElementById(element).removeAttribute("disabled");
}

nodecg.listenFor('obsEvent', (value, ack) => {
	if (value.updateType === 'StreamStarted') {
		document.getElementById("toggleStream").setAttribute("active", true);
		document.getElementById("toggleStream").innerHTML = "Stop Streaming";
		enableButton("toggleStream");
	}
	else if (value.updateType === 'StreamStopped') {
		document.getElementById("toggleStream").removeAttribute("active");
		document.getElementById("toggleStream").innerHTML = "Start Streaming";
		enableButton("toggleStream");
	}
	else if (value.updateType === 'RecordingStarted') {
		document.getElementById("toggleRecording").setAttribute("active", true);
		document.getElementById("toggleRecording").innerHTML = "Stop Recording";
		enableButton("toggleRecording");
	}
	else if (value.updateType === 'RecordingStopped') {
		document.getElementById("toggleRecording").removeAttribute("active");
		document.getElementById("toggleRecording").innerHTML = "Start Recording";
		enableButton("toggleRecording");
	}
});

nodecg.listenFor('clearSettings', (value, ack) => {
	document.getElementById("password").removeAttribute("disabled");
	document.getElementById("password").removeAttribute("invalid");
	document.getElementById("password").value = '';

	document.getElementById("toggleStream").setAttribute("disabled", true);
	document.getElementById("toggleRecording").setAttribute("disabled", true);
	document.getElementById("toggleAutoRecord").setAttribute("disabled", true);
	document.getElementById("reauthenticate").setAttribute("disabled", true);
});

function validatePassword() {
	if (document.getElementById("password").value === nodecg.bundleConfig.settingsPassword) {
		document.getElementById("password").validate();
		document.getElementById("password").setAttribute("disabled", true);
		document.getElementById("toggleStream").removeAttribute("disabled");
		document.getElementById("toggleRecording").removeAttribute("disabled");
		document.getElementById("toggleAutoRecord").removeAttribute("disabled");
		document.getElementById("reauthenticate").removeAttribute("disabled");
	}
	else {
		document.getElementById("password").setAttribute("invalid", true);
		document.getElementById("password").value = '';
	}
}

async function toggleStream() {
	getStreamingStatus(function(streamStatus) {
		if (streamStatus) {
			nodecg.sendMessage('obsRequest', { request: 'StopStreaming' });
			document.getElementById("toggleStream").setAttribute("disabled", true)
		}
		else {
			nodecg.sendMessage('obsRequest', { request: 'StartStreaming' });
			document.getElementById("toggleStream").setAttribute("disabled", true)
		}
	});
}

async function toggleRecording() {
	getRecordingStatus(function(recordingStatus) {
		console.log('test');
		if (recordingStatus) {
			nodecg.sendMessage('obsRequest', { request: 'StopRecording' });
			document.getElementById("toggleRecording").setAttribute("disabled", true)
		}
		else {
			nodecg.sendMessage('obsRequest', { request: 'StartRecording' });
			document.getElementById("toggleRecording").setAttribute("disabled", true)
		}
	});
}

function toggleAutoRecord() {
	let autoRecord = nodecg.Replicant('autoRecord');
	NodeCG.waitForReplicants(autoRecord).then(() => {
		if (autoRecord.value) {
			document.getElementById("toggleAutoRecord").innerHTML = "Turn On Auto Record";
			autoRecord.value = false;
			document.getElementById("toggleAutoRecord").removeAttribute("active");
		}
		else {
			document.getElementById("toggleAutoRecord").innerHTML = "Turn Off Auto Record";
			autoRecord.value = true;
			document.getElementById("toggleAutoRecord").setAttribute("active", true);
		}
	});
}

function reauthenticate() {
	nodecg.sendMessage("reauthenticate", '');
	document.getElementById("reauthenticate").setAttribute("disabled", true);

	nodecg.listenFor('reconnected', (value, ack) => {
		document.getElementById("reauthenticate").removeAttribute("disabled");
	});
}
