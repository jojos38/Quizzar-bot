
// -------------------- SETTINGS -------------------- //
const reactionsTable = ['🇦', '🇧', '🇨', '🇩'];
// -------------------- SETTINGS -------------------- //



// ------------------------------ SOME VARIABLES ------------------------------ //
const config = require('./config.json');
const messages = require('./messages.js');
const NodeCache = require("node-cache");
const db = require('./database.js');
const eb = require('./' + config.lang + '.js');
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

function isInt(value) {
  return !isNaN(value) && parseInt(Number(value)) == value && !isNaN(parseInt(value, 10));
}

function sendCatch(channel, message) {
    try { return channel.send(message); }
    catch (error) { console.log("Error while sending message"); return null }
}

function countPoints(guild, channel) {
    const guildID = guild.id;
    var scoreTable = cache.get(guildID + "score");
    winners = messages.getScoreString(guild, scoreTable);
    // db.updateUserStats(guild, winnerID, 0, 1); <- INSIDE getWinString function
    sendCatch(channel, eb.getGameEndedEmbed(winners));
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function getRandomFile() {
    const filesNumber = files.length; // Get files number
    const randomFile = files[getRandomInt(filesNumber)]; // Pick one randomly
	console.log("File: " + randomFile);
    return require('./resources/' + randomFile);
}

function getRandomQuestion(file, difficulty) {
    var difficultyString = "";
    difficulty = parseInt(difficulty);
    if (difficulty == 0)
        difficulty = 1 + getRandomInt(3); // Get random difficulty between 1 and 3 if it's 0
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

function getGoodAnswerLetter(propositions, goodAnswer) {
    for (var i = 0; i < propositions.length; i++) { // For each answer
        if (propositions[i] == goodAnswer) { // If good answer
            return reactionsTable[i];
        }
    }
    return 'Err';
}

function getGoodAnswerPlayers(message, propositions, goodAnswer) {
    try {
        var badAnswerUsers = new Map();
        var goodAnswerUsers = new Map();
        for (var i = 0; i < propositions.length; i++) { // For each proposition
            const reaction = reactionsTable[i]; // Get reaction
            if (propositions[i] == goodAnswer) { // If good answer
                goodAnswerUsers = message.reactions.get(reaction).users; // Get users that reacted with [reaction]
            } else { // Else if wrong answer
                const badUsers = message.reactions.get(reaction).users; // Get all users that reacted with [reaction]
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
async function startGame(message, difficulty, qAmount) {
    const channel = message.channel;
    const guildID = message.guild.id;
    const qDelay = await db.getSetting(message.guild, "questiondelay");
    const aDelay = await db.getSetting(message.guild, "answerdelay");
	console.log("Server: " + message.guild.name);
    console.log("Questions delay:" + qDelay);
    console.log("Answers delay: " + aDelay);
	console.log("Questions amount: " + qAmount);
	await sendCatch(channel, eb.getStartEmbed(difficulty, qAmount));	
    for (var qNumber = 1; qNumber <= qAmount; qNumber++) { // Ask questions
        console.log("------------ NEW QUESTION ------------ (" + qNumber + "/" + qAmount + ")");    		
		try {
			// It asks question and gives answser
			await newQuestionAnswer(channel, difficulty, qAmount, qNumber, qDelay, aDelay);
		} catch (error) {
			console.log(error);
			console.log("Error: ending game...");
			sendCatch(message.channel, "Error hapenned, game stopped.");
			cache.set(guildID + "running", 1);
		}
		if (cache.get(guildID + "running") == 1) { // 1 = Waiting for stop
            sendCatch(message.channel, eb.getGameStoppedEmbed());
            break;
        }
    }
    await countPoints(message.guild, channel);
    cache.del(guildID + "player");
    cache.del(guildID + "channel");
    cache.del(guildID + "score");
	cache.set(guildID + "running", 0);
    console.log("Cache cleared");
}

async function newQuestionAnswer(channel, difficulty, qAmount, qNumber, qDelay, aDelay) {
	const file = getRandomFile();
	const qRaw = getRandomQuestion(file, difficulty);
	const qData = {
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
					
	console.log("Answer: " + qData.answer);
	const qMessage = await sendCatch(channel, eb.getQuestionEmbed(qData, qDelay / 1000, colors[qData.points]));
	if (!qMessage) throw new Error("Error: can't send question message");
	for (var i = 0; i < reactionsTable.length; i++) {
		try { await qMessage.react(reactionsTable[i]); } catch (error) { console.log(error); console.log("Error: can't put reaction"); break; }
	}
	await delay(qDelay); // Wait x seconds before giving answer
	await giveAnswer(qMessage, qData, aDelay);
}

async function giveAnswer(qMessage, qData, aDelay) {
	// 0:thème / 1:difficulté / 2:question / 3:propositions / 4:réponse / 5:anecdote / 6:points / 7:num.ques / 8:tot.ques        
	const goodAnswerLetter = getGoodAnswerLetter(qData.proposals, qData.answer);
	const goodAnswerPlayers = getGoodAnswerPlayers(qMessage, qData.proposals, qData.answer);
	try { await qMessage.edit(eb.getQuestionEmbed(qData, 0, 4605510)); } catch (error) { console.log(error); }
	sendCatch(qMessage.channel, eb.getAnswerEmbed(goodAnswerLetter, qData.answer, qData.anecdote, messages.getPlayersString(goodAnswerPlayers)));
	for (var i = 0; i < goodAnswerPlayers.length; i++) { // For each player that answered correctly
		const user = goodAnswerPlayers[i];
		const guildID = qMessage.guild.id;
		const userID = user.id;
		// DATABASE
		db.updateUserStats(qMessage.guild, user, qData.points, 0); // Set user points number
		// CACHE
		var scoreTable = cache.get(guildID + "score");
		const userScore = scoreTable.get(userID) || 0;
		scoreTable.set(userID, userScore + qData.points);
		cache.set(guildID + "score", scoreTable);
	}
	await delay(aDelay); // Wait x seconds before going to the next question
}
// ----------------------------------- GAME ----------------------------------- //



// ----------------------------------- PRESTART / STOP ----------------------------------- //
module.exports = {
    stop: function (message, reason) {
        const guildID = message.guild.id;
        const channel = message.channel;
        if (!cache.get(guildID + "running") >= 1) { // If no game running (2 = Game running)
            sendCatch(channel, eb.getNoGameRunningEmbed());
            return;
        }
        if (cache.get(guildID + "player") == message.author.id || message.guild.member(message.author).hasPermission("MANAGE_MESSAGES")) {
            cache.set(guildID + "running", 1); // 1 = Waiting for stop
            sendCatch(channel, eb.getStopEmbed(reason));
            console.log("Game aborted");
        } else {
            sendCatch(channel, eb.getWrongPlayerStopEmbed());
        }
    },
	
	stopAll: function (client) {
		return new Promise(async function (resolve, reject) {
			cache.set("stopscheduled", 1);		
			var guilds = client.guilds;
			for(var i = 3; i != -1; i--) {
				for (let guild of guilds.values()) {			
					const guildID = guild.id;
					if (cache.get(guildID + "running") >= 1) {
						const channelID = cache.get(guildID + "channel");
						const channel = client.channels.get(channelID);
						if (i != 0) sendCatch(channel, "**Une maintenance est prévue dans " + i + " minutes**");
						else sendCatch(channel, "Bot en maintenance...");
					}
				}			
				console.log("Bot stopping in " + i + " minutes...");
				if (i == 0) {await delay(5000); process.exit();}
				await delay(60000);		
			}	
		});
    },

    preStart: async function (message, args) {
        const guild = message.guild;
        const guildID = guild.id;
        const channel = message.channel;
		var questionsAmount;
		var difficulty;	
		
		if (cache.get("stopscheduled") == 1) { // If no stop scheduled
			sendCatch(channel, "Une maintenance est prévue, merci de réessayer un peu plus tard.");
			return;
		}
		if (cache.get(guildID + "running") >= 1) { // If no game already running
            sendCatch(channel, eb.getAlreadyRunningEmbed(cache.get(guildID + "channel")));
            return;
        }

		// If / Not below 0 / Not above 3 / Is an int and is not null
		if (args[1] < 0 || args[1] > 3 || !isInt(args[1]) && args[1] != null) {
			sendCatch(channel, eb.getBadDifEmbed());
            return;
		}
		else { // Mean it's null
			difficulty = args[1] || await db.getSetting(guild, "defaultdifficulty");
		}
		
		// If / Not below 1 / Not above 100 / Is an int and is not null / Is not equal to 0
		if ((args[2] < 1 || args[2] > 100 || !isInt(args[2]) && args[2] != null) && args[2] != 0) {
			sendCatch(channel, eb.getBadQuesEmbed());
            return;
		}
		else { // Mean it's null
			questionsAmount = args[2] || await db.getSetting(guild, "defaultquestionsamount");
			if (questionsAmount == 0) {
				if (message.guild.member(message.author).hasPermission("MANAGE_MESSAGES")) questionsAmount = 2147483647;
			}
		}

        // 0 = Stopped / 1 = Waiting for stop / 2 = Game running
        cache.set(guildID + "running", 2);
        cache.set(guildID + "player", message.author.id);
        cache.set(guildID + "channel", channel.id);
        cache.set(guildID + "score", new Map());
		
        startGame(message, difficulty, questionsAmount);
    }
}
// ----------------------------------- PRESTART / STOP ----------------------------------- //
