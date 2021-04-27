/**
 * @file Entry point, permissions, commands
 * @author jojos38
 */



// -------------------- SETTINGS -------------------- //
const OWNER_ID = 137239068567142400;
const ACTIVITY_MESSAGE = "!jhelp";
var logMessages = false;
// -------------------- SETTINGS -------------------- //



// -------------------- SOME VARIABLES -------------------- //
require('app-module-path').addPath(__dirname);
global.config = require('config.json');
// Others
const fs = require('fs');
const tools = require('tools.js');
const logger = require('logger.js');
const messages = require('messages.js');
// Database
const DatabaseManager = require('database-manager.js');
const db = new DatabaseManager();
// Discord
const Discord = require('discord.js');
global.client = new Discord.Client();
// Language Manager
const LanguageManager = require('language-manager.js');
global.lm = new LanguageManager();
// Api Manager
const ApiManager = require('api-manager.js');
const apiManager = new ApiManager(client, config.id, config.discordTokens);
// Game Manager
const GameManager = require('game-manager.js');
const gameManager = new GameManager();
// -------------------- SOME VARIABLES -------------------- //



// ----------------------------------- SOME FUNCTIONS ----------------------------------- //
function getUserNickname(guild, user) {
	let nick;
	if (guild.members.cache.get(user.userID)) nick = guild.members.cache.get(user.userID).nickname || guild.members.cache.get(user.userID).user.username;
	else nick = user.username;
	if (nick == "") nick = "_";
	return nick;
}

async function channelAllowed(guildID, channelID) {
	const channels = await db.getGuildChannels(guildID);
	for (var i = 0; i < channels.length; i++) // For each channel
		if (channels[i].channelID == channelID) return true; // If message is sent from allowed channel then return
	return false;
}

async function isAllowed(message, lang) {
	// Owner perms
	if (message.author.id == OWNER_ID) return true;

	// Moderator perms
	if (isModeratorAllowed(message)) return true;

	// Channel perm
	if (channelAllowed(message.guild.id, message.channel.id)) return true;

	// If we went there is that the user is not allowed since previous for loop should return
	tools.sendCatch(message.channel, lm.getNotAllowedEmbed(lang, messages.getChannelsString(channels, lang)));
	return false;
}

async function isModeratorAllowed(message) {
	if (message.author.id == OWNER_ID) return true;
	// Checking
	if (!message) return false;
	const member = message.member || message.guild.member(message.author);
	if (!member) return false;

	// Admin perms
	return member.hasPermission("MANAGE_GUILD");
}

async function exitHandler(options, exitCode) {
    if (options.cleanup) {
		logger.info("stopping bot...");
		logger.info("closing database...");
		await db.close();
	}
    if (exitCode || exitCode === 0) logger.info("Exit code: " + exitCode); process.exit();
    if (options.exit) process.exit();
}

process.on('exit', exitHandler.bind(null,{cleanup:true})); // Do something when app is closing
process.on('SIGINT', exitHandler.bind(null,{exit:true})); // Catches ctrl+c event
process.on('SIGUSR1', exitHandler.bind(null,{exit:true})); // Catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR2', exitHandler.bind(null,{exit:true})); // Catches "kill pid" (for example: nodemon restart)
process.on('uncaughtException', exitHandler.bind(null,{exit:true})); // Catches uncaught exceptions
// ----------------------------------- SOME FUNCTIONS ----------------------------------- //





// ---------------------------------------------- LISTENERS ---------------------------------------------- //
client.on("disconnect", () => {
    logger.error("Connection to Discord's servers lost!");
});

client.on("channelDelete", function (channel) {
    db.removeGuildChannel(channel.id);
});

client.on("guildCreate", guild => {
	logger.info("New server: " + guild.name);
	try { guild.owner.send(lm.getString("thanks", "en")); }
	catch (error) { logger.error("Error while sending a PM to the user"); logger.error(error); }
});

