const Logger = require('../util/Logger.js')('Voice');
const GuildConf = require('../util/GuildConf.js');

const Config = require('../config.json');
const Discord = require('discord.js');

const isStream = require('is-stream');

class VoiceUtil {

	constructor(Bot, guild) {
		this.Bot = Bot;
		this.guild = guild;

		this.connection = null;
		this.dispatcher = null;
	}

	getVoiceChannel(member) {
		if (!member) throw Logger.format('Invalid member');

		return this.Bot.channels
				.filter(ch => ch instanceof Discord.VoiceChannel)
				.find(ch => !!ch.members.get(member.id));
	}

	connectVoiceChannel(channel) {
		if (!channel) return Promise.reject(Logger.format('Invalid channel'));
		if (!channel.joinable) return Promise.reject(Logger.format('No permissions to join voice channel'));

		Logger.log('Connecting to voice channel');

		this.connection = channel.join();

		this.connection.then(connection => {
			Logger.log('Successfully connected to voice channel');

			this.connection = connection;

		}).catch(Logger.error);

		return this.connection;
	}

	connectVoiceMember(member) {
		if (!member) return Promise.reject(Logger.format('Invalid member'));

		let channel = this.getVoiceChannel(member);
		return this.connectVoiceChannel(channel);
	}

	disconnectVoice() {
		this.stopAudio();

		if (!this.connection) return;

		this.connection.channel.leave();
		this.connection = null;
	}

	playAudio(source) {
		if (!this.connection) return;

		if (this.playing) this.stopAudio();

		Logger.log('Playing audio track in voice channel');

		if (isStream(source)) {
			this.dispatcher = this.connection.playStream(source);
		} else {
			this.dispatcher = this.connection.playFile(source);
		}

		this.dispatcher.setVolume(Config.voice.volume / 10);
		GuildConf.get('voice', this.guild, 'volume').then(volume => {
			if (volume || volume === 0) this.dispatcher.setVolume(volume / 10);
		});

		this.dispatcher.on('end', () => {
			Logger.log('Audio track ended. Killing dispatcher');

			if (isStream(source) && source.stop) {
				source.stop();
			}

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
		GuildConf.set('voice', this.guild, { volume: volume });

		if (this.playing) {
			this.dispatcher.setVolume(volume / 10);
		}
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
