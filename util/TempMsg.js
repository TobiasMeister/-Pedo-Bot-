
module.exports = {};

function deleteAfterTimeout(msg, timeout) {
	setTimeout(() => {
		msg.delete();
	}, timeout);
}

module.exports.send = async (channel, msg, timeout = 5000) => {
	let message = await channel.send(msg);
	deleteAfterTimeout(message, timeout);
};

module.exports.reply = async (original, msg, timeout = 5000) => {
	let message = await original.reply(msg);
	deleteAfterTimeout(message, timeout);
};
