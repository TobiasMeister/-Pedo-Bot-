const Logger = require('./Logger.js')('GuildConf');

const SQLite = require('sqlite3').verbose();
const DB = new SQLite.Database('config.sqlite');

function errCallback(err) {
	if (err) return Logger.error(err);
}

function initTable(category) {
	DB.run(`CREATE TABLE IF NOT EXISTS ${category} (
				guild	INTEGER	NOT NULL,
				key		BLOB	NOT NULL,
				value	BLOB,
				PRIMARY KEY(guild, key)
			);
			`, errCallback);
}

function tableExists(category) {
	return new Promise((resolve, reject) => {
		DB.get(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?`,
				category, (err, row) => {
					if (err) return reject(Logger.format(err));

					resolve(!!row);
				});
	});
}

function buildResult(rows) {
	let result = {};
	rows.forEach(row => result[row.key] = row.value);
	return result;
}

module.exports = {};

module.exports.set = (category, guild, params) => {
	if (!category.match(/^\w+$/)) {
		return Logger.error('Invalid category; it may only contain alphanumeric characters!');
	}

	DB.serialize(() => {
		initTable(category);

		let stmt = DB.prepare(`
				REPLACE INTO ${category} (guild, key, value) VALUES(?, ?, ?)`);

		for (let key in params) {
			stmt.run([ guild, key, params[key] ], errCallback);
		}

		stmt.finalize();
	});
};

module.exports.get = (category, guild, ...keys) => {
	if (!category.match(/^\w+$/)) {
		return Promise.reject(Logger.format('Invalid category; it may only contain alphanumeric characters!'));
	}

	return new Promise((resolve, reject) => {
		const single = keys && keys.length === 1 && !Array.isArray(keys[0]);
		if (keys && Array.isArray(keys[0])) {
			keys = keys[0];
		}

		DB.serialize(async () => {
			if (!await tableExists(category)) {
				return resolve(single ? undefined : {});
			}

			let query = `SELECT key, value FROM ${category} WHERE guild = ?`;

			if (!keys || keys.length === 0) {
				DB.all(query, [ guild ], (err, rows) => {
					if (err) return reject(Logger.format(err));

					resolve(buildResult(rows));
				});

			} else {
				let values = Array(keys.length).fill('?');
				query += ` AND key IN(${values.join(', ')})`;

				DB.all(query, [ guild, ...keys ], (err, rows) => {
					if (err) return reject(Logger.format(err));

					if (single) {
						resolve(rows[0] ? rows[0].value : undefined);
					} else {
						resolve(buildResult(rows));
					}
				});
			}
		});
	});
};

module.exports.has = (category, guild, ...keys) => {
	if (!category.match(/^\w+$/)) {
		return Logger.error('Invalid category; it may only contain alphanumeric characters!');
	}

	return new Promise((resolve, reject) => {
		const single = keys && keys.length === 1 && !Array.isArray(keys[0]);
		if (keys && Array.isArray(keys[0])) {
			keys = keys[0];
		}

		DB.serialize(async () => {
			if (!await tableExists(category)) {
				if (single) return resolve(false);

				let result = {};
				keys.forEach(key => result[key] = false);
				return resolve(result);
			}

			if (single) {
				DB.get(`SELECT 1 FROM ${category} WHERE guild = ? AND key = ?`,
						[ guild, keys[0] ], (err, row) => {
							if (err) return reject(Logger.format(err));

							resolve(!!row);
						});

			} else {
				let values = Array(keys.length).fill('?');
				let query = `SELECT key FROM ${category} WHERE guild = ? AND key IN(${values.join(', ')})`;

				DB.all(query, [ guild, ...keys ], (err, rows) => {
					if (err) return reject(Logger.format(err));

					let result = {};
					rows.forEach(row => result[row.key] = true);
					keys.filter(key => !Object.keys(result).includes(key))
							.forEach(key => result[key] = false);
					resolve(result);
				});
			}
		});
	});
};

module.exports.delete = (category, guild, ...keys) => {
	if (!category.match(/^\w+$/)) {
		return Logger.error('Invalid category; it may only contain alphanumeric characters!');
	}

	if (keys && Array.isArray(keys[0])) {
		keys = keys[0];
	}

	if (!keys || keys.length === 0) {
		return Logger.error("No keys provided; to remove all keys, use the 'purge' function instead!");
	}

	DB.serialize(async () => {
		if (!await tableExists(category)) return;

		let values = Array(keys.length).fill('?');
		DB.run(`DELETE FROM ${category}
				WHERE guild = ? AND key IN(${values.join(', ')})
				`,[ guild, ...keys ], errCallback);
	});
};

module.exports.purge = (category, guild) => {
	if (!category.match(/^\w+$/)) {
		return Logger.error('Invalid category; it may only contain alphanumeric characters!');
	}

	DB.serialize(async () => {
		if (!await tableExists(category)) return;

		DB.run(`DELETE FROM ${category} WHERE guild = ?`,
				guild, errCallback);
	});
};
