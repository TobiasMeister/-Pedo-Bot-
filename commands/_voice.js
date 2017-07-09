const GuildStore = require('../util/GuildStore.js');

exports.run = {};

exports.run.join = (Bot, msg, args) => {
	const Voice = GuildStore.get(msg.channel.guild.id, 'voice');

	if (msg.channel.guild !== Voice.getVoiceChannel(msg.author).guild) {
		return msg.channel.send('Not on the same server.');
	}

	Voice.connectVoiceMember(msg.author);
};

exports.run.leave = (Bot, msg, args) => {
	const Voice = GuildStore.get(msg.channel.guild.id, 'voice');

	Voice.disconnectVoice();
};
