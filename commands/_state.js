const Logger = require('../util/Logger.js')('CMD', '_state');
const Config = require('../config.json');

let Voice;

exports.init = (Bot, conf) => {
	Voice = conf.voice;
};

exports.run = {};

exports.run.restart = (Bot, msg, args) => {
	Logger.log('Restarting bot ...');
	msg.channel.send('brb guys :ok_hand:');

	Voice.disconnectVoice();

	Bot.destroy()
			.then(auth => Bot.login(Config.token))
			.catch(Logger.error);
};

exports.run.shutdown = (Bot, msg, args) => {
	Logger.log('Stopping bot ...');
	msg.channel.send(':wave:');

	Voice.disconnectVoice();

	Bot.destroy()
			.then(obj => {
				setTimeout(() => process.exit(), 1000);
			})
			.catch(Logger.error);
};
