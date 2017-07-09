const Logger = require('./Logger.js')('GuildStore');

const DB = new Map();

function initGuild(guild) {
	if (!DB.has(guild)) {
		DB.set(guild, new Map());
	}
}

module.exports = {};

module.exports.set = (guild, params) => {
	initGuild(guild);

	for (let key in params) {
		DB.get(guild).set(key, params[key]);
	}
};

module.exports.get = (guild, ...keys) => {
	const single = keys && keys.length === 1 && !Array.isArray(keys[0]);
	if (keys && Array.isArray(keys[0])) {
		keys = keys[0];
	}

	if (!DB.has(guild)) {
		return single ? undefined : {};
	}

	if (single) {
		return DB.get(guild).get(keys[0]);

	} else {
		let result = {};

		if (keys) {
			keys.forEach(key => result[key] = DB.get(guild).get(key));

		} else {
			for (let [key, value] of DB.get(guild)) {
				if (keys && !keys.includes(key)) continue;

				result[key] = value;
			}
		}

		return result;
	}
};

module.exports.has = (guild, ...keys) => {
	const single = keys && keys.length === 1 && !Array.isArray(keys[0]);
	if (keys && Array.isArray(keys[0])) {
		keys = keys[0];
	}

	if (!DB.has(guild)) {
		if (single) return false;

		let result = {};
		keys.forEach(key => result[key] = false);
		return result;
	}

	if (single) {
		return DB.get(guild).has(keys[0]);

	} else {
		let result = {};
		keys.forEach(key => result[key] = DB.get(guild).has(key));
		return result;
	}
};

module.exports.delete = (guild, ...keys) => {
	if (keys && Array.isArray(keys[0])) {
		keys = keys[0];
	}

	if (!keys || keys.length === 0) {
		return Logger.error("No keys provided; to remove all keys, use the 'purge' function instead!");
	}

	if (!DB.has(guild)) return;

	keys.forEach(key => DB.get(guild).delete(key));
};

module.exports.purge = (guild) => {
	DB.delete(guild);
};
