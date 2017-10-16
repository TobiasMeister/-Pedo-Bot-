const Logger = require('../util/Logger.js')('CMD', '_state');
const Config = require('../config.json');
const GuildStore = require('../util/GuildStore.js');

const Dynamic = require('../util/Dynamic.js');

exports.run = {};

function disconnect(Bot) {
	Dynamic.destroy(Bot);

	return Bot.destroy();
}

exports.run.restart = (Bot, msg, args) => {
	Logger.log('Restarting bot ...');
	msg.channel.send('brb guys :ok_hand:');

	disconnect(Bot)
			.then(auth => Bot.login(Config.token))
			.catch(Logger.error);
};

exports.run.shutdown = (Bot, msg, args) => {
	Logger.log('Stopping bot ...');
	msg.channel.send(':wave:');

	disconnect(Bot)
			.then(obj => setTimeout(() => process.exit(), 5000))
			.catch(Logger.error);
};
