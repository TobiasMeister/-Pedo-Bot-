const Logger = require('./Logger.js')('Dynamic');

const FS = require('fs');

let types = [];

function fetchTypes(typeName) {
	let path = `./${typeName}/`;

	if (!FS.existsSync(path)) return [];

	return FS.readdirSync(`./${typeName}/`)
			.filter(file => file.match(/js$/));
}

module.exports.load = (Bot, typeName, regFn) => {
	Logger.log(`Registering ${typeName} ...`);

	fetchTypes(typeName).forEach(file => {
		let name = file.split('.')[0];

		let fn = require(`../${typeName}/${file}`);

		if (fn.init) fn.init(Bot);

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

	types.push(typeName);
};

module.exports.destroy = (Bot, typeName, destrFunc) => {
	if (!typeName)
		return types.forEach(type => module.exports.destroy(Bot, type, destrFunc));
	if (!types.includes(typeName))
		return Logger.error('Type not registered, cannot destroy!');

	Logger.log(`De-registering ${typeName} ...`);

	fetchTypes(typeName).forEach(file => {
		let name = file.split('.')[0];

		let fn = require(`../${typeName}/${file}`);

		if (fn.destroy) fn.destroy(Bot);
		if (destrFunc) destrFunc(name);
	});

	types = types.filter(type => type != typeName);
};
