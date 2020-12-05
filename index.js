
// -------------------- SETTINGS -------------------- //
const defaultLanguage = "en";
const defaultPrefix = "!j"
const ownerID = 137239068567142400;
// -------------------- SETTINGS -------------------- //



// -------------------- SOME VARIABLES -------------------- //
const activityMessage = "!jhelp";
global.config = require('./config.json');
const Discord = require('discord.js');
const client = new Discord.Client();
const game = require('./game.js');
const tools = require('./tools.js');
const db = require('./database.js');
const logger = require('./logger.js');
const eb = tools.embeds;
const apiManager = require('./api-manager.js');
// -------------------- SOME VARIABLES -------------------- //



// ----------------------------------- SOME FUNCTIONS ----------------------------------- //
// Return a string of all the channels the bot is allowed to use
function getChannelsString(channels, lang) {
	var channelsString = "";
	// Loop trough each channe and add them to a string
	for (var i = 0; i < channels.length; i++) {
		channelsString = channelsString + "\n" + tools.mention(channels[i].channel, 'c');
	}
	// If the string is empty, mean there was no channel
	if (channelsString == "") channelsString = tools.getString("noChannel", lang);
	return channelsString;
}

async function isAllowed(message, admin, lang) {
	if (!message) return false;
	const member = message.member || message.guild.member(message.author);
	if (!member) return false;

	// Owner perms
	if (message.author.id == ownerID) return true;

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
	tools.sendCatch(message.channel, eb[lang].getNotAllowedEmbed(getChannelsString(channels, lang)));
	return false;
}

function initSettings(guild) {
	var guildID = guild.id;
	var guildName = guild.name;
	db.setSetting(guildID, "name", guildName);
	db.setSetting(guildID, "questiondelay", 15000);
	db.setSetting(guildID, "answerdelay", 5000);
	db.setSetting(guildID, "defaultquestionsamount", 10);
	db.setSetting(guildID, "defaultdifficulty", 0);
	db.setSetting(guildID, "lang", defaultLanguage);
	db.setSetting(guildID, "prefix", defaultPrefix);
	logger.info("Initialized server " + guildName);
}

async function exitHandler(options, exitCode) {
    if (options.cleanup) {
		logger.info("stopping bot...");
		await game.stopAll(client);
		logger.info("closing database...");
		await db.close();
	}
    if (exitCode || exitCode === 0) logger.info("Exit code: " + exitCode); process.exit();
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
    client.user.setActivity(activityMessage);
});

client.on("channelDelete", function (channel) {
    db.removeGuildChannel(channel, defaultLanguage);
});

client.on("guildCreate", guild => {
	logger.info("New server: " + guild.name);
	try { guild.owner.send(tools.getString("thanks", defaultLanguage)); }
	catch (error) { logger.error("Error while sending a PM to the user"); logger.error(error); }
	initSettings(guild);
});

client.on("guildDelete", guild => {
   if (guild) {
   	db.resetGuildSettings(guild.id, guild.name, null, null);
   	logger.info("Bot removed from server: " + guild.name);
   }
});

