
// -------------------- SETTINGS -------------------- //
const reactionsTable = ['🇦', '🇧', '🇨', '🇩'];
// -------------------- SETTINGS -------------------- //



// ------------------------------ SOME VARIABLES ------------------------------ //
const messages = require('./messages.js');
const NodeCache = require("node-cache");
const tools = require('./tools.js');
const logger = require('./logger.js');
const cacheTTL = 60 * 60 * 4; // 4 hour
const cache = new NodeCache({ stdTTL: cacheTTL, checkperiod: 60 * 5 });
const colors = { 1: 4652870, 2: 16750869, 3: 15728640 };
const fs = require('fs');
// ------------------------------ SOME VARIABLES ------------------------------ //



// ----------------------------------- SOME FUNCTIONS ----------------------------------- //
async function delay(ms) {
    // return await for better async stack trace support in case of errors.
    return await new Promise(resolve => setTimeout(resolve, ms));
}

function delayChecking(guildID, ms) {
	return new Promise(async function (resolve, reject) {
		// This way if the game is force stopped it will leave the current question
		var waitingTime = ms / (15000 + (ms/100*10)) * 1000 // The higher the question delay, the lower the checking
		for (var i = 0; i < ms; i += waitingTime) {
			let guildCache = cache.get(guildID) || {};
			if (guildCache.running == 1) break; // 1 = Waiting for stop
			await delay(waitingTime);
		}
		resolve();
	});
}

function replacer(key, value) {
  if(value instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(value.entries()), // or with spread: value: [...value]
    };
  } else {
    return value;
  }
}

function reviver(key, value) {
  if(typeof value === 'object' && value !== null) {
    if (value.dataType === 'Map') {
      return new Map(value.value);
    }
  }
  return value;
}

function countPoints(guild, channel, lang) {
    const guildID = guild.id;
	const guildCache = cache.get(guildID) || {};
    var scoreTable = guildCache.score;
    winners = messages.getScoreString(guild, scoreTable, lang);
    // db.updateUserStats(guild, winnerID, 0, 1); <- INSIDE getScoreString function
    tools.sendCatch(channel, lm.getEb(lang).getGameEndedEmbed(winners));
}

function getGoodAnswerLetter(proposals, goodAnswer) {
    for (var i = 0; i < proposals.length; i++) { // For each answer
        if (proposals[i] == goodAnswer) { // If good answer
            return reactionsTable[i];
        }
    }
    return 'Err';
}

async function getGoodAnswerPlayers(message, proposals, goodAnswer) {
	try {
		var badAnswerUsers = new Map();
		var goodAnswerUsers = new Map();
		for (var i = 0; i < proposals.length; i++) { // For each proposition
			const reaction = reactionsTable[i]; // Get reaction
			if (proposals[i] == goodAnswer) { // If good answer
				goodAnswerUsers = await message.reactions.cache.get(reaction).users.cache; // Get users that reacted with [reaction]
			} else { // Else if wrong answer
				const badUsers = await message.reactions.cache.get(reaction).users.cache; // Get all users that reacted with [reaction]
				const iterator = badUsers.keys();
				for (let userID of iterator) { // For each user that reacted with [reaction]
					const user = badUsers.get(userID); // Get user
					badAnswerUsers.set(userID, user); // Add him to the bad answer table
				}
			}
		}
		var userNumber = 0;
		var wonPlayers = [];
		const goodIterator = goodAnswerUsers.keys();
		for (let goodUserID of goodIterator) { // For each user that answered correctly
			const goodUser = goodAnswerUsers.get(goodUserID); // Get user
			if (!badAnswerUsers.has(goodUserID)) { // If he is not in bad users list
				wonPlayers[userNumber] = goodUser;
				userNumber++;
			}
		}
		return wonPlayers;
	} catch (error) { return []; }
}
// ----------------------------------- SOME FUNCTIONS ----------------------------------- //



