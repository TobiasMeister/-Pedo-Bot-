const Logger = require('./Logger.js')('Dynamic');

const FS = require('fs');

module.exports.load = (Bot, typename, regFn) => {
	try {
		let files = FS.readdirSync(`./${typename}/`);

		files.forEach(file => {
			if (!file.match(/js$/)) return;

			let name = file.split('.')[0];
			Logger.log(name);

			let fn = require(`../${typename}/${file}`);

			if (fn.init) fn.init(Bot);

			if (file.startsWith('_')) {
				for (let sub in fn.run) {
					if (fn.run.hasOwnProperty(sub)) {
						Logger.log('└─', sub);
						regFn(fn.run[sub], sub, sub.startsWith('_'));
					}
				}

			} else {
				regFn(fn.run, name);
			}
		});

	} catch (err) {
		return Logger.error(err);
	}
};
