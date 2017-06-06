const Logger = require('../util/Logger.js')('Voice');

const Config = require('../config.json');
const Discord = require('discord.js');

class VoiceUtil {

	constructor(Bot) {
		this.Bot = Bot;

		this.connection = null;
		this.dispatcher = null;
	}

	getVoiceChannel(member) {
		if (!member) throw 'Invalid member';

		return this.Bot.channels
				.filter(ch => ch instanceof Discord.VoiceChannel)
				.find(ch => !!ch.members.get(member.id));
	}

	connectVoiceChannel(channel) {
		if (!channel) return Promise.reject('Invalid channel');
		if (!channel.joinable) return Promise.reject('No permissions to join voice channel');

		Logger.log('Connecting to voice channel');

		this.connection = channel.join();

		this.connection.then(connection => {
			Logger.log('Successfully connected to voice channel');

			this.connection = connection;

		}).catch(console.error);

		return this.connection;
	}

	connectVoiceMember(member) {
		if (!member) return Promise.reject('Invalid member');

		let channel = this.getVoiceChannel(member);
		return this.connectVoiceChannel(channel);
	}

	disconnectVoice() {
		if (!this.connection) return;

		this.connection.channel.leave();
		this.connection = null;
	}

	playAudio(path) {
		if (!this.connection) return;

		if (this.playing) this.stopAudio();

		Logger.log('Playing audio track in voice channel');

		this.dispatcher = this.connection.playFile(path);
		this.dispatcher.setVolume(Config.voice.volume);

		this.dispatcher.on('end', () => {
			Logger.log('Audio track ended. Killing dispatcher');

			this.dispatcher = null;
		});

		return this.dispatcher;
	}

	stopAudio() {
		if (!this.playing) return;

		Logger.log('Stopping audio track');

		this.dispatcher.end();
		this.dispatcher = null;
	}

	pauseAudio() {
		if (!this.playing) return;

		Logger.log('Pausing audio track');

		this.dispatcher.pause();
	}

	resumeAudio() {
		if (!this.playing) return;

		Logger.log('Resuming audio track');

		this.dispatcher.resume();
	}

	setVolume(volume) {
		Config.voice.volume = volume;

		if (!this.playing) return;
		this.dispatcher.setVolume(volume);
	}

	get channel() {
		return this.connection ? this.connection.channel : null;
	}

	get playing() {
		return !!this.dispatcher;
	}

	get duration() {
		return this.playing ? this.dispatcher.time : -1;
	}
}

module.exports = VoiceUtil;
