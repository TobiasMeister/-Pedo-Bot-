const Logger = require('../util/Logger.js')('YouTube');

const YTDL = require('youtube-dl');
const updater = require('youtube-dl/lib/downloader');
const ytdl = require('ytdl-core');

const urlRegex = require('url-regex');
const youtubeRegex = require('youtube-regex');

const FS = require('fs');
const Stream = require('stream');

module.exports = {};

module.exports.update = () => {
	Logger.log('Updating youtube-dl binaries.');

	updater('./node_modules/youtube-dl/bin/', (err, done) => {
		if (err) return Logger.error(err);

		Logger.log(done);
	});
};

module.exports.fetchInfo = (url, format = 'm4a') => {
	if (!urlRegex().test(url)) return Promise.reject(Logger.format('Not a valid url'));

	return new Promise((resolve, reject) => {
		Logger.log('Fetching track information');

		YTDL.getInfo(url, ['-o', '/%(title)s - %(id)s.%(ext)s'],
				{ maxBuffer: 10 * 1000 * 1024 }, (err, info) => {

			if (err) return reject(Logger.format(err));

			let infoEntries = [];

			if (!Array.isArray(info)) {
				infoEntries.push(info);
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
					url: info.webpage_url
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

/**
 * Only supports links directly from YouTube, can't stream from elsewhere.
 */
module.exports.stream = (url, quality = 140) => {
	if (!youtubeRegex().test(url)) return Logger.error('Not a valid url');

	Logger.log('Fetching audio stream');

	// To figure out quality use -F
	// Regex: https://regex101.com/r/C7umvu/1
	return ytdl(url, { filter: 'audioonly', quality: quality });
};

/**
 * Only supports links directly from YouTube, can't stream from elsewhere.
 */
module.exports.streamAndDownload = (filename, url, forceDownload = false, format = 'm4a', quality = 140, dir = 'media/youtube/') => {
	if (!youtubeRegex().test(url)) return Promise.reject(Logger.format('Not a valid url'));

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

				return resolve({ path: dir + filename });
			}

			Logger.log('Audio file not found in cache');
		}

		let stream = module.exports.stream(url);

		let fileStream = FS.createWriteStream(dir + filename);
		fileStream.on('finish', () => Logger.log('Audio track downloaded'));
		fileStream.on('error', Logger.error);

		let playbackBuffer = new Stream.PassThrough();

		stream.on('data', (data) => {
			fileStream.write(data);
			playbackBuffer.write(data);
		});
		stream.on('finish', () => {
			fileStream.end();
			playbackBuffer.end();
		});

		resolve({
			path: dir + filename,
			stream: playbackBuffer
		});
	});
};

module.exports.download = (filename, url, forceDownload = false, format = 'm4a', dir = 'media/youtube/') => {
	if (!urlRegex().test(url)) return Promise.reject(Logger.format('Not a valid url'));

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
