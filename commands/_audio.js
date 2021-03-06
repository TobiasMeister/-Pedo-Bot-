const Logger = require('../util/Logger.js')('CMD', '_audio');
const GuildStore = require('../util/GuildStore.js');

const Audio = require('../util/Audio.js');
const Media = require('../util/Media.js');
const YouTube = require('../util/YouTube.js');

const Kaomoji = require('../kaomoji.json');

const urlRegex = require('url-regex');
const youtubeRegex = require('youtube-regex');

const Tracks = require('../tracks.json');

function enqueue(audio, textChannel, voiceChannel, output = true) {
	const Conf = GuildStore.get(voiceChannel.guild.id, 'voice',
			'audio.queue', 'audio.computing', 'audio.stopped');
	const Voice = Conf.voice;

	Conf['audio.queue'].push(audio);

	if (Conf['audio.computing'] || Voice.playing || Conf['audio.stopped']) {
		if (output) {
			Logger.log('Adding audio track to queue');
			textChannel.send(`Adding \`${audio.title}\` to queue.`);
		}

	} else {
		playAudio(Conf['audio.queue'][0], textChannel, voiceChannel);
	}
}

function playAudio(audio, textChannel, voiceChannel) {
	const Conf = GuildStore.get(voiceChannel.guild.id, 'voice',
			'audio.queue', 'audio.computing', 'audio.stopped', 'audio.repeat');
	const Voice = Conf.voice;

	GuildStore.set(voiceChannel.guild.id, { 'audio.computing': true });

	Voice.connectVoiceChannel(voiceChannel).then(async (connection) => {
		if (!Conf['audio.repeat']) {
			textChannel.send(`Playing \`${audio.title}\``);
		}

		switch (audio.type) {
			case 'YTDL':
				if (audio.protocol === 'm3u8') {
					audio.stream = YouTube.stream(audio.url, true);
				} else {
					let source = await YouTube.streamAndDownload(audio.filename, audio.url, audio.forceDownload);
					audio.path = source.path;
					audio.stream = source.stream;
				}
				break;
			case 'MEDIA':
				audio.path = await Media.download(audio.filename, audio.url, audio.forceDownload);
				break;
			default:
				GuildStore.set(voiceChannel.guild.id, { 'audio.computing': false });
				return Logger.error('Invalid file path');
		}

		const Dispatcher = Voice.playAudio(audio.stream || audio.path);

		Dispatcher.on('end', () => {
			const Conf = GuildStore.get(voiceChannel.guild.id,
					'audio.queue', 'audio.computing', 'audio.stopped', 'audio.repeat', 'audio.autoplay');

			if (Conf['audio.stopped']) {
				Conf['audio.queue'].shift();

				if (Conf['audio.queue'].length === 0) {
					GuildStore.set(voiceChannel.guild.id, { 'audio.stopped': false });
				}

				return;
			}

			if (Conf['audio.repeat']) {
				return playAudio(Conf['audio.queue'][0], textChannel, voiceChannel);
			}

			Conf['audio.queue'].shift();

			if (Conf['audio.queue'].length > 0) {
				Logger.log('Playing next audio track in queue');

				return playAudio(Conf['audio.queue'][0], textChannel, voiceChannel);
			}

			if (Conf['audio.autoplay']) {
				Logger.log('Playing next audio track from autoplay');

				let Bot = GuildStore.get(null, 'bot');

				return module.exports.run.play(Bot, {
					channel: textChannel,
					author: Bot.user
				}, [ fetchRandomTrack().url ]);
			}
		});

		GuildStore.set(voiceChannel.guild.id, { 'audio.computing': false });

	}).catch(Logger.error);
}

