const Logger = require('../util/Logger.js')('CMD', '_blacklist');
const GuildConf = require('../util/GuildConf.js');

const TempMsg = require('../util/TempMsg.js');

let blacklist;
let markedDirty = true;

exports.run = {};

exports.run.blacklist = (Bot, msg, args) => {
	if (args.length === 0) {
		return msg.channel.send('Need to specify a phrase to blacklist.');
	}

	let block = args.join(' ');

	let param = {};
	param[block] = null;
	GuildConf.set('blacklist', msg.channel.guild.id, param);
	markedDirty = true;
};

exports.run.allow = (Bot, msg, args) => {
	if (args.length === 0) {
		return msg.channel.send('Need to specify a phrase to remove from blacklist.');
	}

	let block = args.join(' ');

	GuildConf.delete('blacklist', msg.channel.guild.id, [ block ]);
	markedDirty = true;
};

exports.run.blacklisted = async (Bot, msg, args) => {
	if (markedDirty) {
		blacklist = await GuildConf.get('blacklist', msg.channel.guild.id);
		markedDirty = false;
	}

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
	if (markedDirty) {
		blacklist = await GuildConf.get('blacklist', msg.channel.guild.id);
		markedDirty = false;
	}

	for (let block in blacklist) {
		let regex = `(?:^|[^\\w])(${block})(?:[^\\w]|$)`;

		if (msg.content.match(regex)) {
			msg.delete();
			TempMsg.reply(msg, '*<message deleted>*');
			break;
		}
	}
};
