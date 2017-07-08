const Logger = require('../util/Logger.js')('Media');

const download = require('download-file');
const urlRegex = require('url-regex');

const FS = require('fs');
const HTTPS = require('https');

module.exports = {};

module.exports.fetchHeaders = (url) => {
	if (!urlRegex().test(url)) return Promise.reject(Logger.format('Not a valid url'));

	return new Promise((resolve, reject) => {
		HTTPS.get(url, (response) => {
			response.once('data', (data) => {
				response.destroy();

				resolve({
					mimeType: response.headers['content-type'],
					size: parseInt(response.headers['content-length']),
					filename: response.headers['content-disposition']
							.match(/^.*?filename=(.+?)(?:;.*)?$/)[1],
					url: url
				});
			});

		}).on('error', (err) => reject(Logger.format(err)));
	});
};

module.exports.download = (filename, url, forceDownload = true, dir = 'media/user/') => {
	if (!urlRegex().test(url)) return Promise.reject(Logger.format('Not a valid url'));

	return new Promise((resolve, reject) => {
		if (!FS.existsSync(dir)) {
			FS.mkdirSync(dir);
		}

		if (forceDownload) {
			Logger.log('Cache disabled manually. Forcing (re)download');

		} else {
			Logger.log('Searching for cached version of file');

			let files = FS.readdirSync(dir);

			if (files.includes(filename)) {
				Logger.log('Cached file found. Skipping download');

				return resolve(dir + filename);
			}

			Logger.log('File not found in cache');
		}

		Logger.log('Starting file download');

		download(url, { filename: filename, directory: dir }, (err) => {
			if (err) return reject(Logger.format(err));

			Logger.log('File download finished');

			resolve(dir + filename);
		})
	});
};
