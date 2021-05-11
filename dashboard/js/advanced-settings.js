'use strict';

const autoRecord = nodecg.Replicant('autoRecord');
const streamStatus = nodecg.Replicant('streamStatus');
let authenticated = false;

window.addEventListener('load', function() {
	NodeCG.waitForReplicants(autoRecord, streamStatus).then(() => {

		// Update buttons.
		streamStatus.on('change', (newVal, oldVal) => {
			if (newVal.streaming) {
				document.getElementById("toggleStream").setAttribute("active", true);
				document.getElementById("toggleStream").innerHTML = "Stop Streaming";
			}
			else {
				document.getElementById("toggleStream").removeAttribute("active");
				document.getElementById("toggleStream").innerHTML = "Start Streaming";
			}
			if (oldVal !== undefined && authenticated && newVal.streaming !== oldVal.streaming)
				document.getElementById("toggleStream").removeAttribute("disabled");

			if (newVal.recording) {
				document.getElementById("toggleRecording").setAttribute("active", true);
				document.getElementById("toggleRecording").innerHTML = "Stop Recording";
			}
			else {
				document.getElementById("toggleRecording").removeAttribute("active");
				document.getElementById("toggleRecording").innerHTML = "Start Recording";
			}
			if (oldVal !== undefined && authenticated && newVal.recording !== oldVal.recording)
				document.getElementById("toggleRecording").removeAttribute("disabled");
		});

		autoRecord.on('change', (newVal, oldVal) => {
			if (newVal) {
				document.getElementById("toggleAutoRecord").setAttribute("active", true);
				document.getElementById("toggleAutoRecord").innerHTML = 'Turn Off Auto Record';
			}
			else {
				document.getElementById("toggleAutoRecord").removeAttribute("active");
				document.getElementById("toggleAutoRecord").innerHTML = 'Turn On Auto Record';
			}
		});

		// Clear settings on open.
		nodecg.listenFor('clearSettings', (value, ack) => {
			document.getElementById("password").removeAttribute("disabled");
			document.getElementById("password").removeAttribute("invalid");
			document.getElementById("password").value = '';

			document.getElementById("toggleStream").setAttribute("disabled", true);
			document.getElementById("toggleRecording").setAttribute("disabled", true);
			document.getElementById("toggleAutoRecord").setAttribute("disabled", true);
			document.getElementById("reauthenticate").setAttribute("disabled", true);
			authenticated = false;
		});
	});
});

function validatePassword() {
	if (document.getElementById("password").value === nodecg.bundleConfig.general.settingsPassword) {
		document.getElementById("password").validate();
		document.getElementById("password").setAttribute("disabled", true);
		document.getElementById("toggleStream").removeAttribute("disabled");
		document.getElementById("toggleRecording").removeAttribute("disabled");
		document.getElementById("toggleAutoRecord").removeAttribute("disabled");
		document.getElementById("reauthenticate").removeAttribute("disabled");
		authenticated = true;
	}
	else {
		document.getElementById("password").setAttribute("invalid", true);
		document.getElementById("password").value = '';
	}
}

function toggleStream() {
	document.getElementById("toggleStream").setAttribute("disabled", true)
	nodecg.sendMessage('toggleStream');
}

function toggleRecording() {
	document.getElementById("toggleRecording").setAttribute("disabled", true)
	nodecg.sendMessage('toggleRecording');
}

function toggleAutoRecord() {
	if (autoRecord.value)
		autoRecord.value = false;
	else
		autoRecord.value = true;
}

function reauthenticate() {
	nodecg.sendMessage("reauthenticate");
}