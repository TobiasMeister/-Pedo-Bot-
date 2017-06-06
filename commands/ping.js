
exports.run = (Bot, msg, args) => {
	msg.channel.send('pong ' + args.join(' '));
};
