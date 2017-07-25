const GuildStore = require('../util/GuildStore.js');

exports.run = {};

exports.run.sleep = (Bot, msg, args) => {
	let sleeped = GuildStore.get(msg.channel.guild.id, 'sleeped') || [];

	sleeped = sleeped.concat(
			Array.from(msg.mentions.users.keys())
				.filter(id => !sleeped.includes(id)));

	GuildStore.set(msg.channel.guild.id, { sleeped: sleeped });
};

exports.run.unsleep = (Bot, msg, args) => {
	let sleeped = GuildStore.get(msg.channel.guild.id, 'sleeped') || [];

	if (sleeped.length > 0) {
		sleeped = sleeped.filter(id => !msg.mentions.users.has(id));

		GuildStore.set(msg.channel.guild.id, { sleeped: sleeped });
	}
};

exports.run._sleep = (Bot, msg) => {
	let sleeped = GuildStore.get(msg.channel.guild.id, 'sleeped') || [];

	if (sleeped.includes(msg.author.id)) {
		msg.channel.send(':sleeping: :sleeping:');
	}
};
