const Logger = require('../util/Logger.js')('CMD', '_audio');

const Audio = require('../util/Audio.js');
const Media = require('../util/Media.js');
const YouTube = require('../util/YouTube.js');

const Kaomoji = require('../kaomoji.json');

const urlRegex = require('url-regex');

let Client, Voice;

exports.init = (Bot, conf) => {
	Client = Bot;
	Voice = conf.voice;
};

let audioStatus = {
	playing: null,
	paused: null
};

let audioQueue = [];
let computing = false;
let audioStopped = false;
let repeatAudio = false;

function enqueue(audio, textChannel, voiceChannel, output = true) {
	audioQueue.push(audio);

	if (computing || Voice.playing || audioStopped) {
		if (output) {
			Logger.log('Adding audio track to queue');
			textChannel.send(`Adding \`${audio.title}\` to queue.`);
		}

	} else {
		playAudio(audioQueue[0], textChannel, voiceChannel);
	}
}

function playAudio(audio, textChannel, voiceChannel) {
	computing = true;

	Voice.connectVoiceChannel(voiceChannel).then(async (connection) => {
		textChannel.send(`Playing \`${audio.title}\``);

		audioStatus = {
			playing: `Music ▶️ | ${audio.title}`,
			paused: `Music ⏸ | ${audio.title}`
		};

		Client.user.setGame(audioStatus.playing);

		switch (audio.type) {
			case 'YTDL':
				audio.path = await YouTube.downloadAudio(audio.filename, audio.url, audio.forceDownload);
				break;
			case 'MEDIA':
				audio.path = await Media.download(audio.filename, audio.url, audio.forceDownload);
				break;
			default:
				computing = false;
				return Logger.error('Invalid file path');
		}

		const Dispatcher = Voice.playAudio(audio.path);

		Dispatcher.on('end', () => {
			if (audioStopped) {
				audioQueue.shift();

				if (audioQueue.length === 0) {
					audioStopped = false;
				}

				return;
			}

			if (repeatAudio) {
				return playAudio(audioQueue[0], textChannel, voiceChannel);
			}

			audioQueue.shift();

			if (audioQueue.length > 0) {
				Logger.log('Playing next audio track in queue');

				return playAudio(audioQueue[0], textChannel, voiceChannel);
			}

			Client.user.setGame();
		});

		computing = false;

	}).catch(Logger.error);
}

exports.run = {};

exports.run.play = async (Bot, msg, args) => {

	let textChannel = msg.channel;
	let voiceChannel = Voice.getVoiceChannel(msg.author);

	if (!voiceChannel) {
		return msg.channel.send(`No channel to play music in ... ${Kaomoji.hmm}`);
	}

	msg.channel.startTyping();

	if (msg.attachments.size > 0) {
		let forceDownload = !!args[0] && args[0].match(/\!{3,}/);

		msg.attachments.forEach(async (value, key, map) => {
			let audioInfo = await Media.fetchHeaders(value.url);

			if (!audioInfo.mimeType.match(/^audio\/.+$/)) {
				msg.channel.sendMessage();
				return Logger.error('Not a valid file format');
			}

			enqueue({
				id: null,
				title: audioInfo.filename.replace(/^(.+)\..+$/, '$1'),
				filename: audioInfo.filename,
				url: audioInfo.url,
				type: 'MEDIA',
				forceDownload: forceDownload

			}, textChannel, voiceChannel);
		});

	} else if (args.length > 0 && urlRegex().test(args[0])) {

		let forceDownload = !!args[1] && args[1].match(/\!{3,}/);

		try {
			let audioInfo = await YouTube.fetchInfo(args[0]);

			audioInfo.entries.forEach(audio => {
				audio.type = 'YTDL';
				audio.forceDownload = forceDownload;

				enqueue(audio, textChannel, voiceChannel, !audioInfo.playlist);
			});

			if (audioInfo.playlist) {
				Logger.log(`Adding ${audioInfo.entries.length} audio tracks to queue`);
				textChannel.send(`Adding ${audioInfo.entries.length} audio tracks to queue.`);
			}

		} catch (err) {
			Logger.error(err);
		}

	} else {
		msg.channel.send('Need to specify a valid URL.');
	}

	msg.channel.stopTyping();
};

exports.run.stop = (Bot, msg, args) => {
	audioStopped = true;
	repeatAudio = false;

	if (audioQueue.length > 1) {
		Bot.user.setGame('Music ⏹');
	} else {
		Bot.user.setGame();
	}

	Voice.stopAudio();
};

exports.run.pause = (Bot, msg, args) => {
	if (!Voice.playing) {
		return msg.channel.send('No audio track to pause.');
	}

	Voice.pauseAudio();

	Bot.user.setGame(audioStatus.paused);
};

exports.run.resume = (Bot, msg, args) => {
	if (audioStopped) {
		if (audioQueue.length === 0) {
			return msg.channel.send('No audio track to resume.');
		}

		audioStopped = false;
		return playAudio(audioQueue[0], msg.channel, Voice.channel);
	}

	if (!Voice.playing) {
		return msg.channel.send('No audio track to resume.');
	}

	Voice.resumeAudio();

	Bot.user.setGame(audioStatus.playing);
};

exports.run.volume = (Bot, msg, args) => {
	if (!args[0]) {
		return msg.channel.send('Need to specify a volume.');
	}

	Voice.setVolume(args[0]);
};

exports.run.queue = (Bot, msg, args) => {
	if (audioQueue.length > 0) {
		let queue = audioQueue.slice(0, 9)
				.map(audio => (audioQueue.indexOf(audio) + 1)
						+ '. ' + audio.title).join('\n');

		if (audioQueue.length > 10) {
			queue += '\n10. [...]';
		}

		msg.channel.send('```Markdown\n'
				+ 'Audio queue:\n'
				+ '============\n\n'
				+ queue + '\n```');

	} else {
		msg.channel.send('No audio tracks in queue.');
	}
};

exports.run.skip = (Bot, msg, args) => {
	if (Voice.playing) {
		msg.channel.send('Skipping track.');

		repeatAudio = false;

		return Voice.stopAudio();
	}

	if (audioQueue.length > 0) {
		msg.channel.send('Skipping track.');

		audioQueue.shift();

		if (audioStopped && audioQueue.length === 0) {
			audioStopped = false;
			Bot.user.setGame();
		}

		return;
	}

	msg.channel.send('Nothing to skip.');
};

exports.run.repeat = (Bot, msg, args) => {
	if (!Voice.playing) {
		return msg.channel.send('Nothing to repeat.');
	}

	repeatAudio = !repeatAudio;

	if (repeatAudio) {
		msg.channel.send(`Repeating \`${audioQueue[0].title}\` indefinitely.`);
	} else {
		msg.channel.send(`Stopped repeating \`${audioQueue[0].title}\`\n`
				+ 'Will play next song in queue when finished.');
	}
};

exports.run.np = (Bot, msg, args) => {
	if (audioStopped || audioQueue.length === 0) {
		return msg.channel.send('Nothing playing at the moment.');
	}

	Audio.audioMeta(audioQueue[0].path).then(meta => {
		let playing = Audio.formatDuration(Voice.duration);
		let total = Audio.formatDuration(meta.format.duration, 'seconds');

		msg.channel.send('Currently playing `' + audioQueue[0].title + '` '
				+ `[${playing}/${total}]`);

	}).catch(Logger.error);
};

exports.run.cq = (Bot, msg, args) => {
	msg.channel.send('Clearing audio queue.');

	audioQueue = Voice.playing ? [ audioQueue[0] ] : [];
};
