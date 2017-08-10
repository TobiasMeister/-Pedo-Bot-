const GuildStore = require('../util/GuildStore.js');

exports.run = (Bot, msg, args) => {
	const Cmd = GuildStore.get(null, 'cmd');

	let commands = Cmd.cmds.sort().join(', ');

	msg.channel.send('```Markdown\n'
			+ 'Available commands:\n'
			+ '===================\n\n'
			+ commands + '\n```');
};
