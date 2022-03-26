/**
 * @file Entry point, permissions, commands
 * @author jojos38
 */



// -------------------- SETTINGS -------------------- //
const OWNER_ID = 137239068567142400;
const ACTIVITY_MESSAGE = "/help";
let logMessages = false;
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
const {Client, Intents} = require('discord.js');
global.client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]});
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
	console.log('OK');
	console.log(channels);
	for (let i = 0; i < channels.length; i++) // For each channel
		if (channels[i].channelID == channelID) return true; // If message is sent from allowed channel then return
	return false;
}

async function isAllowed(interaction, lang) {
	// Owner perms
	if (interaction.user.id === OWNER_ID) return true;

	// Moderator perms
	if (await isModeratorAllowed(interaction)) return true;

	// Channel perm
	if (await channelAllowed(interaction.guildId, interaction.channelId)) return true;

	// If we went there is that the user is not allowed since previous for loop should return
	const channels = await db.getGuildChannels(interaction.guildId);
	await tools.replyCatch(interaction, lm.getNotAllowedEmbed(lang, messages.getChannelsString(channels, lang)), 1, true);
	return false;
}

async function isModeratorAllowed(message) {
	if (message.user.id === OWNER_ID) return true;
	// Checking
	if (!message) return false;
	const member = message.member || message.guild.member(message.author);
	if (!member) return false;

	// Admin perms
	return member.permissions.has('MANAGE_GUILD');
}

/**
 * Add or remove a channel from the eyes of Observation
 * @param add Either the channel will be added or removed (true / false)
 * @param channel The channel to add or remove
 * @returns {Promise<string>}
 */
