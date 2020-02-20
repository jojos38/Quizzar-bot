
// -------------------- SOME VARIABLES -------------------- //
const { prefix, token, topggtoken } = require('./config.json');
const Discord = require('discord.js');
const client = new Discord.Client();
const DBL = require("dblapi.js");
const dbl = new DBL(topggtoken, client);
const game = require('./game.js');
const tools = require('./tools.js');
const db = require('./database.js');
const logger = require('./logger.js');
const eb = {"en": require('./locales/embeds/en.js'), "fr": require('./locales/embeds/fr.js')};
// -------------------- SOME VARIABLES -------------------- //



// ----------------------------------- SOME FUNCTIONS ----------------------------------- //
function channelsString(channels, lang) {
	var channelsString = "";
	for (var i = 0; i < channels.length; i++) { // For each channel
		channelsString = channelsString + "\n" + tools.mention(channels[i].channel, 'c');
	}
	if (channelsString == "") channelsString = tools.getString("noChannel", lang);
	return channelsString;
}

async function isAllowed(message, admin, lang) {
	if (!message) return false;
	const member = message.member || message.guild.member(message.author);
	if (!member) return false;
	
	// Owner perms
	if (message.author.id == 137239068567142400) return true;

	// Admin perms
	if (member.hasPermission("MANAGE_GUILD")) {
		return true;
	} else {
		if (admin) {
			tools.sendCatch(message.channel, tools.getString("noPermission", lang));
			return false;
		}
	}
	
	// Channel perms
	const channels = await db.getGuildChannels(message.guild.id);
	const channelID = message.channel.id;
	for (var i = 0; i < channels.length; i++) { // For each channel
		// If message is sent from allowed channel then return
		if (channels[i].channel == channelID) return true;
	}
	
	// If we went there is that the user is not allowed since previous for loop should return
	tools.sendCatch(message.channel, eb[lang].getNotAllowedEmbed(channelsString(channels, lang)));
	return false;
}

function initSettings(guild) {
	var guildID = guild.id;
	var guildName = guild.name;
	db.setServerName(guildID, guildName);
	db.setSetting(guildID, "questiondelay", 15000);
	db.setSetting(guildID, "answerdelay", 5000);
	db.setSetting(guildID, "defaultquestionsamount", 10);
	db.setSetting(guildID, "defaultdifficulty", 0);
	db.setSetting(guildID, "lang", "en");
	logger.info("Initialized server " + guildName);
}

async function exitHandler(options, exitCode) {
    if (options.cleanup) {
		logger.info("stopping bot...");
		await game.stopAll(client);
		logger.info("closing database...");
		await db.close();
	}
    if (exitCode || exitCode === 0) logger.info(exitCode); process.exit();
    if (options.exit) process.exit();
}
process.on('exit', exitHandler.bind(null,{cleanup:true})); // do something when app is closing
process.on('SIGINT', exitHandler.bind(null,{exit:true})); // catches ctrl+c event
process.on('SIGUSR1', exitHandler.bind(null,{exit:true})); // catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR2', exitHandler.bind(null,{exit:true})); // catches "kill pid" (for example: nodemon restart)
process.on('uncaughtException', exitHandler.bind(null,{exit:true})); //catches uncaught exceptions
// ----------------------------------- SOME FUNCTIONS ----------------------------------- //





// ---------------------------------------------- LISTENERS ---------------------------------------------- //
client.once('ready', async function () {
    logger.info('Bot ready');
    client.user.setActivity("use !jhelp for help");	
});

dbl.on('posted', () => {
	logger.info('Server count posted');
})

dbl.on('error', e => {
	logger.error(`Error while posting server count ${e}`);
})

client.on("channelDelete", function (channel) {
    db.removeGuildChannel(channel, "en");
});

client.on("guildCreate", guild => {
	logger.info("New server: " + guild.name);
	//guild.owner.send(tools.getString("thanks", "en"));
	initSettings(guild);
});

client.on("guildDelete", guild => {
   db.resetGuildSettings(guild.id, guild.name, null, null);
   logger.info("Bot removed from server: " + guild.name);
});

