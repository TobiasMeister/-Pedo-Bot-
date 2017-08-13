const Logger = require('../util/Logger.js')('EVNT', 'ready');
const GuildStore = require('../util/GuildStore.js');

const Voice = require('../handler/Voice.js');

const Kaomoji = require('../kaomoji.json');

exports.run = (Bot) => {
	Logger.log('Registering voice handlers ...');

	for (let [id, guild] of Bot.guilds) {
		GuildStore.set(id, { voice: new Voice(Bot, id) });
	}

	Logger.log(`Registered ${Bot.guilds.size} voice handlers`);

	/* **************************************** */

	Logger.log('Client ready');

	let status = `Now ready! ${Kaomoji.smirk}`;
	Bot.user.setGame(status).then(() => {
		setTimeout(() => {
			if (Bot.user.presence.game.name === status) {
				Bot.user.setGame();
			}
		}, 5000);

	}).catch(Logger.error);
};
