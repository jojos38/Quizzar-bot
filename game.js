
// -------------------- SETTINGS -------------------- //
const reactionsTable = ['🇦', '🇧', '🇨', '🇩'];
// -------------------- SETTINGS -------------------- //



// ------------------------------ SOME VARIABLES ------------------------------ //
const config = require('./config.json');
const messages = require('./messages.js');
const NodeCache = require("node-cache");
const tools = require('./tools.js');
const request = require('request');
const db = require('./database.js');
const logger = require('./logger.js');
const entities = require('html-entities').Html5Entities;
const eb = {"en": require('./locales/embeds/en.js'), "fr": require('./locales/embeds/fr.js')};
const fs = require('fs');
const files = fs.readdirSync('./resources/') // Get all files in resource folder
const cacheTTL = 60 * 60 * 4; // 4 hour
const cache = new NodeCache({ stdTTL: cacheTTL, checkperiod: 60 * 5 });
const colors = { 1: 4652870, 2: 16750869, 3: 15728640 };
// ------------------------------ SOME VARIABLES ------------------------------ //



// ----------------------------------- SOME FUNCTIONS ----------------------------------- //
async function delay(ms) {
    // return await for better async stack trace support in case of errors.
    return await new Promise(resolve => setTimeout(resolve, ms));
}

