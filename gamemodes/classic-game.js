/**
 * @file All the logic of the "classic" gamemode
 * @author jojos38
 */



// -------------- SOME VARIABLES -------------- //
const fs = require('fs');
const Game = require("game.js");
const tools = require('tools.js');
const logger = require('logger.js');
const messages = require('messages.js');
const reactionsTable = ['🇦', '🇧', '🇨', '🇩'];
// -------------- SOME VARIABLES -------------- //



class ClassicGame extends Game {
	static type = "classic";

	#db;
	#qTotal;
	#aDelay;
	#qDelay;
	#scores;
	#qNumber;
	#difficulty;
	#dataSavePath;
	#questionsAmount;

	constructor(manager, db, guild, channel, userID, lang) {
		super(manager, userID, guild, channel, lang);
		if (channel) this.#dataSavePath = "cache/" + channel.id + ".json";
		this.#qNumber = 1;
		this.#scores = {};
		this.#db = db;
	}

	#saveGameState() {
		let gameSaveData = {
			difficulty: this.#difficulty,
			channelID: this._channel.id,
			guildID: this._guild.id,
			qNumber: this.#qNumber + 1,
			qTotal: this.#qTotal,
			scores: this.#scores,
			userID: this._userID,
			lang: this._lang
		}
		fs.writeFileSync(this.#dataSavePath, JSON.stringify(gameSaveData, this._replacer));
		logger.info("Updated game state json");
	}

	async restoreGameState(rawdata) {
		const data = JSON.parse(rawdata, this._reviver);
		const guildID = data.guildID;
		const channelID = data.channelID;

		logger.info("Restoring game for guild " + guildID);
		const guild = await client.guilds.fetch(guildID);
		const channel = await guild.channels.cache.get(channelID);

		if (guild && channel) {
			tools.sendCatch(channel, lm.getString("gameRestored", data.lang));
			this.#dataSavePath = "cache/" + channel.id + ".json";
			this.#difficulty = data.difficulty;
			this.#qNumber = data.qNumber;
			this.#scores = data.scores;
			this.#qTotal = data.qTotal;
			this._channel = channel;
			this._guild = guild;
			this._lang = data.lang;
			this.#startGame();
			logger.success("Restoring game for guild " + guildID + " succeed");
		}
		else {
			logger.warn("Restoring failed");
			this._terminate(channelID);
		}
	}

	#deleteGameState() {
		if (fs.existsSync(this.#dataSavePath)) fs.unlinkSync(this.#dataSavePath); // Remove the save file
	}

	async #getGoodAnswerPlayers(message, goodAnswer) {
		try {
			var badAnswerUsers = new Map();
			var goodAnswerUsers = new Map();
			for (var i = 0; i < reactionsTable.length; i++) { // For each proposition
				const reaction = reactionsTable[i]; // Get reaction
				if (reaction == goodAnswer) { // If good answer
					goodAnswerUsers = await message.reactions.cache.get(reaction).users.fetch(); // Get users that reacted with [reaction]
				} else { // Else if wrong answer
					const badUsers = await message.reactions.cache.get(reaction).users.fetch(); // Get all users that reacted with [reaction]
					const iterator = badUsers.keys();
					for (let userID of iterator) { // For each user that reacted with [reaction]
						const user = badUsers.get(userID); // Get user
						badAnswerUsers.set(userID, user); // Add him to the bad answer table
					}
				}
			}
			var userNumber = 0;
			var wonPlayers = new Map();
			const goodIterator = goodAnswerUsers.keys();
			for (let goodUserID of goodIterator) { // For each user that answered correctly
				const goodUser = goodAnswerUsers.get(goodUserID); // Get user
				if (badAnswerUsers.has(goodUserID) == false) { // If he is not in bad users list
					wonPlayers.set(goodUser.id, goodUser.username);
					userNumber++;
				}
			}
			return wonPlayers;
		} catch (error) { return []; }
	}

	async #newQuestionAnswer() {
		const qData = await this.#db.getRandomQuestion(this._lang, this.#difficulty);
		const goodAnswerText = qData.proposals[qData.answer];
		const goodAnswerReaction = reactionsTable[qData.answer];
		const goodAnswerUsers = new Map();
		logger.info("Answer: " + qData.proposals[qData.answer]);

