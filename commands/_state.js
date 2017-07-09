const Logger = require('../util/Logger.js')('CMD', '_state');
const Config = require('../config.json');
const GuildStore = require('../util/GuildStore.js');

exports.run = {};

exports.run.restart = (Bot, msg, args) => {
	Logger.log('Restarting bot ...');
	msg.channel.send('brb guys :ok_hand:');

	for (let [id, guild] of Bot.guilds) {
		const Voice = GuildStore.get(id, 'voice');
		Voice.disconnectVoice();
	}

	Bot.destroy()
			.then(auth => Bot.login(Config.token))
			.catch(Logger.error);
};

exports.run.shutdown = (Bot, msg, args) => {
	Logger.log('Stopping bot ...');
	msg.channel.send(':wave:');

	for (let [id, guild] of Bot.guilds) {
		const Voice = GuildStore.get(id, 'voice');
		Voice.disconnectVoice();
	}

	Bot.destroy()
			.then(obj => setTimeout(() => process.exit(), 5000))
			.catch(Logger.error);
};
