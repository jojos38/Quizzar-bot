
// -------------------- SETTINGS -------------------- //
const defaultDifficulty = 0;
const defaultQuestionsAmount = 10;
const reactionsTable = ['🇦', '🇧', '🇨', '🇩'];
// -------------------- SETTINGS -------------------- //



// ------------------------------ SOME VARIABLES ------------------------------ //
const config = require('./config.json');
const messages = require('./messages.js');
const eb = require('./' + config.lang + '.js');
const fs = require('fs');
const db = require('./database.js');
const files = fs.readdirSync('./resources/') // Get all files in resource folder
const cacheTTL = 60 * 60 * 4; // 4 hour
const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: cacheTTL, checkperiod: 60 * 5 });
const colors = { 1: 4652870, 2: 16750869, 3: 15728640 };
// ------------------------------ SOME VARIABLES ------------------------------ //



// ----------------------------------- SOME FUNCTIONS ----------------------------------- //
async function delay(ms) {
    // return await for better async stack trace support in case of errors.
    return await new Promise(resolve => setTimeout(resolve, ms));
}

function sendCatch(channel, message) {
    try { channel.send(message); }
    catch (error) {
		console.log(" ==================== "+ channel.guild);
		console.log(error);
	}
}

function countPoints(guild, channel) {
    const guildID = guild.id;
    var scoreTable = cache.get(guildID + "score");
    winners = messages.getWinString(guild, scoreTable);
    // db.updateUserStats(guild, winnerID, 0, 1); <- INSIDE getWinString function
    sendCatch(channel, eb.getGameEndedEmbed(winners));
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function getRandomFile() {
    const filesNumber = files.length; // Get files number
    const randomFile = files[getRandomInt(filesNumber)]; // Pick one randomly
    const file = require('./resources/' + randomFile);
    console.log("File :" + randomFile);
    return file;
}

function getRandomQuestion(file, difficulty) {
    var difficultyString = "";
    difficulty = parseInt(difficulty);
    if (difficulty == 0) {
        difficulty = 1 + getRandomInt(3); // Get random difficulty between 1 and 3 if it's 0
    }
    switch (difficulty) {
        case 1: difficultyString = "débutant"; break;
        case 2: difficultyString = "confirmé"; break;
        case 3: difficultyString = "expert"; break;
	default: difficultyString = "débutant"; break;
    }
    const questionCategory = file.quizz[difficultyString];
    const question = questionCategory[getRandomInt(questionCategory.length)];
    return { 0: question, 1: difficultyString, 2: difficulty };
}

function getGoodAnswerLetter(reactionsToGet, propositions, goodAnswer) {
    for (var i = 0; i < propositions.length; i++) { // For each answer
        if (propositions[i] == goodAnswer) { // If good answer
            return reactionsToGet[i];
        }
    }
    return 'Err';
}

function getGoodAnswerPlayers(message, reactionsToGet, propositions, goodAnswer) {
    try {
        var badAnswerUsers = new Map();
        var goodAnswerUsers = new Map();
        for (var i = 0; i < propositions.length; i++) { // For each proposition
            const reaction = reactionsToGet[i]; // Get reaction
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
    } catch (error) {
        return [];
    }
}

function checkSettings(guild) {
    return new Promise(async function (resolve) {
        if (!await db.getSetting(guild, "questiondelay")) {
            await db.setSetting(guild, "questiondelay", 15000);
        }
        if (!await db.getSetting(guild, "answerdelay")) {
            await db.setSetting(guild, "answerdelay", 5000);
        }
        if (!await db.getSetting(guild, "defaultquestionsamount")) {
            await db.setSetting(guild, "defaultquestionsamount", 10);
        }
        if (!await db.getSetting(guild, "defaultdifficulty")) {
            await db.setSetting(guild, "defaultdifficulty", 0);
        }
        resolve();
    });
}
// ----------------------------------- SOME FUNCTIONS ----------------------------------- //


// ----------------------------------- GAME ----------------------------------- //
async function startGame(message, difficulty, questionsAmount) {
    const channel = message.channel;
    const guildID = message.guild.id;
    await sendCatch(channel, eb.getStartEmbed(difficulty, questionsAmount));
    const questionDelay = await db.getSetting(message.guild, "questiondelay");
    const answerDelay = await db.getSetting(message.guild, "answerdelay");
    console.log("Questions delay:" + questionDelay);
    console.log("Answers delay: " + answerDelay);
    for (var questionNumber = 1; questionNumber <= questionsAmount; questionNumber++) { // Ask questions
        console.log("--------------- NEW QUESTION ---------------");    
		try {
			await newQuestionAnswer(channel, difficulty, questionsAmount, questionNumber, questionDelay, answerDelay); // It ask question and gives answser
        } catch (error) {
			console.log("error !");
			cache.set(guildID + "running", 1); // Stop game if error
		}		
		if (cache.get(guildID + "running") == 1) { // 1 = Waiting for stop
            sendCatch(message.channel, eb.getGameStoppedEmbed());
            break;
        }
    }
    await countPoints(message.guild, channel);
    // CACHE
    cache.set(guildID + "running", 0);
    cache.del(guildID + "player");
    cache.del(guildID + "channel");
    cache.del(guildID + "score");
    console.log("Cache cleared");
}

function newQuestionAnswer(channel, difficulty, qAmount, qNumber, questionDelay, answerDelay) {
    return new Promise(function (resolve, reject) {
        const file = getRandomFile();
        const qRaw = getRandomQuestion(file, difficulty);
        const qData = { 0: file.thème, 1: qRaw[1], 2: qRaw[0].question, 3: qRaw[0].propositions, 4: qRaw[0].réponse, 5: qRaw[0].anecdote, 6: qRaw[2], 7: qNumber, 8: qAmount };
        console.log(qData[4]);
        channel.send(eb.getQuestionEmbed(qData, 15, colors[qData[6]])).then(async function (message) { // Send message then  
            for (var i = 0; i < reactionsTable.length; i++) {
                try { await message.react(reactionsTable[i]); } catch (error) { console.log(error); break; }
            }
            await delay(questionDelay); // Wait 15s before giving answer
            await giveAnswer(message, qData, reactionsTable, answerDelay);
            resolve();
        }).catch(async function (error) { console.error(error); reject(); });
    });
}

function giveAnswer(message, qData, reactionsTable, answerDelay) {
    return new Promise(async function (resolve, reject) {
        // 0:thème --- 1:difficulté --- 2:question --- 3:propositions --- 4:réponse --- 5:anecdote --- 6:points --- 7:num.ques --- 8:tot.ques        
        const goodAnswerLetter = getGoodAnswerLetter(reactionsTable, qData[3], qData[4]);
        var goodAnswerPlayers = getGoodAnswerPlayers(message, reactionsTable, qData[3], qData[4]);
        try { await message.edit(eb.getQuestionEmbed(qData, 0, 4605510)); } catch (error) { console.log(error); }
        try { await message.channel.send(eb.getAnswerEmbed(goodAnswerLetter, qData[4], qData[5], messages.getPlayersString(goodAnswerPlayers))); } catch (error) { console.log(error); }
        for (var i = 0; i < goodAnswerPlayers.length; i++) { // For each player that answered correctly
            const user = goodAnswerPlayers[i];
            const guildID = message.guild.id;
            const userID = user.id;
            // DATABASE           GUILD       USER NEWSCORE WONGAMES
            db.updateUserStats(message.guild, user, qData[6], 0); // Set user points number
            // CACHE
            var scoreTable = cache.get(guildID + "score");
            const userScore = scoreTable.get(userID) || 0;
            scoreTable.set(userID, userScore + qData[6]);
            cache.set(guildID + "score", scoreTable);
        }
        setInterval(resolve, answerDelay);
    });
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

    preStart: async function (message, difficulty, questionsAmount) {
        const guild = message.guild;
        const guildID = guild.id;
        const channel = message.channel;
        await checkSettings(guild); // Check if settings exist
		
		if (cache.get("stopscheduled") == 1) {
			sendCatch(channel, "Une maintenance est prévue, merci de réessayer un peu plus tard.");
			return;
		}
		
        if (cache.get(guildID + "running") >= 1) { // If game already running
            sendCatch(channel, eb.getAlreadyRunningEmbed(message.guild.channels.get(channel.id).toString()));
            return;
        }

        // -1 = number not specified
        // -2 = number not in range
        if (difficulty == -2) { // Check if not wrong difficulty
            sendCatch(channel, eb.getBadDifEmbed());
            return;
        }

        if (questionsAmount == -2) { // Check if not wrong questions amount
            sendCatch(channel, eb.getBadQuesEmbed());
            return;
        }

        // 0 = Stopped / 1 = Waiting for stop / 2 = Game running
        cache.set(guildID + "running", 2);
        cache.set(guildID + "player", message.author.id);
        cache.set(guildID + "channel", channel.id);
        cache.set(guildID + "score", new Map());

        if (difficulty == -1) // Set right difficulty
            difficulty = await db.getSetting(guild, "defaultdifficulty");

        if (questionsAmount == -1) { // Set right questions amount
            questionsAmount = await db.getSetting(guild, "defaultquestionsamount");

        } else if (questionsAmount == 0) {
            if (message.guild.member(message.author).hasPermission("MANAGE_MESSAGES"))
                questionsAmount = 2147483647;
            //else
            //    questionsAmount = 10;
        }

        startGame(message, difficulty, questionsAmount);
    }
}
// ----------------------------------- PRESTART / STOP ----------------------------------- //
