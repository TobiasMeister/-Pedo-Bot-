
let Cmd;

exports.init = (conf) => {
	Cmd = conf.cmd;
};

exports.run = (Bot, msg, args) => {
	let commands = Cmd.cmds.sort().join(', ');

	msg.channel.send('```Markdown\n'
			+ 'Available commands:\n'
			+ '===================\n\n'
			+ commands + '\n```');
};