function countPoints(guild, channel, lang) {
    const guildID = guild.id;
    var scoreTable = cache.get(guildID + "score");
    winners = messages.getScoreString(guild, scoreTable, lang);
    // db.updateUserStats(guild, winnerID, 0, 1); <- INSIDE getScoreString function
    tools.sendCatch(channel, eb[lang].getGameEndedEmbed(winners));
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function getRandomFile() {
    const filesNumber = files.length; // Get files number
    const randomFile = files[getRandomInt(filesNumber)]; // Pick one randomly
	logger.info("File: " + randomFile);
    return require('./resources/' + randomFile);
}

function getRandomQuestion(file, difficulty) {
    var difficultyString = "";
    difficulty = parseInt(difficulty);
    if (difficulty == 0) difficulty = 1 + getRandomInt(3); // Get random difficulty between 1 and 3 if it's 0
    switch (difficulty) {
        case 1: difficultyString = "débutant"; break;
        case 2: difficultyString = "confirmé"; break;
        case 3: difficultyString = "expert"; break;
		default: difficultyString = "débutant"; break; // Should not happen
    }
    const questionCategory = file.quizz[difficultyString];
    const question = questionCategory[getRandomInt(questionCategory.length)];
    return { 0: question, 1: difficultyString, 2: difficulty };
}

function getRandomQuestionAPI(difficulty) {
	return new Promise(async function (resolve, reject) {
		if (difficulty == 0) difficulty = 1 + getRandomInt(3); // Get random difficulty between 1 and 3 if it's 0
		switch (difficulty) {
			case 1: difficultyString = "easy"; break;
			case 2: difficultyString = "medium"; break;
			case 3: difficultyString = "hard"; break;
			default: difficultyString = "easy"; break; // Should not happen
		}
		request({url: 'https://opentdb.com/api.php?amount=1&difficulty=' + difficultyString + '&type=multiple', json: true}, function(err, res, json) {
			if (err) { reject(err); return; }
			if (!json.results) { reject(null); return; }
			const result = json.results[0];
			const answer = entities.decode(result.correct_answer);
			var proposals = [
				answer,
				entities.decode(result.incorrect_answers[0]),
				entities.decode(result.incorrect_answers[1]),
				entities.decode(result.incorrect_answers[2])
			];
			proposals = tools.shuffle(proposals);
			const qData = {
				theme: result.category,
				difficulty: result.difficulty,
				question: entities.decode(result.question),
				proposals: proposals,
				answer: answer,
				anecdote: "",
				points: difficulty
			};
			resolve(qData);
			return;
		});
	});
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
				goodAnswerUsers = await message.reactions.get(reaction).fetchUsers(); // Get users that reacted with [reaction]
			} else { // Else if wrong answer
				const badUsers = await message.reactions.get(reaction).fetchUsers(); // Get all users that reacted with [reaction]
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

async function startGame(message, difficulty, qAmount, lang) {
    const channel = message.channel;
    const guildID = message.guild.id;
    const qDelay = await db.getSetting(guildID, "questiondelay");
    const aDelay = await db.getSetting(guildID, "answerdelay");
    logger.info("-------------- NEW GAME --------------");
	logger.info("Server ID: " + message.guild.id);
    logger.info("Server: " + message.guild.name + " (" + message.guild.memberCount + " users)");
    logger.info("Questions delay: " + qDelay);
    logger.info("Answers delay: " + aDelay);
    logger.info("Questions amount: " + qAmount);
    logger.info("Language: " + lang);
    await tools.sendCatch(channel, eb[lang].getStartEmbed(difficulty, qAmount));
    for (var qNumber = 1; qNumber <= qAmount; qNumber++) { // Ask questions
        logger.info("------------ NEW QUESTION ------------ (" + qNumber + "/" + qAmount + ")");
		
		// Update the cache	to avoid it from clearing the values on a game
		// that would last for a too period
		cache.set(guildID + "running", cache.get(guildID + "running"));
		cache.set(guildID + "player", cache.get(guildID + "player"));
		cache.set(guildID + "score", cache.get(guildID + "score"));
		cache.set(guildID + "channel", cache.get(guildID + "channel"));
		
		try {
			// It asks one question and gives the answser + points calculation
			await newQuestionAnswer(channel, difficulty, qAmount, qNumber, qDelay, aDelay, lang);
		} catch (error) {
			logger.error(error);
			logger.error("Error: ending game...");
			tools.sendCatch(message.channel, tools.getString("error", lang));
			cache.set(guildID + "running", 1); // Stop the game asap
		}
		if (cache.get(guildID + "running") == 1) { // 1 = Waiting for stop
            tools.sendCatch(message.channel, eb[lang].getGameStoppedEmbed());
            break;
        }
    }
    await countPoints(message.guild, channel, lang);
    cache.del(guildID + "player");
    cache.del(guildID + "channel");
    cache.del(guildID + "score");
	cache.set(guildID + "running", 0);
    logger.info("Cache cleared");
}

async function newQuestionAnswer(channel, difficulty, qAmount, qNumber, qDelay, aDelay, lang) {
	var qData;
	if (lang == "fr") { // This sucks, should be improved
		const file = getRandomFile();
		const qRaw = getRandomQuestion(file, difficulty);
		qData = {
			theme: file.thème,
			difficulty: qRaw[1],
			question: qRaw[0].question,
			proposals: qRaw[0].propositions,
			answer: qRaw[0].réponse,
			anecdote: qRaw[0].anecdote,
			points: qRaw[2],
			qNumber: qNumber,
			qAmount: qAmount
		};
	} else { // And this sucks even more
		qData = await getRandomQuestionAPI(difficulty);
		if (!qData) tools.sendCatch(channel, "An error happenned, skipping question...");
		qData['qNumber'] = qNumber;
		qData['qAmount'] = qAmount;
	}

	if (!qData) throw ("No question found");

	logger.info("Answer: " + qData.answer);
	const qMessage = await tools.sendCatch(channel, eb[lang].getQuestionEmbed(qData, qDelay / 1000, colors[qData.points]));
	if (!qMessage) throw new Error("Error: can't send question message");
	for (var i = 0; i < reactionsTable.length; i++) {
		if (!await tools.reactCatch(qMessage, reactionsTable[i])) break;
	}
	await delay(qDelay); // Wait x seconds before giving answer
	await giveAnswer(qMessage, qData, aDelay, lang);
}

async function giveAnswer(qMessage, qData, aDelay, lang) {
	// 0:thème / 1:difficulté / 2:question / 3:propositions / 4:réponse / 5:anecdote / 6:points / 7:num.ques / 8:tot.ques
	const goodAnswerLetter = getGoodAnswerLetter(qData.proposals, qData.answer);
	const goodAnswerPlayers = await getGoodAnswerPlayers(qMessage, qData.proposals, qData.answer);
	await tools.editCatch(qMessage, eb[lang].getQuestionEmbed(qData, 0, 4605510));
	const playersString = messages.getPlayersString(goodAnswerPlayers, lang);
	const aMessage = await tools.sendCatch(qMessage.channel, eb[lang].getAnswerEmbed(goodAnswerLetter, qData.answer, qData.anecdote, playersString, 16750869));
	for (var i = 0; i < goodAnswerPlayers.length; i++) { // For each player that answered correctly
		const user = goodAnswerPlayers[i];
		const guildID = qMessage.guild.id;
		const userID = user.id;
		// DATABASE
		db.updateUserStats(qMessage.guild.id, user.id, user.username, qData.points, 0); // Set user points number
		// CACHE
		var scoreTable = cache.get(guildID + "score");
		const userScore = scoreTable.get(userID) || 0;
		var newScore = Number(userScore) + Number(qData.points);
		scoreTable.set(userID, newScore);
		cache.set(guildID + "score", scoreTable);
	}
	await delay(aDelay); // Wait x seconds before going to the next question
	await tools.editCatch(aMessage, eb[lang].getAnswerEmbed(goodAnswerLetter, qData.answer, qData.anecdote, playersString, 4605510));
}
// ----------------------------------- GAME ----------------------------------- //



// ----------------------------------- PRESTART / STOP ----------------------------------- //
module.exports = {
	unstuck: function (message, lang) {
        const guildID = message.guild.id;
        const channel = message.channel;
        if (cache.get(guildID + "player") == message.author.id || message.guild.member(message.author).hasPermission("MANAGE_MESSAGES")) {
			if (cache.get(guildID + "running") == 0) { // If no game already running
				tools.sendCatch(channel, tools.getString("noGameRunning", lang));
				return;
			}
			cache.set(guildID + "running", 0); // 0 = Stop the game now
			logger.info("Game aborted");
			tools.sendCatch(channel, tools.getString("useAgain", lang));
		}
    },
	
    stop: function (message, reason, lang) {
        const guildID = message.guild.id;
        const channel = message.channel;
        if (!cache.get(guildID + "running") >= 1) { // If no game running (2 = Game running)
            tools.sendCatch(channel, eb[lang].getNoGameRunningEmbed());
            return;
        }
        if (cache.get(guildID + "player") == message.author.id || message.guild.member(message.author).hasPermission("MANAGE_MESSAGES") || message.author.id == 137239068567142400) {
            cache.set(guildID + "running", 1); // 1 = Waiting for stop
            tools.sendCatch(channel, eb[lang].getStopEmbed(reason));
            logger.info("Game aborted");
        } else {
            tools.sendCatch(channel, eb[lang].getWrongPlayerStopEmbed());
        }
    },
	
	stopAll: function (client) {
		return new Promise(async function (resolve, reject) {
			cache.set("stopscheduled", 1);
			var guilds = client.guilds;
			for(var i = 3; i != -1; i--) {
				for (let guild of guilds.values()) {
					const guildID = guild.id;
					const lang = await db.getSetting(guild.id, "lang");
					if (cache.get(guildID + "running") >= 1) {
						const channelID = cache.get(guildID + "channel");
						const channel = client.channels.get(channelID);
						if (i != 0) tools.sendCatch(channel, tools.getString("maintenanceScheduled", lang, {minutes:i}));
						else tools.sendCatch(channel, tools.getString("maintenance", lang));
					}
				}
				logger.warn("Bot stopping in " + i + " minutes...");
				if (i == 0) {await delay(5000); process.exit();}
				await delay(60000);
			}
		});
    },

    preStart: async function (message, args, lang) {
        const guild = message.guild;
        const guildID = guild.id;
        const channel = message.channel;
		var questionsAmount;
		var difficulty;
		
		if (cache.get("stopscheduled") == 1) { // If no stop scheduled
			tools.sendCatch(channel, tools.getString("tryAgainLater", lang));
			return;
		}
		if (cache.get(guildID + "running") >= 1) { // If no game already running
            tools.sendCatch(channel, eb[lang].getAlreadyRunningEmbed(cache.get(guildID + "channel")));
            return;
        }

		// If / Not below 0 / Not above 3 / Is an int and is not null
		if (args[1] < 0 || args[1] > 3 || !tools.isInt(args[1]) && args[1] != null) {
			tools.sendCatch(channel, eb[lang].getBadDifEmbed());
            return;
		}
		else { // Mean it's null
			difficulty = args[1] || await db.getSetting(guild.id, "defaultdifficulty") || 0;
		}
		
		// If / Not below 1 / Not above 100 / Is an int and is not null / Is not equal to 0
		if ((args[2] < 1 || args[2] > 100 || !tools.isInt(args[2]) && args[2] != null) && args[2] != 0) {
			tools.sendCatch(channel, eb[lang].getBadQuesEmbed());
            return;
		}
		else { // Mean it's null
			questionsAmount = args[2] || await db.getSetting(guild.id, "defaultquestionsamount") || 10;
			if (questionsAmount == 0) {
				if (message.guild.member(message.author).hasPermission("MANAGE_MESSAGES") || message.author.id == 137239068567142400) questionsAmount = 2147483647;
			}
		}

        // 0 = Stopped / 1 = Waiting for stop / 2 = Game running
        cache.set(guildID + "running", 2);
        cache.set(guildID + "player", message.author.id);
        cache.set(guildID + "channel", channel.id);
        cache.set(guildID + "score", new Map());

        startGame(message, difficulty, questionsAmount, lang);
    }
}
// ----------------------------------- PRESTART / STOP ----------------------------------- //
