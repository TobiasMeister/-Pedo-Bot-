
let Voice;

exports.init = (conf) => {
	Voice = conf.voice;
};

exports.run = {};

exports.run.join = (Bot, msg, args) => {
	Voice.connectVoiceMember(msg.author);
};

exports.run.leave = (Bot, msg, args) => {
	Voice.disconnectVoice();
};
