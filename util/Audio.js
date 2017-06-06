const Logger = require('../util/Logger.js')('Audio');

const Moment = require('moment');
require("moment-duration-format");

const probe = require('node-ffprobe');

module.exports = {};

module.exports.audioMeta = (path) => {
	return new Promise((resolve, reject) => {
		probe(path, (err, probeData) => {
			if (err) return Logger.error(err);

			resolve(probeData);
		});
	});
};

module.exports.formatDuration = (duration, unit = 'milliseconds') => {
	return Moment.duration(duration, unit).format(() => {
		return duration >= 60 * 60 * 100 ? 'h:mm:ss' : 'mm:ss';
	}, { trim: false });
};