exports.init = (Bot) => {
	const InitStates = new Map();

	function initState(guild) {
		if (InitStates.get(guild)) return;

		GuildStore.set(guild, {
			'audio.queue': [],
			'audio.computing': false,
			'audio.stopped': false,
			'audio.repeat': false,
			'audio.autoplay': false
		});

		InitStates.set(guild, true);
	}

	Bot.on('ready', () => {
		for (let [id, guild] of Bot.guilds) {
			initState(id);
		}
	});

	Bot.on('guildCreate', (guild) => {
		initState(guild.id);
	});

	Bot.on('guildDelete', (guild) => {
		GuildStore.delete(guild.id, 'audio.queue', 'audio.computing', 'audio.stopped', 'audio.repeat', 'audio.autoplay');
		InitStates.delete(guild.id);
	});
};

exports.destroy = (Bot) => {
	for (let [id, guild] of Bot.guilds) {
		const Voice = GuildStore.get(id, 'voice');
		Voice.disconnectVoice();
	}
};

exports.run = {};

exports.run.play = async (Bot, msg, args) => {
	const Voice = GuildStore.get(msg.channel.guild.id, 'voice');

	let textChannel = msg.channel;
	let voiceChannel = Voice.getVoiceChannel(msg.author);

	if (!voiceChannel) {
		return msg.channel.send(`No channel to play music in ... ${Kaomoji.hmm}`);
	}

	msg.channel.startTyping();

	if (msg.attachments && msg.attachments.size > 0) {
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

			if (audioInfo.playlist) {
				Logger.log(`Adding ${audioInfo.entries.length} audio tracks from \`${audioInfo.playlist}\` to queue`);
				textChannel.send(`Adding ${audioInfo.entries.length} audio tracks to queue.`);
			}

			audioInfo.entries.forEach(audio => {
				audio.type = 'YTDL';
				audio.forceDownload = forceDownload;

				enqueue(audio, textChannel, voiceChannel, !audioInfo.playlist);
			});

		} catch (err) {
			Logger.error(err);
		}

	} else {
		msg.channel.send('Need to specify a valid URL.');
	}

	msg.channel.stopTyping();
};

exports.run.stop = (Bot, msg, args) => {
	const Voice = GuildStore.get(msg.channel.guild.id, 'voice');

	GuildStore.set(msg.channel.guild.id, {
		'audio.stopped': true,
		'audio.repeat': false,
		'audio.autoplay': false
	});

	Voice.stopAudio();
};

exports.run.pause = (Bot, msg, args) => {
	const Voice = GuildStore.get(msg.channel.guild.id, 'voice');

	if (!Voice.playing) {
		return msg.channel.send('No audio track to pause.');
	}

	Voice.pauseAudio();
};

exports.run.resume = (Bot, msg, args) => {
	const Conf = GuildStore.get(msg.channel.guild.id, 'voice',
			'audio.queue', 'audio.stopped');
	const Voice = Conf.voice;

	if (Conf['audio.stopped']) {
		if (Conf['audio.queue'].length === 0) {
			return msg.channel.send('No audio track to resume.');
		}

		GuildStore.set(msg.channel.guild.id, { 'audio.stopped': false });
		return playAudio(Conf['audio.queue'][0], msg.channel, Voice.channel);
	}

	if (!Voice.playing) {
		return msg.channel.send('No audio track to resume.');
	}

	Voice.resumeAudio();
};

exports.run.volume = (Bot, msg, args) => {
	const Voice = GuildStore.get(msg.channel.guild.id, 'voice');

	if (!args[0] || !parseInt(args[0])) {
		return msg.channel.send('Need to specify a volume.');
	}

	Voice.setVolume(args[0]);
};

