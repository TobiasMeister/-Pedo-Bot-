const Logger = require('../util/Logger.js')('Media');

const download = require('download-file');

const FS = require('fs');

module.exports = {};

module.exports.download = (url, filename = null, forceDownload = true, dir = 'media/user/') => {
	return new Promise((resolve, reject) => {
		if (forceDownload) {
			Logger.log('Cache disabled manually. Forcing (re)download');

		} else {
			Logger.log('Searching for cached version of file');

			let files = FS.readdirSync(dir);

			if (files.includes(filename)) {
				Logger.log('Cached file found. Skipping download');

				return resolve({
					path: dir + filename,
					filename: filename
				});
			}

			Logger.log('File not found in cache');
		}

		Logger.log('Starting file download');

		download(url, { filename: filename, directory: dir }, err => {
			if (err) return Logger.error(err);

			Logger.log('File download finished');

			resolve({
				path: dir + filename,
				filename: filename
			});
		})
	});
};
