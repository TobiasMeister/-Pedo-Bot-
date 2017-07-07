const Logger = require('../util/Logger.js')('YouTube');

const YTDL = require('youtube-dl');
const updater = require('youtube-dl/lib/downloader');

const FS = require('fs');

module.exports = {};

module.exports.update = () => {
	Logger.log('Updating youtube-dl binaries.');

	updater('./node_modules/youtube-dl/bin/', (err, done) => {
		if (err) return Logger.error(err);

		Logger.log(done);
	});
};

module.exports.fetchInfo = (url, format = 'mp3') => {
	return new Promise((resolve, reject) => {
		Logger.log('Fetching track information');

		YTDL.getInfo(url, ['-o', '/%(title)s - %(id)s.%(ext)s'],
				{ maxBuffer: 10 * 1000 * 1024 }, (err, info) => {

			if (err) return reject(Logger.format(err));

			let infoEntries = [];

			if (!Array.isArray(info)) {
				infoEntries.push(info);
				// Temporary fix for bug in ytdl api
				infoEntries[0].url = url;
			} else {
				infoEntries = info;
			}

			let result = infoEntries.map(info => {
				let filename = info._filename
						.replace(/^(.+\.).+$/, `$1${format}`);

				let filenameFormat = `^(.+) - (.+)(\\.${format})$`;

				return {
					id: filename.match(filenameFormat)[2],
					title: filename.match(filenameFormat)[1],
					filename: filename,
					url: info.url
				};
			});

			if (result.length > 1) {
				resolve({
					playlistId: infoEntries[0].playlist_id,
					playlistTitle: infoEntries[0].playlist_title,
					playlist: infoEntries[0].playlist_title,
					entries: result
				});
			} else {
				resolve({
					playlist: null,
					entries: result
				});
			}
		});
	});
};

module.exports.downloadAudio = (filename, url, forceDownload = true, format = 'mp3', dir = 'media/youtube/') => {
	return new Promise((resolve, reject) => {
		if (!FS.existsSync(dir)) {
			FS.mkdirSync(dir);
		}

		if (forceDownload) {
			Logger.log('Audio cache disabled manually. Forcing (re)download');

		} else {
			Logger.log('Searching for cached version of audio track');

			let files = FS.readdirSync(dir);

			if (files.includes(filename)) {
				Logger.log('Cached audio track found. Skipping download');

				return resolve(dir + filename);
			}

			Logger.log('Audio file not found in cache');
		}

		Logger.log('Starting download of audio file');

		YTDL.exec(url, ['-x',
				'--audio-format', format,
				'-o', dir + '%(title)s - %(id)s.%(ext)s'],
				{}, (err, output) => {

			if (err) return reject(Logger.format(err));

			Logger.log(output.join('\n'));
			Logger.log('Audio track downloaded');

			resolve(dir + filename);
		});
	});
};
