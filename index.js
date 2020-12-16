// -------------------- SETTINGS -------------------- //
const OWNER_ID = 137239068567142400;
const ACTIVITY_MESSAGE = "!jhelp";
var logMessages = false;
// -------------------- SETTINGS -------------------- //



// -------------------- SOME VARIABLES -------------------- //
global.config = require('./config.json');
global.db = require('./database.js');
global.lm = require('./languages-manager.js');
const Discord = require('discord.js');
const client = new Discord.Client();
const game = require('./game.js');
const tools = require('./tools.js');
const logger = require('./logger.js');
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
	if (channelsString == "") channelsString = lm.getString("noChannel", lang);
	return channelsString;
}

async function channelAllowed(guildID, message) {
	const channels = await db.getGuildChannels(guildID);
	const channelID = message.channel.id;
	for (var i = 0; i < channels.length; i++) // For each channel
		if (channels[i].channel == channelID) return true; // If message is sent from allowed channel then return
	return false;
}

async function isAllowed(message, lang) {
	// Owner perms
	if (message.author.id == OWNER_ID) return true;

	// Moderator perms
	if (isModeratorAllowed(message)) return true;

	// Channel perm
	if (channelAllowed(message.guild.id)) return true;

	// If we went there is that the user is not allowed since previous for loop should return
	tools.sendCatch(message.channel, lm.getEb(lang).getNotAllowedEmbed(getChannelsString(channels, lang)));
	return false;
}

async function isModeratorAllowed(message) {
	// Checking
	if (!message) return false;
	const member = message.member || message.guild.member(message.author);
	if (!member) return false;

	// Admin perms
	return member.hasPermission("MANAGE_GUILD");
}

function initSettings(guild) {
	var guildID = guild.id;
	var guildName = guild.name;
	db.setSetting(guildID, "name", guildName);
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
    client.user.setActivity(ACTIVITY_MESSAGE);
});

client.on("channelDelete", function (channel) {
    db.removeGuildChannel(channel, defaultLanguage);
});