client.on('message', async function (message) {
    if (!message.content.startsWith(`${prefix}j`)) return; // If message doesn't start with !j then return
    const messageContent = message.content.toLowerCase(); // Get message to lower case
    const args = messageContent.slice(prefix.length).trim().split(/ +/g); // Get message arguments
    const channel = message.channel;
    const guild = message.guild;
	if (!guild) return;
	const lang = await db.getSetting(guild.id, "lang");

    if (messageContent.startsWith(`${prefix}jclean`)) { // jclean [OWNER]
        if (message.author.id == 137239068567142400) {
            const guilds = client.guilds;
			const dbguilds = await db.getAllServers();
			for (var entry of dbguilds) {
				var dbGuildID = entry.name;
				if (guilds.get(dbGuildID))
					logger.debug("Server " + dbGuildID + " exist");
				else
					db.resetGuildSettings(dbGuildID, dbGuildID, null, null);
			}
        }
    }

	if (messageContent.startsWith(`${prefix}jrestore`)) { // jrestore [OWNER]
        if (message.author.id == 137239068567142400) {
            const guilds = client.guilds;
			const tempdbguilds = await db.getAllServers();
			var dbguilds = [];
			for (var entry of tempdbguilds) {
				dbguilds[entry.name] = true;
			}
			for (var id of guilds.keys()) {
					if (dbguilds[id]) {
					logger.debug("Server " + id + " exist in database");
				} else {
					const tempGuild = guilds.get(id);
					initSettings(tempGuild);
				}
			}
		}
    }

    if (messageContent.startsWith(`${prefix}jstuck`)) { // jadd [ADMIN]
        if (await isAllowed(message, true, lang)) {
            game.unstuck(message, lang);
        }
    }

    if (messageContent.startsWith(`${prefix}jadd`)) { // jadd [ADMIN]
        if (await isAllowed(message, true, lang)) {
            db.addGuildChannel(channel, lang);
        }
    }

    else if (messageContent.startsWith(`${prefix}jremove`)) { // jremove [ADMIN]
        if (await isAllowed(message, true, lang)) {
            db.removeGuildChannel(channel, lang);
        }
    }

    else if (messageContent.startsWith(`${prefix}jreset`)) { // jremove [ADMIN]
        if (await isAllowed(message, true, lang)) {
            await db.resetGuildSettings(guild.id, guild.name, channel, lang);
			initSettings(guild);
        }
    }

    else if (messageContent.startsWith(`${prefix}jchannels`)) { // jremove [ADMIN]
        if (await isAllowed(message, true, lang)) {
            const channels = await db.getGuildChannels(guild.id)
			tools.sendCatch(channel, channelsString(channels, lang));
        }
    }

    else if (messageContent.startsWith(`${prefix}jkill`)) { // jkill [ADMIN]
        if (message.author.id == 137239068567142400) {
            exitHandler({cleanup:true}, null);
        }
    }

    else if (messageContent.startsWith(`${prefix}jdelayq`)) { // jdelayquestion [ADMIN]
        if (await isAllowed(message, true, lang)) {
            if (args[1] <= 1800000 && args[1] >= 2500 && tools.isInt(args[1])) {
                db.setSetting(guild.id, "questiondelay", args[1]);
                tools.sendCatch(channel, tools.getString("questionDelaySet", lang, {delay:args[1]}));
            } else {
                tools.sendCatch(channel, tools.getString("questionDelayError", lang));
            }
        }
    }

    else if (messageContent.startsWith(`${prefix}jdelaya`)) { // jdelayanswer [ADMIN]
        if (await isAllowed(message, true, lang)) {
            if (args[1] <= 50000 && args[1] >= 500 && tools.isInt(args[1])) {
                db.setSetting(guild.id, "answerdelay", args[1]);
				tools.sendCatch(channel, tools.getString("answerDelaySet", lang, {delay:args[1]}));
            } else {
                tools.sendCatch(channel, tools.getString("answerDelayError", lang));
            }
        }
    }

    else if (messageContent.startsWith(`${prefix}jdefd`)) { // jdefaultdifficulty [ADMIN]
        if (await isAllowed(message, true, lang)) {
            if (args[1] <= 3 && args[1] >= 0 && tools.isInt(args[1])) {
                db.setSetting(guild.id, "defaultdifficulty", args[1]);
				tools.sendCatch(channel, tools.getString("difficultySet", lang, {difficulty:args[1]}));
            } else {
                tools.sendCatch(channel, tools.getString("difficultyError", lang));
            }
        }
    }

    else if (messageContent.startsWith(`${prefix}jdefq`)) { // jdefaultquestions [ADMIN]
        if (await isAllowed(message, true, lang)) {
            if (args[1] <= 100 && args[1] >= 1 && tools.isInt(args[1])) {
                db.setSetting(guild.id, "defaultquestionsamount", args[1]);
				tools.sendCatch(channel, tools.getString("questionsAmountSet", lang, {amount:args[1]}));
            } else {
                tools.sendCatch(channel, tools.getString("questionsAmountError", lang));
            }
        }
    }
	
	else if (messageContent.startsWith(`${prefix}jlang`)) { // jlang [ADMIN]
        if (await isAllowed(message, true, lang)) {
			if (!args[1]) return;
			const tempLang = args[1].substring(0, 2);
            if (tempLang == "fr" || tempLang == "en") {
                db.setSetting(guild.id, "lang", tempLang);
				tools.sendCatch(channel, tools.getString("langSet", lang, {lang:tempLang}));
            } else {
				tools.sendCatch(channel, tools.getString("langError", lang, {lang:tempLang, langs:tools.getLocales()}));
            }
        }
    }

    else if (messageContent.startsWith(`${prefix}jadmin`)) { // jadmin [ADMIN]
        if (await isAllowed(message, true, lang)) {
            tools.sendCatch(channel, eb[lang].getAdminHelpEmbed());
        }
    }

    else if (messageContent.startsWith(`${prefix}jh`)) { // jhelp
        if (await isAllowed(message, false, lang)) {
            const embeds = eb[lang].getHelpEmbed(); // Get commands and rules embeds
            await tools.sendCatch(channel, embeds[0]);
            await tools.sendCatch(channel, embeds[1]);
        }
    }

    else if (messageContent.startsWith(`${prefix}jdif`)) { // jdif
        if (await isAllowed(message, false, lang)) {
            tools.sendCatch(channel, eb[lang].getDifEmbed());
        }
    }

    else if (messageContent.startsWith(`${prefix}jls`)) { // jls [OWNER]
        if (message.author.id == 137239068567142400) {
            var servers = client.guilds;
			var users = 0;
			var en = 0;
			for (var g of servers) {
				var templang = await db.getSetting(g[0], "lang");
				if (templang == "en") en++;
				var members = g[1].memberCount;
				users += members;
				logger.debug("[" + g[0] + "] (" + templang + ") (" + members + " users) " + g[1].name);
			}
			var ratioEN = (en / servers.size * 100).toFixed(2);
			var ratioFR = (100-ratioEN).toFixed(2);
			logger.debug("Total users: " + users);
			logger.debug("Total servers: " + servers.size);
			logger.debug("English:" + ratioEN + "% (" + en + ") French:" + ratioFR + "% (" + (servers.size-en) + ")"); 
        }
    }
	
	else if (messageContent.startsWith(`${prefix}jinfo`)) { // jinfo
        if (await isAllowed(message, false, lang)) {
            var servers = client.guilds;
			var users = 0;
			client.guilds.forEach(g => {
			  users += g.memberCount;
			})	
			var uptime = process.uptime();
            tools.sendCatch(channel, eb[lang].getInfoEmbed(users, servers.size, tools.format(uptime)));
        }
    }

    else if (messageContent.startsWith(`${prefix}jp`) || messageContent.startsWith(`${prefix}jstart`)) { // jplay
        if (await isAllowed(message, false, lang)) {
            game.preStart(message, args, lang);
        }
    }

    else if (messageContent.startsWith(`${prefix}jstop`)) { // jstop
        if (await isAllowed(message, false, lang)) {
            game.stop(message, tools.getString("stoppedBy", lang, {player:eb[lang].mention(message.author.id, 'u')}), lang);
        }
    }

    else if (messageContent.startsWith(`${prefix}jstats`)) { // jstats
        if (await isAllowed(message, false, lang)) {
            const userStats = await db.getUserStats(guild.id, message.author.id);
			if (userStats) {
				tools.sendCatch(channel, eb[lang].getUserStatsEmbed(userStats));
			} else {
				tools.sendCatch(channel, eb[lang].getNoStatsEmbed());
			}
        }
    }

    else if (messageContent.startsWith(`${prefix}jtop`)) { // jtop
        if (await isAllowed(message, false, lang)) {
            db.getTop(guild, channel, lang);
        }
    }
})
// ---------------------------------------------- LISTENERS ---------------------------------------------- //



// ------- START ------- //
async function start() {
    await db.init();
    client.login(token);
}
start();
// ------- START ------- //