exports.run.queue = (Bot, msg, args) => {
	const Conf = GuildStore.get(msg.channel.guild.id, 'voice', 'audio.queue');
	const Voice = Conf.voice;

	if (Conf['audio.queue'].length > 0) {
		let queue = Conf['audio.queue'].slice(0, 9)
				.map(audio => (Conf['audio.queue'].indexOf(audio) + 1)
						+ '. ' + audio.title).join('\n');

		if (Conf['audio.queue'].length > 10) {
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
	const Conf = GuildStore.get(msg.channel.guild.id, 'voice',
			'audio.queue', 'audio.stopped');
	const Voice = Conf.voice;

	if (Voice.playing) {
		msg.channel.send('Skipping track.');

		GuildStore.set(msg.channel.guild.id, { 'audio.repeat': false });

		return Voice.stopAudio();
	}

	if (Conf['audio.queue'].length > 0) {
		msg.channel.send('Skipping track.');

		Conf['audio.queue'].shift();

		if (Conf['audio.stopped'] && Conf['audio.queue'].length === 0) {
			GuildStore.set(msg.channel.guild.id, { 'audio.stopped': false });
		}

		return;
	}

	msg.channel.send('Nothing to skip.');
};

exports.run.repeat = (Bot, msg, args) => {
	const Conf = GuildStore.get(msg.channel.guild.id, 'voice',
			'audio.queue', 'audio.repeat');
	const Voice = Conf.voice;

	if (!Voice.playing) {
		return msg.channel.send('Nothing to repeat.');
	}

	GuildStore.set(msg.channel.guild.id, { 'audio.repeat': !Conf['audio.repeat'] });

	if (!Conf['audio.repeat']) {
		msg.channel.send('Repeating `' + Conf['audio.queue'][0].title + '` indefinitely.');
	} else {
		msg.channel.send('Stopped repeating `' + Conf['audio.queue'][0].title + '`\n'
				+ 'Will play next song in queue when finished.');
	}
};

function fetchRandomTrack() {
	let randomIndex = Math.floor(Math.random() * (Object.keys(Tracks).length - 1) + 1);

	return Object.values(Tracks)[randomIndex];
}

exports.run.autoplay = (Bot, msg, args) => {
	let enable;
	let currentlyEnabled = GuildStore.get(msg.channel.guild.id, 'audio.autoplay');

	// Disgusting code, I know
	if (args.length === 1) {
		if (args[0] !== 'on' && args[0] !== 'off') return msg.channel.send('Lern to type, fgt ... :unamused:');

		enable = args[0] === 'on' || !(args[0] === 'off');
	} else {
		enable = !currentlyEnabled;
	}

	GuildStore.set(msg.channel.guild.id, { 'audio.autoplay': enable });

	if (enable && !currentlyEnabled) {
		let Conf = GuildStore.get(msg.channel.guild.id, 'audio.computing', 'audio.nowPlaying');

		if (!Conf.computing && !Conf.nowPlaying) {
			exports.run.play(Bot, msg, [ fetchRandomTrack().url ]);
		}
	}
};

exports.run.np = (Bot, msg, args) => {
	const Conf = GuildStore.get(msg.channel.guild.id, 'voice',
			'audio.queue', 'audio.stopped', 'audio.nowPlaying');
	const Voice = Conf.voice;

	if (Conf['audio.stopped'] || Conf['audio.queue'].length === 0) {
		return msg.channel.send('Nothing playing at the moment.');
	}

	let timePlaying = Audio.formatDuration(Voice.duration);

	if (Conf['audio.nowPlaying'] && Conf['audio.nowPlaying'].includes(Conf['audio.queue'][0].title)) {
		return msg.channel.send(Conf['audio.nowPlaying'].replace('{timePlaying}', timePlaying));
	}

	let nowPlaying = 'Currently playing `' + Conf['audio.queue'][0].title + '`';

	Audio.audioMeta(Conf['audio.queue'][0].path).then(meta => {
		let total = Audio.formatDuration(meta.format.duration, 'seconds');

		nowPlaying += ` [{timePlaying}/${total}]`;
		msg.channel.send(nowPlaying.replace('{timePlaying}', timePlaying));

		GuildStore.set(msg.channel.guild.id, { 'audio.nowPlaying': nowPlaying });

	}).catch(err => {
		Logger.error(err);
		msg.channel.send(nowPlaying);
	});
};

exports.run.cq = (Bot, msg, args) => {
	const Conf = GuildStore.get(msg.channel.guild.id, 'voice', 'audio.queue');
	const Voice = Conf.voice;

	msg.channel.send('Clearing audio queue.');

	let queue = Voice.playing ? [ Conf['audio.queue'][0] ] : [];
	GuildStore.set(msg.channel.guild.id, { 'audio.queue': queue });
};