client.on("guildDelete", guild => {
	if (guild) {
		db.resetGuildSettings(guild.id);
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
	const {lang, prefix} = await db.getSettings(guild.id, ["prefix", "lang"])

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
		tools.sendCatch(channel, lm.getHelpEmbed(lang, prefix));
    }

    else if (messageContent.startsWith(`${prefix}dif`)) { // dif
		tools.sendCatch(channel, lm.getDifEmbed(lang));
    }

	else if (messageContent.startsWith(`${prefix}info`)) { // info
		var guilds = client.guilds.cache;
		var users = 0;
		guilds.forEach(g => { users += g.memberCount; });
		var uptime = process.uptime();
		tools.sendCatch(channel, lm.getInfoEmbed(lang, users, guilds.size, tools.format(uptime)));
		return;
    }

    else if (messageContent.startsWith(`${prefix}pl`) || messageContent.startsWith(`${prefix}start`)) { // play
		if (!gameManager.running(channel.id)) {
			let game = gameManager.startClassicGame(db, guild, channel, message.author.id, lang, args);
		}
		else
			tools.sendCatch(channel, lm.getAlreadyRunningEmbed(lang, channel.id));
    }

    else if (messageContent.startsWith(`${prefix}stop`)) { // stop
		gameManager.stopGame(channel, message.guild.member(message.author), lm.getString("game.stoppedBy", lang, {player: tools.mention(message.author.id, 'u')}), lang);
    }

    else if (messageContent.startsWith(`${prefix}stats`)) { // stats
		let userStats = await db.getUserStats(guild.id, message.author.id);
		tools.sendCatch(channel, lm.getUserStatsEmbed(lang, userStats));
    }

    else if (messageContent.startsWith(`${prefix}top`)) { // top
		let usersEb = [];
		let guildUsers = await db.getTop(guild.id);
		let totalUsers = guildUsers.length;
		if (!guildUsers) { logger.error("Error while getting top for guild " + guildID); return; }
		for (let i = 0; i < totalUsers; i++) {
			let user = guildUsers[i];
			usersEb.push({ score: user.score, won: user.won, position: getUserNickname(guild, user, i + 1) });
			if (i >= 10) break;
		}
		tools.sendCatch(channel, lm.getTopEmbed(lang, totalUsers, usersEb));
    }

    else if (messageContent.startsWith(`${prefix}globaltop`)) { // top
		let usersEb = [];
		const users = await db.getAllUsers();
		let totalUsers = users.length;
		// If there is a user ID
		if (args[1]) {
			let position = -1;
			
			// Get the ID from the message
			let userID = args[1].replace(/[\\<>@#&!]/g, "");
			// Get the user position in the list
			for (let i = 0; i < totalUsers; i++) {
				let user = users[i];
				if (user.userID == userID) position = i;
			}
			if (position != -1) {
				// Show the 5 above and before users
				if (position + 5 > totalUsers) position = totalUsers - 5;
				if (position - 5 < 0) position = 5;
				for (let i = position - 5; i < position + 5; i++) {
					let user = users[i];
					usersEb.push({ score: user.score, won: user.won, position: getUserNickname(guild, user, i + 1) });
				}
			}
		} else {
			for (let i = 0; i < totalUsers; i++) {
				if (i >= 10) break;
				let user = users[i];
				usersEb.push({ score: user.score, won: user.won, position: getUserNickname(guild, user, i + 1) });
			}
		}
		if (totalUsers == 0) usersEb = lm.getString("noStats", lang);
		tools.sendCatch(channel, lm.getTopEmbed(lang, totalUsers, usersEb));
    }


	// #################################################### MODERATOR COMMANDS #################################################### //
	// If moderator allowed to send the command
	if (!await isModeratorAllowed(message)) return;
	// #################################################### MODERATOR COMMANDS #################################################### //
	
	
	
    if (messageContent.startsWith(`${prefix}add`)) { // add [ADMIN]
		let result = await db.addGuildChannel(guild.id, channel.id);
		if (result) tools.sendCatch(channel, lm.getString("settings.alreadyAuthorized", lang));
		else tools.sendCatch(channel, lm.getString("settings.channelAdded", lang));
    }

    else if (messageContent.startsWith(`${prefix}remove`)) { // remove [ADMIN]
		let result = await db.removeGuildChannel(channel.id);
		if (result) tools.sendCatch(channel, lm.getString("settings.channelDeleted", lang));
		else tools.sendCatch(channel, lm.getString("settings.channelNotInList", lang));
    }

    else if (messageContent.startsWith(`${prefix}prefix`)) { // remove [ADMIN]
		// If not empty, less than 4 characters and ASCII only
		if ((args[1] || "").length < 4 && args[1] && /^[\x00-\x7F]*$/.test(args[1])) {
			db.setSetting(guild.id, "prefix", args[1]);
			tools.sendCatch(channel, lm.getString("settings.prefixSet", lang, {delay:args[1]}));
		} else {
			tools.sendCatch(channel, lm.getString("settings.prefixError", lang));
		}
    }
    else if (messageContent.startsWith(`${prefix}reset`)) { // remove [ADMIN]
		await db.resetGuildSettings(guild.id);
		await tools.sendCatch(channel, lm.getString("settings.resetted", lang));
    }

    else if (messageContent.startsWith(`${prefix}channels`)) { // remove [ADMIN]
		const channels = await db.getGuildChannels(guild.id)
		tools.sendCatch(channel, messages.getChannelsString(channels, lang));
    }

    else if (messageContent.startsWith(`${prefix}delayq`)) { // delayquestion [ADMIN]
		if (args[1] <= 1800000 && args[1] >= 2500 && tools.isInt(args[1])) {
			db.setSetting(guild.id, "questionDelay", Number(args[1]));
			tools.sendCatch(channel, lm.getString("settings.questionDelaySet", lang, {delay:args[1]}));
		} else {
			tools.sendCatch(channel, lm.getString("settings.questionDelayError", lang));
		}
    }

    else if (messageContent.startsWith(`${prefix}delaya`)) { // delayanswer [ADMIN]
		if (args[1] <= 50000 && args[1] >= 500 && tools.isInt(args[1])) {
			db.setSetting(guild.id, "answerDelay", Number(args[1]));
			tools.sendCatch(channel, lm.getString("settings.answerDelaySet", lang, {delay:args[1]}));
		} else {
			tools.sendCatch(channel, lm.getString("settings.answerDelayError", lang));
		}
    }

    else if (messageContent.startsWith(`${prefix}defd`)) { // defaultdifficulty [ADMIN]
		if (args[1] <= 3 && args[1] >= 0 && tools.isInt(args[1])) {
			db.setSetting(guild.id, "defaultDifficulty", Number(args[1]));
			tools.sendCatch(channel, lm.getString("settings.difficultySet", lang, {difficulty:args[1]}));
		} else {
			tools.sendCatch(channel, lm.getString("settings.difficultyError", lang));
		}
    }

    else if (messageContent.startsWith(`${prefix}defq`)) { // defaultquestions [ADMIN]
		if (args[1] <= 100 && args[1] >= 1 && tools.isInt(args[1])) {
			db.setSetting(guild.id, "defaultQuestionsAmount", Number(args[1]));
			tools.sendCatch(channel, lm.getString("settings.questionsAmountSet", lang, {amount:args[1]}));
		} else {
			tools.sendCatch(channel, lm.getString("settings.questionsAmountError", lang));
		}
    }

	else if (messageContent.startsWith(`${prefix}lang`)) { // lang [ADMIN]
		const langs = lm.getLocales();
		const commandLang = (args[1] || "").substring(0, 2);
		if (langs.includes(commandLang)) {
			db.setSetting(guild.id, "lang", commandLang);
			tools.sendCatch(channel, lm.getString("settings.langSet", lang, {lang:commandLang}));
		} else {
			tools.sendCatch(channel, lm.getString("settings.langError", lang, {lang:commandLang, langs:langs}));
		}
    }

    else if (messageContent.startsWith(`${prefix}admin`)) { // admin [ADMIN]
		tools.sendCatch(channel, lm.getAdminHelpEmbed(lang, prefix));
    }



	// #################################################### OWNER COMMANDS #################################################### //
	// If owner allowed to send the command
	if (message.author.id != OWNER_ID) return;
	// #################################################### OWNER COMMANDS #################################################### //



    if (messageContent.startsWith(`${prefix}kill`)) { // kill [OWNER]
		exitHandler({cleanup:true}, null);
    }

    // This function is NOT USED TO LOG THE CONTENT OF THE MESSAGES
    // But only tell a message is received
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
		var guilds = client.guilds.cache;
		var users = 0;
		for (var g of guilds) {
			var templang = await db.getSetting(g[0], "lang");
			var members = g[1].memberCount;
			users += members;
			logger.debug("[" + g[0] + "] (" + templang + ") (" + members + " users) " + g[1].name);
		}
		logger.debug("Total users: " + users);
		logger.debug("Total servers: " + guilds.size);
    }

	else if (messageContent.startsWith(`${prefix}status`)) { // status [OWNER]
		var newStatus = messageContent.replace(`${prefix}status `, "");
		client.user.setActivity(newStatus);
		logger.info("Status changed to: " + newStatus);
    }
});
// ---------------------------------------------- LISTENERS ---------------------------------------------- //



// ----------------- START ----------------- //
function restoreCachedGames() {
	if (!fs.existsSync("cache")) {
		fs.mkdirSync("cache");
	} else {
		fs.readdir("./cache", function (err, files) {
			if (err) logger.error(err);
			for (file of files) {
				let gameData = fs.readFileSync('cache/' + file);
				let game = gameManager.restoreClassicGame(db, file.split('.').slice(0, -1).join('.'), gameData);
			}
		});
	}
}

async function start() {
	await db.init(); // Connect database
	await lm.init(); // Load languages
	logger.info("Connecting to Discord...");
	await client.login(config.token);
}

client.once('ready', async function () {
	client.user.setActivity(ACTIVITY_MESSAGE);
	apiManager.init();
	logger.info('Bot ready');
	restoreCachedGames();
});

start();
// ----------------- START ----------------- //
