const Logger = require('./Logger.js')('GuildConf');

const SQLite = require('sqlite3').verbose();
const DB = new SQLite.Database('config.sqlite');

function initTable(category) {
	DB.run(`CREATE TABLE IF NOT EXISTS ${category} (
				guild	INTEGER	NOT NULL,
				key		BLOB	NOT NULL,
				value	BLOB,
				PRIMARY KEY(guild, key)
			);
			`, Logger.error);
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
			stmt.run([ guild, key, params[key] ], Logger.error);
		}

		stmt.finalize();
	});
};

module.exports.get = (category, guild, keys) => {
	if (!category.match(/^\w+$/)) {
		return Logger.error('Invalid category; it may only contain alphanumeric characters!');
	}

	return new Promise((resolve, reject) => {
		DB.serialize(() => {
			initTable(category);

			let query = `SELECT key, value FROM ${category} WHERE guild = ?`;

			if (!keys || keys.length === 0) {
				DB.all(query, [ guild ], (err, rows) => {
					if (err) return reject(Logger.error(err));

					resolve(buildResult(rows));
				});

			} else {
				let values = Array(keys.length).fill('?');
				query += ` AND key IN(${values.join(', ')})`;

				DB.all(query, [ guild ].concat(keys), (err, rows) => {
					if (err) return reject(Logger.error(err));

					resolve(buildResult(rows));
				});
			}
		});
	});
};

module.exports.delete = (category, guild, keys) => {
	if (!category.match(/^\w+$/)) {
		return Logger.error('Invalid category; it may only contain alphanumeric characters!');
	}

	if (!keys || keys.length === 0) {
		return Logger.error("No keys provided; to remove all keys, use the 'purge' function instead!");
	}

	DB.serialize(() => {
		initTable(category);

		let values = Array(keys.length).fill('?');
		DB.run(`DELETE FROM ${category}
				WHERE guild = ? AND key IN(${values.join(', ')})
				`,[ guild ].concat(keys), Logger.error);
	});
};

module.exports.purge = (category, guild) => {
	if (!category.match(/^\w+$/)) {
		return Logger.error('Invalid category; it may only contain alphanumeric characters!');
	}

	DB.serialize(() => {
		initTable(category);

		DB.run(`DELETE FROM ${category} WHERE guild = ?`,
				guild, Logger.error);
	});
};
