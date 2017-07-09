const Logger = require('../util/Logger.js')('CMD', '_blacklist');
const GuildConf = require('../util/GuildConf.js');

const TempMsg = require('../util/TempMsg.js');

exports.init = (Bot, conf) => {
	Bot.on('messageUpdate', (oldMsg, newMsg) => {
		exports.run._block(Bot, newMsg);
	});
};

exports.run = {};

exports.run.blacklist = (Bot, msg, args) => {
	if (args.length === 0) {
		return msg.channel.send('Need to specify a phrase to blacklist.');
	}

	let block = args.join(' ');

	let param = {};
	param[block] = null;
	GuildConf.set('blacklist', msg.channel.guild.id, param);
};

exports.run.allow = (Bot, msg, args) => {
	if (args.length === 0) {
		return msg.channel.send('Need to specify a phrase to remove from blacklist.');
	}

	let block = args.join(' ');

	GuildConf.delete('blacklist', msg.channel.guild.id, [ block ]);
};

exports.run.blacklisted = async (Bot, msg, args) => {
	let blacklist = await GuildConf.get('blacklist', msg.channel.guild.id);

	if (Object.keys(blacklist).length === 0) {
		return msg.channel.send('No blacklisted words.');
	}

	let arr = Object.keys(blacklist);
	let str = arr.map(msg => (arr.indexOf(msg) + 1) + '. ' + msg).join('\n');

	msg.channel.send('```Markdown\n'
			+ 'Blacklisted words:\n'
			+ '==================\n\n'
			+ str + '\n```');
};

exports.run._block = async (Bot, msg) => {
	let blacklist = await GuildConf.get('blacklist', msg.channel.guild.id);

	for (let block in blacklist) {
		let regex = new RegExp(`(?:^|[^\\w])(${block})(?:[^\\w]|$)`, 'i');

		if (msg.content.match(regex)) {
			msg.delete();
			TempMsg.reply(msg, '*<message deleted>*');
			break;
		}
	}
};
