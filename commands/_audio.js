const Logger = require('../util/Logger.js')('CMD', '_audio');

const Audio = require('../util/Audio.js');
const Media = require('../util/Media.js');
const YouTube = require('../util/YouTube.js');

const Kaomoji = require('../kaomoji.json');

const urlRegex = require('url-regex');

let Voice;

exports.init = (conf) => {
	Voice = conf.voice;
};

let audioStatus = {
	playing: null,
	paused: null
};

let audioQueue = [];
let audioStopped = false;
let repeatAudio = false;

function playAudio(Bot, currentTrack, textChannel) {
	textChannel.send(`Playing \`${currentTrack.title}\``);

	audioStatus = {
		playing: `Music ▶️ | ${currentTrack.title}`,
		paused: `Music ⏸ | ${currentTrack.title}`
	};

	Bot.user.setGame(audioStatus.playing);

	const Dispatcher = Voice.playAudio(currentTrack.path);

	Dispatcher.on('end', () => {
		if (audioStopped) {
			return audioQueue.shift();
		}

		if (repeatAudio) {
			return playAudio(Bot, audioQueue[0], textChannel);
		}

		audioQueue.shift();

		if (audioQueue.length > 0) {
			Logger.log('Playing next audio track in queue');

			return playAudio(Bot, audioQueue[0], textChannel);
		}

		Bot.user.setGame();
	});
}

exports.run = {};

exports.run.play = (Bot, msg, args) => {
	function queueAndPlay(audio) {
		let channel = Voice.getVoiceChannel(msg.author);

		if (!channel) {
			return msg.channel.send(`No channel to play music in ... ${Kaomoji.hmm}`);
		}

		Voice.connectVoiceChannel(channel).then(connection => {
			msg.channel.stopTyping();

			audioQueue.push(audio);

			if (Voice.playing || audioStopped) {
				Logger.log('Adding audio track to queue');
				return msg.channel.send(`Adding \`${audio.title}\` to queue.`);
			}

			playAudio(Bot, audioQueue[0], msg.channel);

			Logger.log('Playing audio track');

		}).catch(Logger.error);
	}

	msg.channel.startTyping();

	if (msg.attachments.size > 0) {
		let forceDownload = !!args[0] && args[0].match(/\!{3,}/);

		msg.attachments.forEach((value, key, map) => {
			Media.download(value.url, value.filename, forceDownload).then(media => {
				queueAndPlay({
					id: null,
					title: media.filename.replace(/^(.+)\..+$/, '$1'),
					path: media.path,
					filename: media.filename
				});

			}).catch(Logger.error);
		});

	} else if (args.length > 0 && urlRegex().test(args[0])) {

		let forceDownload = !!args[1] && args[1].match(/\!{3,}/);

		YouTube.downloadAudio(args[0], forceDownload)
				.then(queueAndPlay)
				.catch(Logger.error);

	} else {
		msg.channel.send('Need to specify a valid URL.');
	}

	msg.channel.stopTyping();
};

exports.run.stop = (Bot, msg, args) => {
	audioStopped = true;
	repeatAudio = false;

	Voice.stopAudio();

	Bot.user.setGame('Music ⏹');
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
		return playAudio(Bot, audioQueue[0], msg.channel);
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
		let queue = audioQueue.map(audio => (audioQueue.indexOf(audio) + 1) + '. ' + audio.title)
				.join('\n');

		msg.channel.send('```Markdown\n' + queue + '\n```');

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

		return audioQueue.shift();
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

exports.run.cp = (Bot, msg, args) => {
	msg.channel.send('Clearing audio queue.');

	audioQueue = Voice.playing ? [ audioQueue[0] ] : [];
};
