const Logger = require('../util/Logger.js')('CMD', 'elevate');

const Kaomoji = require('../kaomoji.json');

let Voice;

exports.init = (Bot, conf) => {
	Voice = conf.voice;
};

exports.run = (Bot, msg, args) => {
	let channel = Voice.getVoiceChannel(msg.author);

	if (!channel) {
		return msg.channel.send(`No channel to elevate ... ${Kaomoji.hmm}`);
	}

	Voice.connectVoiceChannel(channel).then(connection => {
		msg.channel.send(Kaomoji.strut);
		Bot.user.setGame(`Elevator Music | ${Kaomoji.strut}`);

		const Dispatcher = Voice.playAudio('./media/elevator.mp3');

		Dispatcher.on('end', () => {
			Voice.disconnectVoice();

			Bot.user.setGame();
		});

	}).catch(Logger.error);
};
