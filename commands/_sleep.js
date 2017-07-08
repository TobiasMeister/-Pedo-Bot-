
let sleeped = [];

exports.run = {};

exports.run.sleep = (Bot, msg, args) => {
	sleeped = sleeped.concat(
			msg.mentions.users
				.filter(user => !sleeped.includes(user))
				.array());
};

exports.run.unsleep = (Bot, msg, args) => {
	sleeped = sleeped.filter(user => msg.mentions.users.has(user));
};

exports.run._sleep = (Bot, msg) => {
	if (sleeped.includes(msg.author)) {
		msg.channel.send(':sleeping: :sleeping:');
	}
};
