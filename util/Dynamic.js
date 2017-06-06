const Logger = require('./Logger.js')('Dynamic');

const FS = require('fs');

module.exports.load = (typename, regFn, conf = {}) => {
	try {
		let files = FS.readdirSync(`./${typename}/`);

		files.forEach(file => {
			if (!file.match(/js$/)) return;

			let name = file.split('.')[0];
			Logger.log(name);

			let fn = require(`../${typename}/${file}`);

			if (fn.init) fn.init(conf);

			if (file.startsWith('_')) {
				for (let sub in fn.run) {
					if (fn.run.hasOwnProperty(sub)) {
						Logger.log('└─', sub);
						regFn(fn.run[sub], sub);
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
