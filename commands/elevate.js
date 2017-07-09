const Logger = require('../util/Logger.js')('CMD', 'elevate');
const GuildStore = require('../util/GuildStore.js');

const Kaomoji = require('../kaomoji.json');

exports.run = (Bot, msg, args) => {
	const Voice = GuildStore.get(msg.channel.guild.id, 'voice');

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