// ----------------------------------- GAME ----------------------------------- //
// We first do a for loop that asks for all the questions and give the answers
// it also add the points of the user to the database each time, this way in
// case of crash, the points are kept. Not forgeting to update the cache to avoid
// it from being cleared automatically.
// Then we exit the loop when the game ends and we calculate the total points
// + the winner. The game as ended we can clear the cache.
async function startGame(guild, channel, difficulty, qAmount, lang, qNumberRestore) {
    const guildID = guild.id;
	const dataSavePath = "cache/" + guildID + '.json';
	
	var qDelay = await db.getSetting(guildID, "questionDelay");
	var aDelay = await db.getSetting(guildID, "answerDelay");
	
    logger.info("-------------- NEW GAME --------------");
	logger.info("Server ID: " + guild.id);
    logger.info("Server: " + guild.name + " (" + guild.memberCount + " users)");
    logger.info("Questions delay: " + qDelay);
    logger.info("Answers delay: " + aDelay);
    logger.info("Questions amount: " + qAmount);
    logger.info("Language: " + lang);
    await tools.sendCatch(channel, lm.getEb(lang).getStartEmbed(difficulty, qAmount));
	
	// ASK QUESTIONS
    for (var qNumber = qNumberRestore || 1; qNumber <= qAmount; qNumber++) {
        logger.info("------------ NEW QUESTION ------------ (" + qNumber + "/" + qAmount + ")");
		
		// This way users can update a setting while the game has already started!
		qDelay = await db.getSetting(guildID, "questionDelay");
		aDelay = await db.getSetting(guildID, "answerDelay");
		lang = await db.getSetting(guildID, "lang");

		if ((cache.get(guildID) || {}).running == 1) { // 1 = Waiting for stop
            tools.sendCatch(channel, lm.getEb(lang).getGameStoppedEmbed());
            break;
        }

		try {
			// It asks one question and gives the answser + points calculation
			await newQuestionAnswer(channel, difficulty, qAmount, qNumber, qDelay, aDelay, lang, guildID);
		} catch (error) {
			logger.error(error);
			logger.error("Error: ending game...");
			tools.sendCatch(channel, lm.getString("error", lang));
			var guildCache = cache.get(guildID);
			guildCache.running = 1;
			cache.set(guildID, guildCache); // Stop the game asap
		}

		var guildCache = cache.get(guildID);
		if (fs.existsSync(dataSavePath)) {
			let gameSaveData = JSON.parse(fs.readFileSync(dataSavePath), reviver);
			gameSaveData.cache = guildCache;
			gameSaveData.data.qNumber = qNumber + 1;
			fs.writeFileSync(dataSavePath, JSON.stringify(gameSaveData, replacer));
			logger.info("Updated game state json");
		} else {
			logger.warn("Game state json not found");
		}
    }
	if (fs.existsSync(dataSavePath)) fs.unlinkSync(dataSavePath); // Remove the save file
    await countPoints(guild, channel, lang);
    var guildCache = cache.get(guildID);
	delete guildCache.player;
	delete guildCache.channel;
	delete guildCache.score;
	guildCache.running = 0;
	cache.set(guildID, guildCache);
    logger.info("Cache cleared");
}



async function newQuestionAnswer(channel, difficulty, qAmount, qNumber, qDelay, aDelay, lang, guildID) {
	var qData = await lm.request(lang, difficulty);
	qData["qNumber"] = qNumber;
	qData["qAmount"] = qAmount;
	if (!qData) throw ("No question found");

	logger.info("Answer: " + qData.answer);
	const qMessage = await tools.sendCatch(channel, lm.getEb(lang).getQuestionEmbed(qData, qDelay / 1000, colors[qData.points]));
	if (!qMessage) throw new Error("Error: can't send question message");
	for (var i = 0; i < reactionsTable.length; i++) {
		if (!await tools.reactCatch(qMessage, reactionsTable[i])) break;
	}

	await delayChecking(guildID, qDelay); // Wait for qDelay so people have time to answer
	await giveAnswer(qMessage, qData, aDelay, lang, guildID);
}



async function giveAnswer(qMessage, qData, aDelay, lang, guildID) {
	const goodAnswerLetter = getGoodAnswerLetter(qData.proposals, qData.answer);
	const goodAnswerPlayers = await getGoodAnswerPlayers(qMessage, qData.proposals, qData.answer);
	await tools.editCatch(qMessage, lm.getEb(lang).getQuestionEmbed(qData, 0, 4605510));
	const playersString = messages.getPlayersString(goodAnswerPlayers, lang);
	const aMessage = await tools.sendCatch(qMessage.channel, lm.getEb(lang).getAnswerEmbed(goodAnswerLetter, qData.answer, qData.anecdote, playersString, 16750869));
	for (var i = 0; i < goodAnswerPlayers.length; i++) { // For each player that answered correctly
		const user = goodAnswerPlayers[i];
		const userID = user.id;
		// DATABASE
		db.updateUserStats(qMessage.guild.id, user.id, user.username, qData.points, 0); // Set user points number
		// CACHE
		var guildCache = cache.get(guildID);
		const userScore = guildCache.score.get(userID) || 0;
		var newScore = Number(userScore) + Number(qData.points);
		guildCache.score.set(userID, newScore);
		cache.set(guildID, guildCache);
	}
	await delayChecking(guildID, aDelay); // Wait for aDelay so people have time to answer
	await tools.editCatch(aMessage, lm.getEb(lang).getAnswerEmbed(goodAnswerLetter, qData.answer, qData.anecdote, playersString, 4605510));
}
// ----------------------------------- GAME ----------------------------------- //



