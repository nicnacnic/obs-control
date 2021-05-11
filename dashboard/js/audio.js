const audioSources = nodecg.Replicant('audioSources');

window.addEventListener('load', function() {

	audioSources.on('change', (newVal, oldVal) => {
		if (oldVal === undefined || newVal.length !== oldVal.length) {
			const main = document.getElementById("main");
			main.innerHTML = '';
			for (let i = 0; i < newVal.length; i++) {
				displayVolume = mulToDb(newVal[i].volume)
				percentVolume = dbToPercent(displayVolume);

				let sliderContainer = document.createElement("div");
				sliderContainer.setAttribute("class", "sliderContainer");

				let label = document.createElement("div");
				label.setAttribute("class", "label");
				label.innerHTML = newVal[i].name;

				let labelValue = document.createElement("span");
				labelValue.setAttribute("id", "labl" + newVal[i].name);
				labelValue.setAttribute("class", "labelValue");

				if (!isFinite(displayVolume))
					labelValue.innerHTML = "-inf dB";
				else
					labelValue.innerHTML = displayVolume + " dB";

				let sliderDiv = document.createElement("div");
				sliderDiv.setAttribute("class", "sliderDiv");

				let muteButton = document.createElement("paper-button");
				muteButton.setAttribute("class", "button");

				let muteButtonIcon = document.createElement("span");
				muteButtonIcon.setAttribute("id", "mute" + newVal[i].name);
				muteButtonIcon.setAttribute("class", "material-icons");
				muteButtonIcon.setAttribute("style", "font-size: 24px; vertical-align: middle;");
				muteButtonIcon.setAttribute("onClick", 'toggleMute(\'' + newVal[i].name + '\', this.innerHTML)');
				if (newVal[i].muted) {
					muteButtonIcon.innerHTML = "volume_off";
					muteButtonIcon.style.color = 'red';
				}
				else {
					muteButtonIcon.innerHTML = "volume_up";
					muteButtonIcon.style.color = 'white';
				};

				let slider = document.createElement("paper-slider");
				slider.setAttribute("id", "slid" + newVal[i].name);
				slider.setAttribute("class", "slider");
				slider.setAttribute("min", "0");
				slider.setAttribute("max", "100");
				slider.setAttribute("value", percentVolume);
				slider.setAttribute("onChange", 'changeVolume(\'' + newVal[i].name + '\', this.value)')

				let syncOffsetDiv = document.createElement("div");
				syncOffsetDiv.setAttribute("class", "syncOffsetDiv");
				syncOffsetDiv.innerHTML = "ms";

				let syncOffset = document.createElement("paper-input");
				syncOffset.setAttribute("id", "sync" + newVal[i].name);
				syncOffset.setAttribute("class", "syncOffset");
				syncOffset.setAttribute("type", "number");
				syncOffset.setAttribute("no-label-float");
				syncOffset.setAttribute("onChange", 'changeSync(\'' + newVal[i].name + '\', this.value)');
				syncOffset.value = (newVal[i].offset / 1000000);

				label.appendChild(labelValue);
				muteButton.appendChild(muteButtonIcon);
				sliderDiv.appendChild(muteButton);
				sliderDiv.appendChild(slider);
				sliderDiv.appendChild(syncOffset);
				sliderDiv.appendChild(syncOffsetDiv)
				sliderContainer.appendChild(label);
				sliderContainer.appendChild(sliderDiv);

				main.appendChild(sliderContainer);
			}
		}
		else {
			for (let i = 0; i < newVal.length; i++) {
				if (newVal[i].changed) {
					if (newVal[i].volume !== oldVal[i].volume) {
						let displayVolume = mulToDb(newVal[i].volume);
						if (!isFinite(displayVolume))
							document.getElementById('labl' + newVal[i].name).innerHTML = "-inf dB";
						else
							document.getElementById('labl' + newVal[i].name).innerHTML = displayVolume + " dB";
						document.getElementById('slid' + newVal[i].name).setAttribute("value", dbToPercent(mulToDb(newVal[i].volume)));
					}
					else if (newVal[i].muted !== oldVal[i].muted) {
						if (newVal[i].muted) {
							document.getElementById('mute' + newVal[i].name).innerHTML = 'volume_off';
							document.getElementById('mute' + newVal[i].name).style.color = 'red';
						}
						else {
							document.getElementById('mute' + newVal[i].name).innerHTML = 'volume_up';
							document.getElementById('mute' + newVal[i].name).style.color = 'white';
						}
					}
					else {
						document.getElementById('sync' + newVal[i].name).setAttribute('value', (newVal[i].offset / 1000000));
					}
					newVal[i].changed = false;
					break;
				}
			}
		}
	});
});

function toggleMute(name, value) {
	let muteState;
	if (value === 'volume_up')
		muteState = true;
	else
		muteState = false;
	nodecg.sendMessage('setMute', { source: name, mute: muteState })
}

function changeVolume(name, value) {
	nodecg.sendMessage('setVolume', { source: name, volume: percentToMul(value.toFixed(1)) })
}

function changeSync(name, value) {
	nodecg.sendMessage('setOffset', { source: name, offset: value * 1000000 })
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