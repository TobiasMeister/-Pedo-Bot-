
let Cmd;

exports.init = (conf) => {
	Cmd = conf.cmd;
};

exports.run = (Bot, msg, args) => {
	let str = Cmd.cmds.sort().join(', ');

	let info = 'Available commands:\n'
			+ '-------------------\n\n';

	msg.channel.send('```Markdown\n' + info + str + '\n```');
};