async function updateChannelDB(add, channel) {
	if (channel.type === 'GUILD_TEXT') {
		const success = add ? db.addGuildChannel(channel.guild.id, channel.id) : db.removeGuildChannel(channel.id);
		return add ? (success ? 'settings.channelAdded' : 'settings.alreadyAuthorized') : (success ? 'settings.channelDeleted' : 'settings.channelNotInList');
	}
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

client.on('interactionCreate', async function(interaction) {
	if (!interaction.member || !interaction.guild || interaction.user.bot) return; // Make all checks
	if (interaction.isButton()) {
		const customID = interaction.customId;
		const lang = await db.getSetting(interaction.guildId, 'lang');
		// Admin commands
		if (!await isAllowed(interaction, lang)) {
			await tools.replyCatch(interaction, lm.getString('noPermission', lang), 0, true);
			return
		}
		switch (customID) {
			case 'resetConfirm':
				await db.resetGuildSettings(interaction.guildId);
				await tools.replyCatch(interaction, lm.getString('settings.resetted', lang), 0, true);
				break;
			case 'resetCancel':
				await tools.replyCatch(interaction, lm.getString('settings.resetCancel', lang), 0, true);
				break;
		}
	}

	if (interaction.isCommand()) {
		const cmd = interaction.commandName;
		const lang = await db.getSetting(interaction.guildId, 'lang');

		// #################################################### USER COMMANDS #################################################### //
		// If allowed to send the command
		if (!await isAllowed(interaction, lang)) return;
		// #################################################### USER COMMANDS #################################################### //

		// User commands
		switch (cmd) {
			case 'help':
				await tools.replyCatch(interaction, lm.getHelpEmbed(lang), 1, true);
				break;
			case 'admin':
				await tools.replyCatch(interaction, lm.getAdminHelpEmbed(lang), 1, true);
				break;
			case 'stats': {
				let userStats = await db.getUserStats(interaction.guildId, interaction.user.id);
				await tools.replyCatch(interaction, lm.getUserStatsEmbed(lang, userStats), 1, false);
				break;
			}
			case 'info': {
				const guilds = client.guilds.cache;
				let users = 0;
				guilds.forEach(g => {
					users += g.memberCount;
				});
				const uptime = process.uptime();
				await tools.replyCatch(interaction, lm.getInfoEmbed(lang, users, guilds.size, tools.format(uptime)), 1, false);
				break;
			}
			case 'play': { // play
				const difficulty = interaction.options.getInteger('difficulty');
				const questions = interaction.options.getInteger('questions');
				if (!gameManager.running(interaction.channelId))
					gameManager.startClassicGame(db, interaction.guild, interaction.channel, interaction.user.id, lang, [difficulty, questions]);
				else
					await tools.replyCatch(interaction, lm.getAlreadyRunningEmbed(lang, interaction.channelId), 1, true);
				await tools.replyCatch(interaction, 'Ok!', 0, true);
				break;
			}
			case 'stop': {
				gameManager.stopGame(interaction.channel, interaction.member, lm.getString("game.stoppedBy", lang, {player: tools.mention(interaction.user.id, 'u')}), lang);
				await tools.replyCatch(interaction, 'Ok!', 0, true);
				break;
			}
			case 'globaltop': {
				let usersTable = [];
				const users = await db.getAllUsers();
				let totalUsers = users.length;
				let position = -1;
				const user = interaction.options.getUser('user');
				// If there is a user ID
				if (user) {
					// Get the ID from the message
					let userID = user.id;
					// Get the user position in the list
					for (let i = 0; i < totalUsers; i++) {
						let user = users[i];
						if (user.userID === userID) position = i;
					}
					if (position !== -1) {
						// Show the 5 above and before users
						if (position + 5 > totalUsers) position = totalUsers - 5;
						if (position - 5 < 0) position = 5;
						for (let i = position - 5; i < position + 5; i++) {
							let user = users[i];
							usersTable.push({
								score: user.score,
								won: user.won,
								position: i,
								username: getUserNickname(interaction.guild, user, i + 1)
							});
						}
					}
				} else {
					for (let i = 0; i < totalUsers; i++) {
						if (i >= 10) break;
						let user = users[i];
						usersTable.push({
							score: user.score,
							won: user.won,
							position: i + 1,
							username: getUserNickname(interaction.guild, user, i + 1)
						});
					}
				}
				if (totalUsers === 0 || (position === -1 && user))
					await tools.replyCatch(interaction, lm.getTopNoStatsEmbed(lang, totalUsers), 1, false);
				else
					await tools.replyCatch(interaction, lm.getTopEmbed(lang, totalUsers, usersTable, position), 1, false);
			}
		}

		// #################################################### MODERATOR COMMANDS #################################################### //
		// If moderator allowed to send the command
		if (!await isModeratorAllowed(interaction)) return;
		// #################################################### MODERATOR COMMANDS #################################################### //

		switch(cmd) {
			case 'channels':
				const channels = await db.getGuildChannels(interaction.guildId);
				await tools.replyCatch(interaction, await messages.getChannelsString(channels, lang), 0, true);
				break;
			case 'add':
			case 'remove':
				const channel = interaction.options.getChannel('channel');
				const result = await updateChannelDB(interaction.commandName === 'add', channel);
				interaction.reply(lm.getString(result, lang, {channel: '<#' + channel.id + '>'}));
				break;
			case 'language': {
				const botLang = interaction.options.getString('language');
				await db.setSetting(interaction.guildId, 'lang', botLang);
				await tools.replyCatch(interaction, lm.getString('settings.langSet', botLang, {lang: botLang}), 0, true);
				break;
			}
			case 'delayanswer': {
				const delay = interaction.options.getInteger('delay');
				await db.setSetting(interaction.guildId, "answerDelay", delay);
				await tools.replyCatch(interaction, lm.getString("settings.answerDelaySet", lang, {delay: delay}), 0, true);
				break;
			}
			case 'delayquestion': {
				const delay = interaction.options.getInteger('delay');
				await db.setSetting(interaction.guildId, "questionDelay", delay);
				await tools.replyCatch(interaction, lm.getString("settings.questionDelaySet", lang, {delay: delay}), 0, true);
				break;
			}
			case 'defdifficulty': {
				const difficulty = interaction.options.getInteger('difficulty');
				await db.setSetting(interaction.guildId, "defaultDifficulty", difficulty);
				await tools.replyCatch(interaction, lm.getString("settings.difficultySet", lang, {difficulty: difficulty}), 0, true);
				break;
			}
			case 'defquestions': {
				const questions = interaction.options.getInteger('questions');
				await db.setSetting(interaction.guildId, "defaultQuestionsAmount", questions);
				await tools.replyCatch(interaction, lm.getString("settings.questionsAmountSet", lang, {amount: questions}), 0, true)
				break;
			}
			case 'reset':
				await tools.replyCatch(interaction, {
					content: lm.getString('settings.resetConfirm', lang),
					components: [{
						type: 1,
						components: [
							{type: 2, label: 'Confirm', style: 4, custom_id: 'resetConfirm'},
							{type: 2, label: 'Cancel', style: 2, custom_id: 'resetCancel'}
						]
					}]
				}, 2, true);
				break;
		}
	}
});

client.on('messageCreate', async function (message) {
	console.log('ok');
	if (logMessages) logger.debug("Message received");

	// Check if the message is not a PM
	const guild = message.guild;
	if (!guild) return;

	// Check if the message is not from a bot
	if(message.author.bot) return;

	// Get guilds settings
	const {lang, prefix} = await db.getSettings(guild.id, ["prefix", "lang"])

	// Check if the message starts with the prefix
    if (!message.content.startsWith(`${prefix}`)) return; // If message doesn't start with / then return

	tools.sendCatch(message.channel, 'Messages commands are deprecated, please use slash (/) commands!\nIf you do not see the slash commands for Quizzar please ask for the bot to be re-invited using this link (DO NOT KICK THE BOT BEFORE RE-INVITING IT OVERWISE YOU WILL LOSE YOUR DATA, just invite it again even if it\'s already on the server!)\nhttps://discord.com/oauth2/authorize?client_id=586183772136013824&scope=applications.commands+bot&permissions=273488')
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
