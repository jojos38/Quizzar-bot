
// -------------------- SETTINGS -------------------- //
const reactionsTable = ['🇦', '🇧', '🇨', '🇩'];
// -------------------- SETTINGS -------------------- //



// ------------------------------ SOME VARIABLES ------------------------------ //
const messages = require('messages.js');
const Game = require("game.js");
const tools = require('tools.js');
const logger = require('logger.js');
const fs = require('fs');
// ------------------------------ SOME VARIABLES ------------------------------ //



// ----------------------------------- SOME FUNCTIONS ----------------------------------- //
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
			qNumber: this.#qNumber,
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
		
		const qMessage = await tools.sendCatch(this._channel, lm.getEb(this._lang).getQuestionEmbed(qData, this.#qNumber, this.#qTotal, this.#qDelay / 1000, Game._colors[qData.difficulty]));
		if (!qMessage) throw new Error("Can't send question message");
		
		const filter = (reaction, user) => { return reactionsTable.includes(reaction.emoji.name); };	
		let collector = qMessage.createReactionCollector(filter, { time: this.#qDelay });
		collector.on('collect', (reaction, collector) => {
			for (let user of reaction.users.cache) {
				const userID = user[0];
				if (userID != reaction.client.user.id) {
					if (reaction.emoji.name == goodAnswerReaction) goodAnswerUsers.set(userID, user[1].username);
					else delete goodAnswerUsers.delete(userID);
					reaction.users.remove(userID);
				}
			}

		});
		
		for (let i = 0; i < reactionsTable.length; i++) if (!await tools.reactCatch(qMessage, reactionsTable[i])) break;

		await this._delayChecking(this.#qDelay); // Wait for qDelay so people have time to answer
		collector.stop();

		const doubleCheck = await this.#getGoodAnswerPlayers(qMessage, goodAnswerReaction);
		doubleCheck.forEach((value, key) => goodAnswerUsers.set(key, value));

		await tools.editCatch(qMessage, lm.getEb(this._lang).getQuestionEmbed(qData, this.#qNumber, this.#qTotal, 0, 4605510));
		const playersString = messages.getPlayersString(goodAnswerUsers, this._lang);
		const aMessage = await tools.sendCatch(qMessage.channel, lm.getEb(this._lang).getAnswerEmbed(goodAnswerReaction, goodAnswerText, qData.anecdote, playersString, 16750869));
		for (const [userID, username] of goodAnswerUsers.entries()) { // For each player that answered correctly
			this.#db.updateUserStats(this._guild.id, userID, username, qData.difficulty, 0); // Set user points number
			this.#scores[userID] = (this.#scores[userID] || 0) + qData.difficulty;
		}
		await this._delayChecking(this.#aDelay); // Wait for aDelay so people have time to answer
		await tools.editCatch(aMessage, lm.getEb(this._lang).getAnswerEmbed(goodAnswerReaction, goodAnswerText, qData.anecdote, playersString, 4605510));
	}

	// We first do a for loop that asks for all the questions and give the answers
	// it also add the points of the user to the database each time, this way in
	// case of crash, the points are kept. Not forgeting to update the cache to avoid
	// it from being cleared automatically.
	// Then we exit the loop when the game ends and we calculate the total points
	// + the winner. The game as ended we can clear the cache.
	async #startGame() {
		this._running = true;
		const guildID = this._guild.id;

		logger.info("Server: " + this._guild.name + " (" + this._guild.memberCount + " users)" + " (" + this._guild.id + ")");
		logger.info("Questions amount: " + this.#qTotal);
		logger.info("Language: " + this._lang);
		await tools.sendCatch(this._channel, lm.getEb(this._lang).getStartEmbed(this.#difficulty, this.#qTotal));

		logger.info("-------------- NEW GAME --------------");
		// ASK QUESTIONS
		for (this.#qNumber; this.#qNumber <= this.#qTotal; this.#qNumber++) {
			logger.info("------------ NEW QUESTION ------------ (" + this.#qNumber + "/" + this.#qTotal + ")");	
			if (this._running == false) {
				tools.sendCatch(this._channel, lm.getEb(this._lang).getGameStoppedEmbed());
				break;
			}
			
			// This way users can update a setting while the game has already started!
			let settings = await this.#db.getSettings(guildID, ["questionDelay", "answerDelay", "lang"]);
			this.#qDelay = settings.questionDelay;
			this.#aDelay = settings.answerDelay;
			this._lang = settings.lang;

			try {
				// It asks one question and gives the answser + points calculation
				await this.#newQuestionAnswer();
				this.#saveGameState();
			} catch (err) {
				logger.error(err);
				logger.error("Error: ending game...");
				tools.sendCatch(this._channel, lm.getString("error", this._lang));
				this._running = false;
			}
		}
		this.#deleteGameState();
		let winners = messages.getScoreString(this._guild, this.#scores, this._lang, this.#db);
		tools.sendCatch(this._channel, lm.getEb(this._lang).getGameEndedEmbed(winners));
		this._terminate();
	}

	async preStart(args) {
        let guildID = this._guild.id;
		let difficulty = args[1];
		let questionsAmount = args[2];

		// If / Not below 0 / Not above 3 / Is an int / Is not null
		if (difficulty < 0 || difficulty > 3 || !tools.isInt(difficulty) && difficulty != null) {
			tools.sendCatch(this._channel, lm.getEb(this._lang).getBadDifEmbed());
			this._terminate();
            return;
		}
		else if (difficulty == null) // Mean it's null
			difficulty = await this.#db.getSetting(guildID, "defaultDifficulty");

		// If / Not below 1 / Not above 100 / Is an int and is not null / Is not equal to 0
		if ((questionsAmount < 1 || questionsAmount > 100 || !tools.isInt(questionsAmount) && questionsAmount != null)) {
			tools.sendCatch(this._channel, lm.getEb(this._lang).getBadQuesEmbed());
            this._terminate();
            return;
		}
		else if (questionsAmount == null) {
			questionsAmount = await this.#db.getSetting(guildID, "defaultQuestionsAmount");
			if (questionsAmount == 0)
				if (message.guild.member(message.author).hasPermission("MANAGE_MESSAGES"))
					questionsAmount = 2147483647;
		}

		this.#difficulty = Number(difficulty);
		this.#qTotal = Number(questionsAmount);

        this.#startGame();
    }
}
// ----------------------------------- SOME FUNCTIONS ----------------------------------- //



// ----------------------------------- GAME ----------------------------------- //








async function giveAnswer(qMessage, qData) {
	
	
	let goodAnswerUsers = await qMessage.reactions.cache.get(reactionsTable[qData.answer]).users.fetch(); // Get users that reacted with [reaction]
	
	console.log(goodAnswerUsers);
	
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






}

module.exports = ClassicGame;
// ----------------------------------- PRESTART / STOP ----------------------------------- //
