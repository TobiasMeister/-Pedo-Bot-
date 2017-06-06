const Kaomoji = require('../kaomoji.json');

exports.run = {};

exports.run.kaomoji = (Bot, msg, args) => {
	let str = JSON.stringify(Kaomoji)
			.replace(/","/g, '\n')
			.replace(/":"/g, ' :    ')
			.replace(/\\\\/g, '\\');
	str = str.substring(2, str.length - 2);

	let info = 'Usage: <kaomoji>\n\n';

	msg.channel.send('```\n' + info + str + '\n```');
};

exports.run._kaomoji = (Bot, msg) => {
	if (!msg.content.match(/<.+>/g)) return;

	let content = msg.content;
	let hasKaomoji = false;

	for (let kao in Kaomoji) {
		let search = new RegExp(`<${kao}>`, 'g');

		if (content.match(search)) {
			content = content.replace(search, Kaomoji[kao]);
			hasKaomoji = true;
		}
	}

	if (hasKaomoji) {
		// Discord doesn't allow editing messages from other users...
		//msg.edit(content).catch(console.error);

		msg.delete();
		msg.channel.send(`__**${msg.author.username}**__: ${content}`);
	}
};
