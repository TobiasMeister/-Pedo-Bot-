const Logger = require('../util/Logger.js')('CMD', 'clear');

exports.run = (Bot, msg, args) => {
	if (!args[0]) return;
	if (msg.channel.messages.size < 1) return;

	msg.channel.bulkDelete(parseInt(args[0]) + 1)
			.catch(Logger.error);
};
