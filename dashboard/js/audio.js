'use strict';
let audioSourceList = [];

window.addEventListener('load', function() {

	const main = document.getElementById("main");
	
	let inputSources = [];
	let mediaSources = [];
	nodecg.sendMessage('obsRequest', {
		request: 'GetSourcesList',
	}, (error, result) => {
		for (let i = 0; i < result.sources.length; i++) {
				if (result.sources[i].typeId.includes('wasapi') || result.sources[i].typeId.includes('pulse_input_capture') || result.sources[i].typeId.includes('pulse_output_capture'))
					inputSources.push(result.sources[i]);
				else if (nodecg.bundleConfig.mediaAudioSources.includes(result.sources[i].name))
					mediaSources.push(result.sources[i]);
		}
		inputSources.sort(function(a, b) {
			var textA = a.name.toUpperCase();
			var textB = b.name.toUpperCase();
			return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
		});
		
		mediaSources.sort(function(a, b) {
			var textA = a.name.toUpperCase();
			var textB = b.name.toUpperCase();
			return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
		});

		Array.prototype.push.apply(audioSourceList, browserSources);
		Array.prototype.push.apply(audioSourceList, mediaSources);

		for (let i = 0; i < audioSourceList.length; i++) {
			let displayVolume, percentVolume, muted;
			nodecg.sendMessage('obsRequest', {
				request: 'GetVolume',
				args: {
					source: audioSourceList[i].name,
				}
			}, (error, result) => {
				displayVolume = mulToDb(result.volume)
				percentVolume = dbToPercent(displayVolume);
				muted = result.muted;

				let sliderContainer = document.createElement("div");
				sliderContainer.setAttribute("class", "sliderContainer");

				let label = document.createElement("div");
				label.setAttribute("class", "label");
				label.innerHTML = audioSourceList[i].name;

				let labelValue = document.createElement("span");
				labelValue.setAttribute("id", "label" + i);
				labelValue.setAttribute("class", "labelValue");

				if (!isFinite(displayVolume))
					labelValue.innerHTML = "-inf dB";
				else
					labelValue.innerHTML = displayVolume + " dB";

				let sliderDiv = document.createElement("div");
				sliderDiv.setAttribute("class", "sliderDiv");

				let muteButton = document.createElement("paper-button");
				muteButton.setAttribute("id", "mute" + i);
				muteButton.setAttribute("class", "button");

				let muteButtonIcon = document.createElement("span");
				muteButtonIcon.setAttribute("id", "button" + i);
				muteButtonIcon.setAttribute("class", "material-icons");
				muteButtonIcon.setAttribute("style", "font-size: 24px; vertical-align: middle;");
				muteButtonIcon.setAttribute("onClick", "toggleMute(this)");
				if (muted) {
					muteButtonIcon.innerHTML = "volume_off";
					muteButtonIcon.style.color = 'red';
					}
				else {
					muteButtonIcon.innerHTML = "volume_up";
					muteButtonIcon.style.color = 'white';
					};

				let slider = document.createElement("paper-slider");
				slider.setAttribute("id", "slider" + i);
				slider.setAttribute("class", "slider");
				slider.setAttribute("min", "0");
				slider.setAttribute("max", "100");
				slider.setAttribute("value", percentVolume);
				slider.setAttribute("onChange", "changeVolume(this)")

				let syncOffsetDiv = document.createElement("div");
				syncOffsetDiv.setAttribute("id", "syncOffsetDiv" + i);
				syncOffsetDiv.setAttribute("class", "syncOffsetDiv");
				syncOffsetDiv.innerHTML = "ms";

				let syncOffset = document.createElement("paper-input");
				syncOffset.setAttribute("id", "sync" + i);
				syncOffset.setAttribute("class", "syncOffset");
				syncOffset.setAttribute("type", "number");
				syncOffset.setAttribute("no-label-float");
				syncOffset.setAttribute("onChange", "changeSync(this)");
				nodecg.sendMessage('obsRequest', {
					request: 'GetSyncOffset',
					args: {
						source: audioSourceList[i].name,
					}
				}, (error, result) => {
					syncOffset.value = (result.offset / 1000000);
				});

				label.appendChild(labelValue);
				muteButton.appendChild(muteButtonIcon);
				sliderDiv.appendChild(muteButton);
				sliderDiv.appendChild(slider);
				sliderDiv.appendChild(syncOffset);
				sliderDiv.appendChild(syncOffsetDiv)
				sliderContainer.appendChild(label);
				sliderContainer.appendChild(sliderDiv);

				main.appendChild(sliderContainer);
			});
		}
	});
})

