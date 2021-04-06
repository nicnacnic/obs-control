'use strict';

let autoRecord;

nodecg.listenFor('obsEvent', (value, ack) => {
	if (value.updateType === 'StreamStatus') {
		nodecg.sendMessage('getAutoRecord', '', (error, result) => { autoRecord = result; });
		document.getElementById("cpuUsage").innerHTML = value.cpuUsage.toFixed(1) + '%';
		document.getElementById("fps").innerHTML = value.fps.toFixed(1) + ' FPS';
		document.getElementById("bitrate").innerHTML = value.kbitsPerSec + ' kb/s';
		document.getElementById("frameTime").innerHTML = value.averageFrameTime.toFixed(1) + ' ms';
		document.getElementById("rendering").innerHTML = value.renderMissedFrames + ' / ' + value.renderTotalFrames + ' (' + (value.renderMissedFrames / value.renderTotalFrames).toFixed(1) + '%)';
		document.getElementById("encoding").innerHTML = value.outputSkippedFrames + ' / ' + value.outputTotalFrames + ' (' + (value.outputSkippedFrames / value.outputTotalFrames).toFixed(1) + '%)';
		document.getElementById("network").innerHTML = value.numDroppedFrames + ' / ' + value.numTotalFrames + ' (' + (value.numDroppedFrames / value.numTotalFrames).toFixed(1) + '%)';
		document.getElementById("uptime").innerHTML = new Date(value.totalStreamTime * 1000).toISOString().substr(11, 8)
		document.getElementById("diskSpace").innerHTML = (value.freeDiskSpace / 1000).toFixed(1) + ' GB';
		nodecg.sendMessage("getAutoRecord", true, (error, result) => {
			if (result)
				document.getElementById("autoRecord").innerHTML = 'Active';
			else
				document.getElementById("autoRecord").innerHTML = 'Inactive';
		});
	}
});
function clearSettings() {
	nodecg.sendMessage('clearSettings', '');
}