client.on('message', async function (message) {
	const guild = message.guild;
	if (!guild) return;
	const prefix = await db.getSetting(guild.id, "prefix") || defaultPrefix;

    if (!message.content.startsWith(`${prefix}`)) return; // If message doesn't start with !j then return
    const messageContent = message.content.toLowerCase(); // Get message to lower case
    const args = messageContent.slice(prefix.length).trim().split(/ +/g); // Get message arguments
    const channel = message.channel;
	const lang = await db.getSetting(guild.id, "lang") || defaultLanguage;

    if (messageContent.startsWith(`${prefix}h`)) { // help
        if (await isAllowed(message, false, lang)) {
			const embeds = eb[lang];
			if (!embeds) {
				logger.error("Error happened on help command, wrong language: " + lang);
				tools.sendCatch(channel, "An error happened, if the error persist, you can get help on the support server.");
			}
            const helpEmbed = embeds.getHelpEmbed(); // Get commands and rules embeds
            await tools.sendCatch(channel, helpEmbed[0]);
            await tools.sendCatch(channel, helpEmbed[1]);
        }
    }

    else if (messageContent.startsWith(`${prefix}dif`)) { // dif
        if (await isAllowed(message, false, lang)) {
            tools.sendCatch(channel, eb[lang].getDifEmbed());
        }
    }

	else if (messageContent.startsWith(`${prefix}info`)) { // info
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

    else if (messageContent.startsWith(`${prefix}pl`) || messageContent.startsWith(`${prefix}start`)) { // play
        if (await isAllowed(message, false, lang)) {
            game.preStart(message, args, lang);
        }
    }

    else if (messageContent.startsWith(`${prefix}stop`)) { // stop
        if (await isAllowed(message, false, lang)) {
            game.stop(message, tools.getString("stoppedBy", lang, {player:eb[lang].mention(message.author.id, 'u')}), lang);
        }
    }

    else if (messageContent.startsWith(`${prefix}stats`)) { // stats
        if (await isAllowed(message, false, lang)) {
            const userStats = await db.getUserStats(guild.id, message.author.id);
			if (userStats) {
				tools.sendCatch(channel, eb[lang].getUserStatsEmbed(userStats));
			} else {
				tools.sendCatch(channel, eb[lang].getNoStatsEmbed());
			}
        }
    }

    else if (messageContent.startsWith(`${prefix}top`)) { // top
        if (await isAllowed(message, false, lang)) {
            db.getTop(guild, channel, lang);
        }
    }

   	else if (messageContent.startsWith(`${prefix}stuck`)) { // stuck [ADMIN]
        if (await isAllowed(message, true, lang)) {
            game.unstuck(message, lang);
        }
    }

    else if (messageContent.startsWith(`${prefix}add`)) { // add [ADMIN]
        if (await isAllowed(message, true, lang)) {
            db.addGuildChannel(channel, lang);
        }
    }

    else if (messageContent.startsWith(`${prefix}remove`)) { // remove [ADMIN]
        if (await isAllowed(message, true, lang)) {
            db.removeGuildChannel(channel, lang);
        }
    }
	
    else if (messageContent.startsWith(`${prefix}prefix`)) { // remove [ADMIN]
        if (await isAllowed(message, true, lang)) {
			// If not empty, less than 4 characters and ASCII only
            if ((args[1] || "").length < 4 && args[1] && /^[\x00-\x7F]*$/.test(args[1])) {
                db.setSetting(guild.id, "prefix", args[1]);
				tools.sendCatch(channel, tools.getString("prefixSet", lang, {delay:args[1]}));
            } else {
                tools.sendCatch(channel, tools.getString("prefixError", lang));
            }
        }
    }
    else if (messageContent.startsWith(`${prefix}reset`)) { // remove [ADMIN]
        if (await isAllowed(message, true, lang)) {
            await db.resetGuildSettings(guild.id, guild.name, channel, lang);
			initSettings(guild);
        }
    }

    else if (messageContent.startsWith(`${prefix}channels`)) { // remove [ADMIN]
        if (await isAllowed(message, true, lang)) {
            const channels = await db.getGuildChannels(guild.id)
			tools.sendCatch(channel, getChannelsString(channels, lang));
        }
    }

    else if (messageContent.startsWith(`${prefix}kill`)) { // kill [ADMIN]
        if (message.author.id == ownerID) {
            exitHandler({cleanup:true}, null);
        }
    }

    else if (messageContent.startsWith(`${prefix}delayq`)) { // delayquestion [ADMIN]
        if (await isAllowed(message, true, lang)) {
            if (args[1] <= 1800000 && args[1] >= 2500 && tools.isInt(args[1])) {
                db.setSetting(guild.id, "questiondelay", args[1]);
                tools.sendCatch(channel, tools.getString("questionDelaySet", lang, {delay:args[1]}));
            } else {
                tools.sendCatch(channel, tools.getString("questionDelayError", lang));
            }
        }
    }

    else if (messageContent.startsWith(`${prefix}delaya`)) { // delayanswer [ADMIN]
        if (await isAllowed(message, true, lang)) {
            if (args[1] <= 50000 && args[1] >= 500 && tools.isInt(args[1])) {
                db.setSetting(guild.id, "answerdelay", args[1]);
				tools.sendCatch(channel, tools.getString("answerDelaySet", lang, {delay:args[1]}));
            } else {
                tools.sendCatch(channel, tools.getString("answerDelayError", lang));
            }
        }
    }

    else if (messageContent.startsWith(`${prefix}defd`)) { // defaultdifficulty [ADMIN]
        if (await isAllowed(message, true, lang)) {
            if (args[1] <= 3 && args[1] >= 0 && tools.isInt(args[1])) {
                db.setSetting(guild.id, "defaultdifficulty", args[1]);
				tools.sendCatch(channel, tools.getString("difficultySet", lang, {difficulty:args[1]}));
            } else {
                tools.sendCatch(channel, tools.getString("difficultyError", lang));
            }
        }
    }

    else if (messageContent.startsWith(`${prefix}defq`)) { // defaultquestions [ADMIN]
        if (await isAllowed(message, true, lang)) {
            if (args[1] <= 100 && args[1] >= 1 && tools.isInt(args[1])) {
                db.setSetting(guild.id, "defaultquestionsamount", args[1]);
				tools.sendCatch(channel, tools.getString("questionsAmountSet", lang, {amount:args[1]}));
            } else {
                tools.sendCatch(channel, tools.getString("questionsAmountError", lang));
            }
        }
    }

	else if (messageContent.startsWith(`${prefix}lang`)) { // lang [ADMIN]
        if (await isAllowed(message, true, lang)) {
			const langs = tools.getLocales();
			const commandLang = (args[1] || "").substring(0, 2);
            if (langs.includes(commandLang)) {
                db.setSetting(guild.id, "lang", commandLang);
				tools.sendCatch(channel, tools.getString("langSet", lang, {lang:commandLang}));
            } else {
				tools.sendCatch(channel, tools.getString("langError", lang, {lang:commandLang, langs:langs}));
            }
        }
    }

    else if (messageContent.startsWith(`${prefix}admin`)) { // admin [ADMIN]
        if (await isAllowed(message, true, lang)) {
            tools.sendCatch(channel, eb[lang].getAdminHelpEmbed());
        }
    }

    else if (messageContent.startsWith(`${prefix}ls`)) { // ls [OWNER]
        if (message.author.id == ownerID) {
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

	else if (messageContent.startsWith(`${prefix}clean`)) { // clean [OWNER]
        if (message.author.id == ownerID) {
            const guilds = client.guilds;
			const dbguilds = await db.getAllServers();
			for (var entry of dbguilds) {
				var dbGuildID = entry.name;
				if (!guilds.get(dbGuildID))
					db.resetGuildSettings(dbGuildID, dbGuildID, null, null);
			}
			logger.info("Command clean OK");
        }
    }

	else if (messageContent.startsWith(`${prefix}update`)) { // restore [OWNER]
        if (message.author.id == ownerID) {
            const guilds = client.guilds;
			const tempdbguilds = await db.getAllServers();
			var dbguilds = [];
			for (var entry of tempdbguilds) {
				dbguilds[entry.name] = true;
			}
			for (var id of guilds.keys()) {
				if (dbguilds[id]) { // If the guild exists in the database
					const tempGuild = guilds.get(id);
					var guildID = tempGuild.id;
					var guildName = tempGuild.name;
					db.setSetting(guildID, "name", guildName);
				}
			}
			logger.info("Command update OK");
		}
    }

	else if (messageContent.startsWith(`${prefix}restore`)) { // restore [OWNER]
        if (message.author.id == ownerID) {
            const guilds = client.guilds;
			const tempdbguilds = await db.getAllServers();
			var dbguilds = [];
			for (var entry of tempdbguilds) {
				dbguilds[entry.name] = true;
			}
			for (var id of guilds.keys()) {
				if (!dbguilds[id]) {
					const tempGuild = guilds.get(id);
					initSettings(tempGuild);
				}
			}
			logger.info("Command restore OK");
		}
    }

	else if (messageContent.startsWith(`${prefix}status`)) { // status [OWNER]
        if (message.author.id == ownerID) {
			var newStatus = messageContent.replace(`${prefix}status `, "");
			logger.info("Status changed to: " + newStatus);
			client.user.setActivity(newStatus);
		}
    }
})
// ---------------------------------------------- LISTENERS ---------------------------------------------- //



// ------- START ------- //
async function start() {
    await db.init();
	logger.info("Loaded languages: " + tools.getLocales());
    await client.login(config.token);
	apiManager.init(client);
}
start();
// ------- START ------- //