function toggleMute(label) {
	let id = label.id.replace(/\D/g, '');
	let muteState;
	if (label.innerHTML === 'volume_off') {
		label.innerHTML = 'volume_up';
		label.style.color = 'white';
		muteState = false;
	}
	else {
		label.innerHTML = 'volume_off';
		label.style.color = 'red';
		muteState = true;
	}

	nodecg.sendMessage('obsRequest', {
		request: 'SetMute',
		args: {
			source: audioSourceList[id].name,
			mute: muteState,
		}
	})
}

function changeVolume(slider) {
	let id = slider.id.replace(/\D/g, '')

	let value = percentToMul(slider.value);
	let displayValue = mulToDb(value);

	nodecg.sendMessage('obsRequest', {
		request: 'SetVolume',
		args: {
			source: audioSourceList[id].name,
			volume: value,
		}
	}, (error, result) => {
		if (!isFinite(displayValue)) {
			document.getElementById("label" + id).innerHTML = "-inf dB";
			}
		else
			document.getElementById("label" + id).innerHTML = displayValue + " dB";
	});
}

function changeSync(input) {
	let id = input.id.replace(/\D/g, '')
	let sync = input.value * 1000000;
	nodecg.sendMessage('obsRequest', {
		request: 'SetSyncOffset',
		args: {
			source: audioSourceList[id].name,
			offset: sync,
		}
	})
}

nodecg.listenFor('obsEvent', (value, ack) => {
	if (value.updateType === 'SourceMuteStateChanged') {
		let index = findIndex(value.sourceName)
		if (index !== null) {
			if (value.muted) {
				document.getElementById("button" + index).innerHTML = "volume_off";
				document.getElementById("button" + index).style.color = "red";
				}
			else {
				document.getElementById("button" + index).innerHTML = "volume_up";
				document.getElementById("button" + index).style.color = "white";
			}
		}
	}
	else if (value.updateType === 'SourceVolumeChanged') {
		let index = findIndex(value.sourceName)
		if (index !== null) {
			let displayVolume = mulToDb(value.volume);
			if (!isFinite(displayVolume))
				document.getElementById("label" + index).innerHTML = "-inf dB";
			else
				document.getElementById("label" + index).innerHTML = displayVolume + " dB";
			document.getElementById("slider" + index).setAttribute("value", dbToPercent(mulToDb(value.volume)));
		}
	}
	else if (value.updateType === 'SourceAudioSyncOffsetChanged') {
		let index = findIndex(value.sourceName)
			if (index !== null) {
				document.getElementById("sync" + index).value = (value.syncOffset / 1000000);
			}
	}
});

function findIndex(source) {
	for (let i = 0; i < audioSourceList.length; i++) {
		if (audioSourceList[i].name === source)
			return i;
	}
	return null;

}

function percentToMul(value) {
	value = value / 100;
	value = 20 * Math.log10(value);
	value = Math.pow(10, -Math.abs(value / 10));
	value = value.toFixed(2);
	return parseFloat(value);
}

function mulToDb(value) {
	return (20 * Math.log10(value)).toFixed(1);
}

function dbToPercent(value) {
	return ((Math.pow(10, value / 40)) * 100).toFixed(0);
}
