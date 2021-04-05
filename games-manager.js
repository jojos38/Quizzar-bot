const ClassicGame = require('gamemodes/classic-game.js');
const logger = require('logger.js');

class GameManager {
	#games = {};
	
	async startClassicGame(userID, guild, channel, args, lang, db) {
		logger.info("Starting new game in channel " + channel.id);
		let game = new ClassicGame(this, userID, guild, channel, lang, db)
		this.#games[channel.id] = game;
		game.preStart(args);
	}
	
	running(channelID) {
		if (this.#games[channelID]) return true;
		else return false;
	}
	
	deleteGame(channelID) {
		if (delete this.#games[channelID]) logger.info("Deleted game " + channelID);
		else logger.warn("Game " + channelID + " not found");
	}
}

module.exports = GameManager;