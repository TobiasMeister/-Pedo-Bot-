
let blockedMessages = new Set();

exports.run = {};

exports.run.block = (Bot, msg, args) => {
	let block = args.join(' ');

	if (!blockedMessages.has(block)) {
		blockedMessages.add(block);
	}
};

exports.run.unblock = (Bot, msg, args) => {
	let block = args.join(' ');

	if (blockedMessages.has(block)) {
		blockedMessages.delete(block);
	}
};

exports.run.blocked = (Bot, msg, args) => {
	if (blockedMessages.size === 0) {
		return msg.channel.send('No blocked messages.');
	}

	let arr = Array.from(blockedMessages);

	let str = arr.map(msg => (arr.indexOf(msg) + 1) + '. ' + msg).join('\n');

	msg.channel.send('```Markdown\n' + str + '\n```');
};

exports.run._block = (Bot, msg) => {
	let content = msg.content;

	if (blockedMessages.has(content)) {
		msg.delete();
	}
};
