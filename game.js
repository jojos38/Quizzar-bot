// ------------------------------ SOME VARIABLES ------------------------------ //
const logger = require('logger.js');
// ------------------------------ SOME VARIABLES ------------------------------ //



class Game {
	_channel;
	_manager;
	_running;
	
	constructor(manager, channel) {
		this._manager = manager;
		this._channel = channel;
		this._running = false;
	}

	stop() {
		this._running = false;
	}

	terminate() {
		this._manager.deleteGame(this._channel.id);
	}
	
	getChannelID() { return this._channel.id; }
}

module.exports = Game;