client.on("guildCreate", guild => {
	logger.info("New server: " + guild.name);
	try { guild.owner.send(lm.getString("thanks", defaultLanguage)); }
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

	if (logMessages) logger.debug("Message received");

	// Check if the message is not a PM
	const guild = message.guild;
	if (!guild) return;

	// Check if the message is not from a bot
	if(message.author.bot) return;

	// Get guilds settings
	const prefix = await db.getSetting(guild.id, "prefix") || DEFAULT_PREFIX;
	const lang = await db.getSetting(guild.id, "lang") || DEFAULT_LANGUAGE;

	// Check if the message starts with the prefix
    if (!message.content.startsWith(`${prefix}`)) return; // If message doesn't start with !j then return

	// Variables
    const messageContent = message.content.toLowerCase(); // Get message to lower case
    const args = messageContent.slice(prefix.length).trim().split(/ +/g); // Get message arguments
	const channel = message.channel;



	// #################################################### USER COMMANDS #################################################### //
	// If allowed to send the command
	if (!await isAllowed(message, lang)) return;
	// #################################################### USER COMMANDS #################################################### //



    if (messageContent.startsWith(`${prefix}h`)) { // help
		const helpEmbed = lm.getEb(lang).getHelpEmbed(prefix); // Get commands and rules embeds
		await tools.sendCatch(channel, helpEmbed[0]);
		await tools.sendCatch(channel, helpEmbed[1]);
    }

    else if (messageContent.startsWith(`${prefix}dif`)) { // dif
		tools.sendCatch(channel, lm.getEb(lang).getDifEmbed());
    }

	else if (messageContent.startsWith(`${prefix}info`)) { // info
		var servers = client.guilds;
		var users = 0;
		client.guilds.forEach(g => {
		  users += g.memberCount;
		})
		var uptime = process.uptime();
		tools.sendCatch(channel, lm.getEb(lang).getInfoEmbed(users, servers.size, tools.format(uptime)));
    }

    else if (messageContent.startsWith(`${prefix}pl`) || messageContent.startsWith(`${prefix}start`)) { // play
		game.preStart(message, args, lang);
    }

    else if (messageContent.startsWith(`${prefix}stop`)) { // stop
		game.stop(message, lm.getString("stoppedBy", lang, {player:lm.getEb(lang).mention(message.author.id, 'u')}), lang);
    }

    else if (messageContent.startsWith(`${prefix}stats`)) { // stats
		const userStats = await db.getUserStats(guild.id, message.author.id);
		if (userStats) {
			tools.sendCatch(channel, lm.getEb(lang).getUserStatsEmbed(userStats));
		} else {
			tools.sendCatch(channel, lm.getEb(lang).getNoStatsEmbed());
		}
    }

    else if (messageContent.startsWith(`${prefix}top`)) { // top
		db.getTop(guild, channel, lang);
    }



	// #################################################### MODERATOR COMMANDS #################################################### //
	// If moderator allowed to send the command
	if (!await isModeratorAllowed(message)) { tools.sendCatch(message.channel, lm.getString("noPermission", lang)); return; }
	// #################################################### MODERATOR COMMANDS #################################################### //



   	if (messageContent.startsWith(`${prefix}stuck`)) { // stuck [ADMIN]
		game.unstuck(message, lang);
    }

    else if (messageContent.startsWith(`${prefix}add`)) { // add [ADMIN]
		db.addGuildChannel(channel, lang);
    }

    else if (messageContent.startsWith(`${prefix}remove`)) { // remove [ADMIN]
		db.removeGuildChannel(channel, lang);
    }

    else if (messageContent.startsWith(`${prefix}prefix`)) { // remove [ADMIN]
		// If not empty, less than 4 characters and ASCII only
		if ((args[1] || "").length < 4 && args[1] && /^[\x00-\x7F]*$/.test(args[1])) {
			db.setSetting(guild.id, "prefix", args[1]);
			tools.sendCatch(channel, lm.getString("prefixSet", lang, {delay:args[1]}));
		} else {
			tools.sendCatch(channel, lm.getString("prefixError", lang));
		}
    }
    else if (messageContent.startsWith(`${prefix}reset`)) { // remove [ADMIN]
		await db.resetGuildSettings(guild.id, guild.name, channel, lang);
		initSettings(guild);
    }

    else if (messageContent.startsWith(`${prefix}channels`)) { // remove [ADMIN]
		const channels = await db.getGuildChannels(guild.id)
		tools.sendCatch(channel, getChannelsString(channels, lang));
    }

    else if (messageContent.startsWith(`${prefix}delayq`)) { // delayquestion [ADMIN]
		if (args[1] <= 1800000 && args[1] >= 2500 && tools.isInt(args[1])) {
			db.setSetting(guild.id, "questiondelay", args[1]);
			tools.sendCatch(channel, lm.getString("questionDelaySet", lang, {delay:args[1]}));
		} else {
			tools.sendCatch(channel, lm.getString("questionDelayError", lang));
		}
    }

    else if (messageContent.startsWith(`${prefix}delaya`)) { // delayanswer [ADMIN]
		if (args[1] <= 50000 && args[1] >= 500 && tools.isInt(args[1])) {
			db.setSetting(guild.id, "answerdelay", args[1]);
			tools.sendCatch(channel, lm.getString("answerDelaySet", lang, {delay:args[1]}));
		} else {
			tools.sendCatch(channel, lm.getString("answerDelayError", lang));
		}
    }

    else if (messageContent.startsWith(`${prefix}defd`)) { // defaultdifficulty [ADMIN]
		if (args[1] <= 3 && args[1] >= 0 && tools.isInt(args[1])) {
			db.setSetting(guild.id, "defaultdifficulty", args[1]);
			tools.sendCatch(channel, lm.getString("difficultySet", lang, {difficulty:args[1]}));
		} else {
			tools.sendCatch(channel, lm.getString("difficultyError", lang));
		}
    }

    else if (messageContent.startsWith(`${prefix}defq`)) { // defaultquestions [ADMIN]
		if (args[1] <= 100 && args[1] >= 1 && tools.isInt(args[1])) {
			db.setSetting(guild.id, "defaultquestionsamount", args[1]);
			tools.sendCatch(channel, lm.getString("questionsAmountSet", lang, {amount:args[1]}));
		} else {
			tools.sendCatch(channel, lm.getString("questionsAmountError", lang));
		}
    }

	else if (messageContent.startsWith(`${prefix}lang`)) { // lang [ADMIN]
		const langs = lm.getLocales();
		const commandLang = (args[1] || "").substring(0, 2);
		if (langs.includes(commandLang)) {
			db.setSetting(guild.id, "lang", commandLang);
			tools.sendCatch(channel, lm.getString("langSet", lang, {lang:commandLang}));
		} else {
			tools.sendCatch(channel, lm.getString("langError", lang, {lang:commandLang, langs:langs}));
		}
    }

    else if (messageContent.startsWith(`${prefix}admin`)) { // admin [ADMIN]
		tools.sendCatch(channel, lm.getEb(lang).getAdminHelpEmbed());
    }



	// #################################################### OWNER COMMANDS #################################################### //
	// If owner allowed to send the command
	if (message.author.id != OWNER_ID) return;
	// #################################################### OWNER COMMANDS #################################################### //



    if (messageContent.startsWith(`${prefix}kill`)) { // kill [ADMIN]
		exitHandler({cleanup:true}, null);
    }

    else if (messageContent.startsWith(`${prefix}reload`)) { // reload [OWNER]
		lm.reloadLanguages();
    }

    // This function is NOT USED TO LOG THE CONTENT OF THE MESSAGES
    // But only when a message is received
    else if (messageContent.startsWith(`${prefix}log`)) { // logmessages [OWNER]
		if (args[1] == "true" || args[1] == "false") {
			var finalValue = args[1] == "true";
			logMessages = finalValue;
			logger.info("Message received logging set to " + logMessages);
		} else {
			logger.info("Wrong value");
		}
		return;
    }

    else if (messageContent.startsWith(`${prefix}ls`)) { // ls [OWNER]
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

	else if (messageContent.startsWith(`${prefix}clean`)) { // clean [OWNER]
		const guilds = client.guilds;
		const dbguilds = await db.getAllServers();
		for (var entry of dbguilds) {
			var dbGuildID = entry.name;
			if (!guilds.get(dbGuildID) && dbGuildID.match(/^[0-9]{18}$/)) {
				db.resetGuildSettings(dbGuildID, dbGuildID, null, null);
				logger.info("Deleted settings for guild " + dbGuildID);
			}
		}
		logger.success("Command clean OK");
    }

	else if (messageContent.startsWith(`${prefix}update`)) { // restore [OWNER]
		const guilds = client.guilds;
		const tempdbguilds = await db.getAllServers();
		var dbguilds = [];
		for (var entry of tempdbguilds) {
			if (entry.name.match(/^[0-9]{18}$/))
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
		logger.success("Command update OK");
    }

	else if (messageContent.startsWith(`${prefix}restore`)) { // restore [OWNER]
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
				logger.info("Initialized settings for guild " + id);
			}
		}
		logger.success("Command restore OK");
    }

	else if (messageContent.startsWith(`${prefix}status`)) { // status [OWNER]
        if (message.author.id == OWNER_ID) {
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
	await lm.reloadLanguages(); // Load languages
	logger.info("Connecting to Discord...");
        await client.login(config.token);
	apiManager.init(client);
}
start();
// ------- START ------- //
