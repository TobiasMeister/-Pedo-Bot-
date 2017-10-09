![version](https://img.shields.io/badge/version-1.0.0-lightgray.svg?style=flat-square)
![release-type](https://img.shields.io/badge/release-alpha-orange.svg?style=flat-square)
![development-status](https://img.shields.io/badge/development-slowly--ongoing-yellow.svg?style=flat-square)


° Pedo~Bot °
===========

This bot is being created as a hobby of mine and will always be updated with the most recent changes. I am NOT writing any tests to catch edge cases, but am trying my best to keep it working as best as possible. As a consequence this bot may or may not work properly. *You've been warned.*

> ( Also you might encounter some _very_ ugly code, if you're not only interested in deploying a - well, mostly music - bot, but actually want to be useful and do something about this disaster I've put together here )

If you have any ideas on how to extend this bots functionality ***in a productive way*** (no bullshittery allowed!), feel free to open a new issue or PR and I'll see what I can do.

### Things that **DO** work currently

- [x] Annoying people by constantly replying with sleeping emojis
- [x] Banning certain words from being used by non-entitled people
- [x] Streaming music (sometimes) works

### Things that **DON'T** work currently

- [ ] Permission system (not even implemented...)
- [ ] Streaming music streams from streamy stream sources
- [ ] Everything else

----------------------------------------

#### Cloning this repository
This bot is only available self-hosted. First you need to clone this repository to your local filesystem or the server you want to run this bot on. It is recommended that you create the root folder for this bot manually, since some filesystems do not run well with the special characters used in the name of this bot.

The first step is to create a folder to house your new bot; you can name this directory however you like, but make sure to not use special characters:

	md PedoBot

Next you can clone this repository into the created directory:

	git clone https://github.com/TobiasMeister/-Pedo-Bot-.git PedoBot

#### HOLD ON!
Before running the bot, you have to sort out some prerequisites. Some things you need to have installed on your system are `Node.JS`, `FFmpeg`, `Lame`, and probably more that I forgot to mention here...

[![Node.JS version](https://img.shields.io/badge/Node.JS--version-8.4.0-green.svg?style=flat-square)](https://nodejs.org)
[![FFmpeg version](https://img.shields.io/badge/FFmpeg--version-3.3.3-green.svg?style=flat-square)](https://www.ffmpeg.org)
[![LAME version](https://img.shields.io/badge/LAME--version-3.99.5-green.svg?style=flat-square)](http://lame.sourceforge.net)

After you've done that, you need to install the missing dependencies via `npm install`, run from within the project directory. If you are running a Windows machine, you may need to install the global dependency for [windows-build-tools](https://www.npmjs.com/package/windows-build-tools) first to compile any required source files. To achieve this run `npm install -g windows-build-tools` from anywhere on the command line.

#### Hosting
To actually run this bot, you can just start the node app from within the created directory:

	node .

Wait for the bot to finish downloading the most recent version of [youtube-dl](https://rg3.github.io/youtube-dl/) before accessing any audio related features. (*I know this should be done better...*) The bot will let you know when it's done.

---

<sub>\#Memed</sub>
