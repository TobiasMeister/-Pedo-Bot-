const Logger = require('../util/Logger.js')('EVNT', 'guildCreate');
const GuildStore = require('../util/GuildStore.js');

const Voice = require('../handler/Voice.js');

exports.run = (Bot, guild) => {
	Logger.log('Joined new guild')

	Logger.log('Registering new voice handler')
	GuildStore.set(guild.id, { voice: new Voice(Bot) });
};
