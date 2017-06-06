const Logger = require('./util/Logger.js')('MAIN');
const Config = require('./config.json');

const YouTube = require('./util/YouTube.js');

const Discord = require('discord.js');
const Bot = new Discord.Client();

const Cmd = new (require('./handler/Command.js'))(Bot);
const Voice = new (require('./handler/Voice.js'))(Bot);

const Dynamic = require('./util/Dynamic.js');

/* ****************** */
/* Bot initialization */
/* ****************** */

Logger.log('Starting bot ...');

// Update youtube-dl binaries
YouTube.update();

Logger.log('Registering events ...');

Dynamic.load('events', (fn, name) => {
	Bot.on(name, (...args) => fn(Bot, ...args));
});

Logger.log('Registering commands ...');

const CmdConf = {
	cmd: Cmd,
	voice: Voice
};

Dynamic.load('commands', (fn, name) => {
	if (name.startsWith('_')) {
		Cmd.createNonCmd(name.substr(1), (...args) => fn(Bot, ...args));
	} else {
		Cmd.createCmd(name, (...args) => fn(Bot, ...args));
	}
}, CmdConf);

Logger.log('Registering actions ...')

Dynamic.load('actions', (fn, name) => {
	Cmd.createNonCmd(name, msg => fn(Bot, msg));
});

// Login into Discord
Bot.login(Config.token);
