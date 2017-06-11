const Config = require('../config.json');

class Commands {

	constructor (Bot) {
		this.Bot = Bot;

		this.commands = new Map();
		this.nonCommands = new Map();

		Bot.on('message', msg => {
			if (msg.author.bot) return;

			let parts = msg.content.split(' '),
				cmd, args;

			if (msg.content.startsWith(Config.prefix)) {
				cmd = parts[0].substr(Config.prefix.length);
				args = parts.slice(1);

			} else if (msg.isMentioned(this.Bot.user)
					&& msg.content.startsWith(`<@${this.Bot.user.id}>`)) {

				cmd = parts[1];
				args = parts.slice(2);

			} else {
				return this.nonCommands.forEach(e => e(msg));
			}

			if (this.commands.has(cmd)) {
				this.commands.get(cmd)(msg, args);
			}
		});
	}

	createCmd(cmd, e) {
		this.commands.set(cmd, e);
	}

	createNonCmd(name, e) {
		this.nonCommands.set(name, e);
	}

	get cmds() {
		return Array.from(this.commands.keys());
	}
}

module.exports = Commands;
