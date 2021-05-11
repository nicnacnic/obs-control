const streamStatus = nodecg.Replicant('streamStatus');
const previewProgram = nodecg.Replicant('previewProgram');
const emergencyTransition = nodecg.Replicant('emergencyTransition');

window.addEventListener('load', function() {

	NodeCG.waitForReplicants(streamStatus, previewProgram, emergencyTransition).then(() => {

		previewProgram.on('change', (newVal, oldVal) => {
			document.getElementById("previewImg").src = newVal.preview;
			document.getElementById("programImg").src = newVal.program;
		});

		streamStatus.on('change', (newVal, oldVal) => {
			if (newVal.streaming)
				document.getElementById("streaming").style.color = "limegreen";
			else
				document.getElementById("streaming").style.color = "white";
			if (newVal.recording)
				document.getElementById("recording").style.color = "red";
			else
				document.getElementById("recording").style.color = "white";
		});

		emergencyTransition.on('change', (newVal, oldVal) => {
			if (newVal)
				document.getElementById("emergency").setAttribute("disabled", "true");
			else
				document.getElementById("emergency").removeAttribute("disabled");
		});

		nodecg.listenFor('transitionEnd', (value) => {
			document.getElementById("transition").removeAttribute("disabled");
		});
	})
})

function transitionToProgramButton() {
	nodecg.sendMessage('transitionToProgram');
	document.getElementById("transition").setAttribute("disabled", "true");
}

function emergencyTransitionButton() {
	emergencyTransition.value = true;
}