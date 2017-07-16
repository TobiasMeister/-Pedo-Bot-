const Logger = require('../util/Logger.js')('EVNT', 'error');

const FS = require('fs');

const moment = require('moment');

exports.run = (err) => {
	Logger.error(err);

	let logsDir = 'logs/';
	if (!FS.existsSync(logsDir)) {
		FS.mkdirSync(logsDir);
	}

	let now = moment().format('YYYY-MM-DD HH-mm-ss');
	FS.writeFile(logsDir + `error ${now}.txt`,
			JSON.stringify(err, Object.getOwnPropertyNames(err)).replace(/\\n/g, '\n'));
};
