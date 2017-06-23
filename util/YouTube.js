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

module.exports.downloadAudio = (url, forceDownload = true, format = 'mp3', dir = 'media/youtube/') => {
	if (!FS.existsSync(dir)) {
		FS.mkdirSync(dir);
	}

	let audioFile;

	new Promise((resolve, reject) => {
		Logger.log('Fetching track information');

		YTDL.getInfo(url, ['-o', '/%(title)s - %(id)s.%(ext)s'],
				{ maxBuffer: 1000 * 1024 }, (err, info) => {

			if (err) return Logger.error(err);

			if (Array.isArray(info)) {
				reject('[YouTube] Playlist not supported');

			} else {
				let filename = info._filename
						.replace(/^(.+\.).+$/, `$1${format}`);

				let filenameFormat = `^(.+) - (.+)(\\.${format})$`;

				resolve({
					id: filename.match(filenameFormat)[2],
					title: filename.match(filenameFormat)[1],
					path: dir + filename,
					filename: filename
				});
			}
		});

	}).then(audio => {
		if (forceDownload) {
			reject('[YouTube] Audio cache disabled manually. Forcing (re)download');

		} else {
			Logger.log('Searching for cached version of audio track');

			let files = FS.readdirSync(dir);

			if (files.includes(audio.filename)) {
				Logger.log('Cached audio track found. Skipping download');

				return audioFile = audio;
			}

			Logger.log('Audio file not found in cache');
		}

		Logger.log('Starting download of audio file');

		YTDL.exec(url, ['-x',
				'--audio-format', format,
				'-o', dir + '%(title)s - %(id)s.%(ext)s'],
				{}, (err, output) => {

			if (err) return Logger.error(err);

			Logger.log(output.join('\n'));
			Logger.log('Audio track downloaded');

			audioFile = audio;
		});

	}).catch(error => {
		audioFile = null;
		Logger.error(error);
	});

	return new Promise((resolve, reject) => {
		function waitForAudio() {
			if (typeof audioFile === 'undefined') {
				setTimeout(waitForAudio, 1000);
			} else if (audioFile === null) {
				reject('[YouTube] Error while fetching audio track');
			} else {
				resolve(audioFile);
			}
		}

		waitForAudio();
	});
};
