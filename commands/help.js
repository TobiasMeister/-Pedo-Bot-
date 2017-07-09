const GuildConf = require('../util/GuildConf.js');

exports.run = (Bot, msg, args) => {
	const Cmd = GuildConf.get(null, 'cmd');

	let commands = Cmd.cmds.sort().join(', ');

	msg.channel.send('```Markdown\n'
			+ 'Available commands:\n'
			+ '===================\n\n'
			+ commands + '\n```');
};
