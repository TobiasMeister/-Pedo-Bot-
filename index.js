const Logger = require('./util/Logger.js')('MAIN');
const Config = require('./config.json');
const Dynamic = require('./util/Dynamic.js');
const GuildStore = require('./util/GuildStore.js');

const Discord = require('discord.js');
const Bot = new Discord.Client();

const Cmd = new (require('./handler/Command.js'))(Bot);

const YouTube = require('./util/YouTube.js');

/* ****************** */
/* Bot initialization */
/* ****************** */

Logger.log('Starting bot ...');

// Set global variables
GuildStore.set(null, {
	bot: Bot,
	cmd: Cmd
});

Logger.log('Registering events ...');

Dynamic.load(Bot, 'events', (fn, name) => {
	Bot.on(name, (...args) => fn(Bot, ...args));
});

Logger.log('Registering commands ...');

Dynamic.load(Bot, 'commands', (fn, name) => {
	if (name.startsWith('_')) {
		Cmd.createNonCmd(name.substr(1), (...args) => fn(Bot, ...args));
	} else {
		Cmd.createCmd(name, (...args) => fn(Bot, ...args));
	}
});

Logger.log('Registering actions ...')

Dynamic.load(Bot, 'actions', (fn, name) => {
	Cmd.createNonCmd(name, msg => fn(Bot, msg));
});

// Update youtube-dl binaries
YouTube.update();

// Login into Discord
Bot.login(Config.token);
