// ------------------------------ SOME VARIABLES ------------------------------ //
const logger = require('logger.js');
// ------------------------------ SOME VARIABLES ------------------------------ //


async function delay(ms) {
    // return await for better async stack trace support in case of errors.
    return await new Promise(resolve => setTimeout(resolve, ms));
}


class Game {
	static _colors = { 1: 4652870, 2: 16750869, 3: 15728640 };
	
	_lang;
	_guild;
	_userID;
	_channel;
	_manager;
	_running;
	
	constructor(manager, userID, guild, channel, lang) {
		this._manager = manager;
		this._channel = channel;
		this._userID = userID;
		this._guild = guild;
		this._lang = lang;
		this._running = false;
	}

	_replacer(key, value) {
	  if(value instanceof Map) {
		return {
		  dataType: 'Map',
		  value: Array.from(value.entries()), // or with spread: value: [...value]
		};
	  } else {
		return value;
	  }
	}

	_reviver(key, value) {
	  if(typeof value === 'object' && value !== null) {
		if (value.dataType === 'Map') {
		  return new Map(value.value);
		}
	  }
	  return value;
	}
	
	async _delayChecking(ms) {
		//return new Promise(async function (resolve, reject) {
			// This way if the game is force stopped it will leave the current question
			var waitingTime = ms / (15000 + (ms/100*10)) * 1000 // The higher the question delay, the lower the checking
			for (var i = 0; i < ms; i += waitingTime) {;
				if (this._running == false) break; // 1 = Waiting for stop
				await delay(waitingTime);
			}
			return;
		//});
	}

	_terminate(channelID) {
		this._manager.deleteGame(channelID || this.getChannelID());
	}
	
	getChannelID() { return this._channel.id; }
	getUserID() { return this._userID; }
	getLang() { return this._lang; }
	isRunning() { return this._running; }
	stop() { this._running = false; }
}

module.exports = Game;
