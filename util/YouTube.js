const Logger = require('../util/Logger.js')('YouTube');

const YTDL = require('youtube-dl');
const updater = require('youtube-dl/lib/downloader');
const ytdl = require('ytdl-core');

const urlRegex = require('url-regex');
const youtubeRegex = require('youtube-regex');

const FS = require('fs');
const Stream = require('stream');

const treeKill = require('tree-kill');

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
						.replace(/^\/?(.+\.).+$/, `$1${format}`);

				let filenameFormat = `^(.+) - (.+)(\\.${format})$`;

				return {
					id: filename.match(filenameFormat)[2],
					title: filename.match(filenameFormat)[1],
					filename: filename,
					url: info.webpage_url,
					protocol: info.protocol
				};
			});

			resolve({
				playlist: infoEntries[0].playlist,
				entries: result
			});
		});
	});
};

module.exports.stream = (url, isStream, quality, silent = false) => {
	if (!urlRegex().test(url)) return Logger.error('Not a valid url');

	// To figure out quality use -F
	// Regex: https://regex101.com/r/C7umvu/1
	quality = quality || (isStream ? 93 : 140);

	if (!silent) Logger.log('Fetching audio stream');

	var { spawn } = require('child_process');
	var proc = spawn('node_modules/youtube-dl/bin/youtube-dl',
			['-o', '-', url, '--audio-quality', quality]);

	proc.stdout.stop = () => {
		treeKill(proc.pid, 'SIGTERM', (err) => {
			if (err) return Logger.error(err);
		});
	};

	return proc.stdout;
};

module.exports.streamAndDownload = (filename, url, forceDownload = false, format = 'm4a', quality = 140, dir = 'media/youtube/') => {
	if (!urlRegex().test(url)) return Promise.reject(Logger.format('Not a valid url'));

	return new Promise((resolve, reject) => {
		Logger.log('Searching for cached version of audio track');

		let files = FS.readdirSync(dir);

		if (files.includes(filename)) {
			Logger.log('Cached audio track found. Skipping download');

			return resolve({ path: dir + filename });
		}

		Logger.log('Audio file not found in cache');
		Logger.log('Starting download of audio file');

		let fileStream = FS.createWriteStream(dir + filename);
		fileStream.on('finish', () => Logger.log('Audio track downloaded'));
		fileStream.on('error', Logger.error);

		module.exports.stream(url, false, quality, true).pipe(fileStream);

		let stream = module.exports.stream(url, false, quality);

		resolve({
			path: dir + filename,
			stream: stream
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
