const ClassicGame = require('gamemodes/classic-game.js');
const logger = require('logger.js');
const tools = require('tools.js');

class GameManager {
	#games = {};
	
	async startClassicGame(db, guild, channel, userID, lang, args) {
		logger.info("Starting new game in channel " + channel.id);
		let game = new ClassicGame(this, db, guild, channel, userID, lang)
		this.#games[channel.id] = game;
		game.preStart(args);
	}
	
	async restoreClassicGame(db, channelID, rawData) {
		logger.info("Starting a game in channel " + channelID);
		let game = new ClassicGame(this, db)
		this.#games[channelID] = game;
		game.restoreGameState(rawData);
	}
	
	running(channelID) {
		if (this.#games[channelID]) return true;
		else return false;
	}
	
	stopGame(channel, member, reason, lang) {
		let game = this.#games[channel.id];
		if (game) {
			if (!game.isRunning()) { return; }
			if (member.user.id == game.getUserID() || member.hasPermission("MANAGE_MESSAGES")) {
				game.stop();
				tools.sendCatch(channel, lm.getEb(lang).getStopEmbed(reason));
				logger.info("Game aborted");
			} else {
				tools.sendCatch(channel, lm.getEb(lang).getWrongPlayerStopEmbed());
			}
		} else {
			tools.sendCatch(channel, lm.getEb(lang).getNoGameRunningEmbed());
		}
	}
	
	deleteGame(channelID) {
		if (delete this.#games[channelID]) logger.info("Deleted game " + channelID);
		else logger.warn("Game " + channelID + " not found");
	}
}

module.exports = GameManager;