// ----------------------------------- PRESTART / STOP ----------------------------------- //
module.exports = {
	unstuck: async function (message, lang) {
        const guildID = message.guild.id;
		const guildCache = cache.get(guildID);
        const channel = message.channel;
		if (!guildCache) { await tools.sendCatch(channel, lm.getString("noGameRunning", lang)); return; }
        if (guildCache.player == message.author.id || message.guild.member(message.author).hasPermission("MANAGE_MESSAGES")) {
			if (guildCache.running == 0) { // If no game already running
				tools.sendCatch(channel, lm.getString("noGameRunning", lang));
				return;
			}
			guildCache.running = 0;
			cache.set(guildID, guildCache); // 0 = Stop the game now
			logger.info("Game aborted");
			tools.sendCatch(channel, lm.getString("useAgain", lang));
		}
    },



    stop: function (message, reason, lang) {
        const guildID = message.guild.id;
		const guildCache = cache.get(guildID);
        const channel = message.channel;
        if (guildCache.running < 2) { // If no game running (2 = Game running)
            tools.sendCatch(channel, lm.getEb(lang).getNoGameRunningEmbed());
            return;
        }
        if (guildCache.player == message.author.id || message.guild.member(message.author).hasPermission("MANAGE_MESSAGES") || message.author.id == 137239068567142400) {
            guildCache.running = 1;
			cache.set(guildID, guildCache); // 1 = Waiting for stop
            tools.sendCatch(channel, lm.getEb(lang).getStopEmbed(reason));
            logger.info("Game aborted");
        } else {
            tools.sendCatch(channel, lm.getEb(lang).getWrongPlayerStopEmbed());
        }
    },



	stopAll: function () {
		return new Promise(async function (resolve, reject) {
			cache.set("stopScheduled", 1); // Prevent people from starting a game
			var guilds = client.guilds;
			for(var i = 1; i != -1; i--) {
				for (let guild of guilds.values()) {
					const guildID = guild.id;
					const lang = await db.getSetting(guild.id, "lang");
					const guildCache = cache.get(guildID);
					if (guildCache.running >= 1) {
						const channelID = guildCache.channel;
						const channel = client.channels.get(channelID);
						if (i != 0) tools.sendCatch(channel, lm.getString("maintenanceScheduled", lang, {minutes:i}));
						else tools.sendCatch(channel, lm.getString("maintenance", lang));
					}
				}
				logger.warn("Bot stopping in " + i + " minutes...");
				if (i == 0) {await delay(5000); process.exit();}
				await delay(60000);
			}
		});
    },

	
	
	restoreGame: async function(rawdata) {
		const data = JSON.parse(rawdata, reviver);

		const gameData = data.data;
		const cacheData = data.cache;
		const guildID = gameData.guildID;

		logger.info("Restoring game for guild " + guildID);

		const guild = await client.guilds.fetch(guildID);
		const channel = await guild.channels.cache.get(cacheData.channel);
		
		if (guild && channel) {
			cache.set(guildID, cacheData);
			tools.sendCatch(channel, lm.getString("gameRestored", gameData.lang));
			startGame(guild, channel, gameData.difficulty, gameData.qAmount, gameData.lang, gameData.qNumber);
			logger.success("Restoring game for guild " + guildID + " succeed");
		}
		else {
			logger.warn("Restoring failed");
		}
	},
	
	

    preStart: async function (message, args, lang) {
        const guild = message.guild;
        const guildID = guild.id;
		const guildCache = cache.get(guildID) || {};
        const channel = message.channel;
		var questionsAmount;
		var difficulty;

		if (cache.get("stopScheduled") == 1) { // If no stop scheduled
			tools.sendCatch(channel, lm.getString("tryAgainLater", lang));
			return;
		}
		if (guildCache.running >= 1) { // If no game already running
            tools.sendCatch(channel, lm.getEb(lang).getAlreadyRunningEmbed(guildCache.channel));
            return;
        }

		// If / Not below 0 / Not above 3 / Is an int and is not null
		if (args[1] < 0 || args[1] > 3 || !tools.isInt(args[1]) && args[1] != null) {
			tools.sendCatch(channel, lm.getEb(lang).getBadDifEmbed());
            return;
		}
		else { // Mean it's null
			difficulty = args[1] || await db.getSetting(guild.id, "defaultDifficulty") || 0;
		}

		// If / Not below 1 / Not above 100 / Is an int and is not null / Is not equal to 0
		if ((args[2] < 1 || args[2] > 100 || !tools.isInt(args[2]) && args[2] != null) && args[2] != 0) {
			tools.sendCatch(channel, lm.getEb(lang).getBadQuesEmbed());
            return;
		}
		else { // Mean it's null
			questionsAmount = args[2] || await db.getSetting(guild.id, "defaultQuestionsAmount") || 10;
			if (questionsAmount == 0) {
				if (message.guild.member(message.author).hasPermission("MANAGE_MESSAGES")) questionsAmount = 2147483647;
			}
		}

        // 0 = Stopped / 1 = Waiting for stop / 2 = Game running
		gameCacheData = {
			runing: 2,
			player: message.author.id,
			channel: channel.id,
			score: new Map()
		};
		cache.set(guildID, gameCacheData);
		
		dataSave = {
			data: {
				guildID: guildID,
				qAmount: questionsAmount,
				difficulty: difficulty,
				lang: lang
			},
			cache: gameCacheData
		}

		fs.writeFileSync("cache/" + guildID + '.json', JSON.stringify(dataSave, replacer));
		logger.info("Saved game state in json");

        startGame(guild, channel, difficulty, questionsAmount, lang);
    }
}
// ----------------------------------- PRESTART / STOP ----------------------------------- //
