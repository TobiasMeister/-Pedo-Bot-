const GuildStore = require('../util/GuildStore.js');

exports.run = {};

exports.run.sleep = (Bot, msg, args) => {
	let sleeped = GuildStore.get(msg.channel.guild.id, 'sleeped') || [];

	sleeped = sleeped.concat(
			msg.mentions.users
				.filter(user => !sleeped.includes(user))
				.array());

	GuildStore.set(msg.channel.guild.id, { sleeped: sleeped });
};

exports.run.unsleep = (Bot, msg, args) => {
	let sleeped = GuildStore.get(msg.channel.guild.id, 'sleeped') || [];

	if (sleeped.length > 0) {
		sleeped = sleeped.filter(user => msg.mentions.users.has(user));

		GuildStore.set(msg.channel.guild.id, { sleeped: sleeped });
	}
};

exports.run._sleep = (Bot, msg) => {
	let sleeped = GuildStore.get(msg.channel.guild.id, 'sleeped') || [];

	if (sleeped.includes(msg.author)) {
		msg.channel.send(':sleeping: :sleeping:');
	}
};
