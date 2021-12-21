/**
 * @file Keep tracks of every running games and their states
 * @author jojos38
 */



// -------------------- SOME VARIABLES -------------------- //
const ClassicGame = require('gamemodes/classic-game.js');
const logger = require('logger.js');
const tools = require('tools.js');
// -------------------- SOME VARIABLES -------------------- //



class GameManager {
	#games = {};

	/**
	 * Starts a new classic game
	 */
	async startClassicGame(db, guild, channel, userID, lang, args) {
		logger.info("Starting new game in channel " + channel.id);
		let game = new ClassicGame(this, db, guild, channel, userID, lang)
		this.#games[channel.id] = game;
		game.preStart(args);
	}

	/**
	 * Restores a classic game in the state it was before
	 * @param {json} rawData - All the data of the game (scores, difficulty etc)
	 */
	async restoreClassicGame(db, channelID, rawData) {
		logger.info("Starting a game in channel " + channelID);
		let game = new ClassicGame(this, db)
		this.#games[channelID] = game;
		game.restoreGameState(rawData);
	}

	/**
	 * Returns if a game is running in the given channelID
	 */
	running(channelID) {
		if (this.#games[channelID]) return true;
		else return false;
	}

	/**
	 * Stop a running game
	 */
	stopGame(channel, member, reason, lang) {
		let game = this.#games[channel.id];
		if (game) {
			if (!game.isRunning()) { return; }
			if (member.user.id == game.getUserID() || member.hasPermission("MANAGE_MESSAGES")) {
				game.stop();
				tools.sendCatch(channel, lm.getStopEmbed(lang, reason));
				logger.info("Game aborted");
			} else {
				tools.sendCatch(channel, lm.getWrongPlayerStopEmbed(lang));
			}
		} else {
			tools.sendCatch(channel, lm.getNoGameRunningEmbed(lang));
		}
	}

	/**
	 * Delete a game from the manager
	 */
	deleteGame(channelID) {
		if (delete this.#games[channelID]) logger.info("Deleted game " + channelID);
		else logger.warn("Game " + channelID + " not found");
	}
}

module.exports = GameManager;