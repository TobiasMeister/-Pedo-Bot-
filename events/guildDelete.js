const Logger = require('../util/Logger.js')('EVNT', 'guildDelete');
const GuildStore = require('../util/GuildStore.js');

exports.run = (Bot, guild) => {
	Logger.log('Left guild')

	Logger.log('De-registering voice handler')
	GuildStore.set(guild.id, { voice: null });
};
