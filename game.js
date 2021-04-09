/**
 * @file Manages the database inputs / outputs
 * @author jojos38
 */



// ------------------------ SOME FUNCTIONS ------------------------ //
/**
 * This is used by the delayChecking function to wait x ms
 */
async function delay(ms) {
	return await new Promise(resolve => setTimeout(resolve, ms));
}
// ------------------------ SOME FUNCTIONS ------------------------ //



class Game {
	//				  Finished Easy     Medium    Hard
	static _colors = [4605510, 4652870, 16750869, 15728640];

	_lang;
	_guild;
	_userID;
	_channel;
	_manager;
	_running;

	constructor(manager, userID, guild, channel, lang) {
		this._running = false;
		this._manager = manager;
		this._channel = channel;
		this._userID = userID;
		this._guild = guild;
		this._lang = lang;
	}

	/**
	 * Used to be able to save Map inside json
	 * This is used by the saveGameState function
	*/
	_replacer(key, value) {
		if(value instanceof Map)
			return { dataType: 'Map', value: Array.from(value.entries()) };
		else
			return value;
	}

	/**
	 * Used to be able to restore Map from json
	 * This is used by the restoreGameState function
	 */
	_reviver(key, value) {
		if(typeof value === 'object' && value !== null)
			if (value.dataType === 'Map')
				return new Map(value.value);
		return value;
	}

	/**
	 * This function awaits for x secondsd while checking that the game is still running
	 * If the game is not running anymore the waiting will stop, it's used to prevent a
	 * game from being stuck if the question delay is very high
	 */
	async _delayChecking(ms) {
		// This way if the game is force stopped it will leave the current question
		const waitingTime = ms / (15000 + (ms/100*10)) * 1000 // The higher the question delay, the lower the checking
		for (let i = 0; i < ms; i += waitingTime) {;
			if (this._running == false) break; // 1 = Waiting for stop
			await delay(waitingTime);
		}
		return;
	}

	/**
	 * Called when a game has ended, it removes the game from the manager
	 */
	_terminate(channelID) {
		this._manager.deleteGame(channelID || this.getChannelID());
	}

	/**
	 * Getters / Setters
	 */
	getChannelID() { return this._channel.id; }
	getUserID() { return this._userID; }
	getLang() { return this._lang; }
	isRunning() { return this._running; }
	stop() { this._running = false; }
}

module.exports = Game;