const Logger = require('../util/Logger.js')('EVNT', 'ready');

const Kaomoji = require('../kaomoji.json');

exports.run = (Bot) => {
	Logger.log('Client ready.');

	let status = `Now ready! ${Kaomoji.smirk}`;
	Bot.user.setGame(status).then(() => {
		setTimeout(() => {
			if (Bot.user.presence.game.name === status) {
				Bot.user.setGame();
			}
		}, 5000);

	}).catch(Logger.error);
};