		const qMessage = await tools.sendCatch(this._channel, lm.getQuestionEmbed(this._lang, qData, this.#qNumber, this.#qTotal, this.#qDelay / 1000, Game._colors[qData.difficulty]));
		if (!qMessage) throw new Error("Can't send question message");

		const filter = (reaction, user) => { return reactionsTable.includes(reaction.emoji.name); };
		let collector = qMessage.createReactionCollector(filter, { time: this.#qDelay });
		collector.on('collect', (reaction, collector) => {
			for (let user of reaction.users.cache) {
				const userID = user[0];
				if (userID != reaction.client.user.id) {
					if (reaction.emoji.name == goodAnswerReaction) goodAnswerUsers.set(userID, user[1].username);
					else delete goodAnswerUsers.delete(userID);
					tools.removeReactionCatch(reaction, userID);
				}
			}

		});

		for (let i = 0; i < reactionsTable.length; i++) if (!await tools.reactCatch(qMessage, reactionsTable[i])) break;

		await this._delayChecking(this.#qDelay); // Wait for qDelay so people have time to answer
		collector.stop();

		const doubleCheck = await this.#getGoodAnswerPlayers(qMessage, goodAnswerReaction);
		doubleCheck.forEach((value, key) => goodAnswerUsers.set(key, value));

		await tools.editCatch(qMessage, lm.getQuestionEmbed(this._lang, qData, this.#qNumber, this.#qTotal, 0, Game._colors[0]));
		const playersString = messages.getPlayersString(goodAnswerUsers, this._lang);
		const aMessage = await tools.sendCatch(qMessage.channel, lm.getAnswerEmbed(this._lang, goodAnswerReaction, goodAnswerText, qData.anecdote, playersString, 16750869));
		for (const [userID, username] of goodAnswerUsers.entries()) { // For each player that answered correctly
			this.#db.updateUserStats(this._guild.id, userID, username, qData.difficulty, 0); // Set user points number
			this.#scores[userID] = (this.#scores[userID] || 0) + qData.difficulty;
		}
		await this._delayChecking(this.#aDelay); // Wait for aDelay so people have time to answer
		await tools.editCatch(aMessage, lm.getAnswerEmbed(this._lang, goodAnswerReaction, goodAnswerText, qData.anecdote, playersString, Game._colors[0]));
	}

	async #startGame() {
		this._running = true;
		const guildID = this._guild.id;

		logger.info("Server: " + this._guild.name + " (" + this._guild.memberCount + " users)" + " (" + this._guild.id + ")");
		logger.info("Questions amount: " + this.#qTotal);
		logger.info("Language: " + this._lang);
		await tools.sendCatch(this._channel, lm.getStartEmbed(this._lang, this.#difficulty, this.#qTotal));
		if (!this._guild.me.hasPermission("MANAGE_MESSAGES") && !this._guild.me.permissionsIn(this._channel).has("MANAGE_MESSAGES"))
			await tools.sendCatch(this._channel, lm.getString("missingPerm", this._lang));

		logger.info("-------------- NEW GAME --------------");
		// ASK QUESTIONS
		for (this.#qNumber; this.#qNumber <= this.#qTotal; this.#qNumber++) {
			logger.info("------------ NEW QUESTION ------------ (" + this.#qNumber + "/" + this.#qTotal + ")");
			if (this._running == false) {
				tools.sendCatch(this._channel, lm.getGameStoppedEmbed(this._lang));
				break;
			}

			// This way users can update a setting while the game has already started!
			let settings = await this.#db.getSettings(guildID, ["questionDelay", "answerDelay", "lang"]);
			this.#qDelay = settings.questionDelay;
			this.#aDelay = settings.answerDelay;
			this._lang = settings.lang;

			//try {
				// It asks one question and gives the answser + points calculation
				await this.#newQuestionAnswer();
				this.#saveGameState();
			/*} catch (err) {
				logger.error(err);
				logger.error("Error: ending game...");
				tools.sendCatch(this._channel, lm.getString("error", this._lang));
				this._running = false;
			}*/
		}
		this.#deleteGameState();
		let winners = messages.getScoreString(this._guild, this.#scores, this._lang, this.#db);
		tools.sendCatch(this._channel, lm.getGameEndedEmbed(this._lang, winners));
		this._terminate();
	}

	async preStart(args) {
        let guildID = this._guild.id;
		let difficulty = args[1];
		let questionsAmount = args[2];

		// If / Not below 0 / Not above 3 / Is an int / Is not null
		if (difficulty < 0 || difficulty > 3 || !tools.isInt(difficulty) && difficulty != null) {
			tools.sendCatch(this._channel, lm.getBadDifEmbed(this._lang));
			this._terminate();
            return;
		}
		else if (difficulty == null) // Mean it's null
			difficulty = await this.#db.getSetting(guildID, "defaultDifficulty");

		// If / Not below 1 / Not above 100 / Is an int and is not null / Is not equal to 0
		if (((questionsAmount < 1 || questionsAmount > 100 || !tools.isInt(questionsAmount)) && questionsAmount)) {
			tools.sendCatch(this._channel, lm.getBadQuesEmbed(this._lang));
            this._terminate();
            return;
		}
		else if (!questionsAmount) {
			if (this._guild.member(this._userID).hasPermission("MANAGE_MESSAGES") && questionsAmount == 0)
				questionsAmount = 2147483647;
			else
				questionsAmount = await this.#db.getSetting(guildID, "defaultQuestionsAmount");
		}

		this.#difficulty = Number(difficulty);
		this.#qTotal = Number(questionsAmount);

        this.#startGame();
    }
}

module.exports = ClassicGame;
