/**
 * @file Manages the database inputs / outputs
 * @author jojos38
 */



// ---------------------------- SOME VARIABLES ---------------------------- //
const { database, username, password, ip, port } = require('./dbconfig.json');
const MongoClient = require('mongodb').MongoClient
const tools = require('./tools.js');
const logger = require('./logger.js');
const eb = tools.embeds;
// ---------------------------- SOME VARIABLES ---------------------------- //



class Database {
	#col = {};

	/**
	 * Those are just basic functions but that catches errors
	 */
	static async #findOne(collection, toFind, filter) {
		try { return await collection.findOne(toFind, filter || { projection: { _id: 0} }); }
		catch (err) { console.log(toFind); logger.error(err); return null; }
	}

	static async #findMany(collection, toFind, filter) {
		try { return await collection.find(toFind, filter || { projection: { _id: 0} }); }
		catch (err) { console.log(toFind); logger.error(err); return null; }
	}

	static async #deleteOne(collection, toDelete, filter) {
		try { return await collection.deleteOne(toDelete, filter || { projection: { _id: 0} }); }
		catch (err) { console.log(toDelete); logger.error(err); return null; }
	}

	static async #deleteMany(collection, toDelete, filter) {
		try { return await collection.deleteMany(toDelete, filter || { projection: { _id: 0} }); }
		catch (err) { console.log(toDelete); logger.error(err); return null; }
	}

	static async #insertOne(collection, toInsert, filter) {
		try { return await collection.insertOne(toInsert, filter || { projection: { _id: 0} }); }
		catch (err) { console.log(toInsert); logger.error(err); return null; }
	}

	static async #updateOne(collection, toUpdate, newValue) {
		try { return await collection.updateOne(toUpdate, newValue); }
		catch (err) { console.log(toUpdate); logger.error(err); return null; }
	}

	static async #exists(collection, item) {
		try { return await collection.findOne(item, { projection: { _id: 1} }) != undefined; }
		catch (err) { console.log(item); logger.error(err); return null; }
	}

	static async #aggregate(collection, query) {
		try { return await collection.aggregate(query); }
		catch (err) { console.log(query); logger.error(err); return null; }
	}

	/**
	 * Open the connection to the database
	 */
	async init() {
		logger.info("Database connecting...");
		const url = 'mongodb://' + username + ':' + password + '@' + ip + ':' + port + '/' + database + '?authSource=admin';
		try  {
			const client = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true, poolSize: 1 });
			const mainDB = client.db(database);
			this.#col.users = mainDB.collection('users');
			this.#col.channels = mainDB.collection('channels');
			this.#col.settings = mainDB.collection('settings');
			this.#col.questions = mainDB.collection('questions');
			this.#col.usersGuild = mainDB.collection('users_guild');
			this.#col.defaultSettings = mainDB.collection('default_settings');
			logger.success("Database connected");
		}
		catch (err) { logger.error(err); }
	}

	/**
	 * Closes the database connection
	 */
	async close() {
		if (client.close) {
			await client.close();
			logger.success("Database closed");
		} else logger.warn("Database not initialized");
    }

	/**
	 * Returns a random question from the given language and difficulty
	 */
	async getRandomQuestion(lang, difficulty) {
		let match = { lang: lang }
		if (difficulty > 0) match.difficulty = Number(difficulty);
		else match.difficulty = Math.floor(Math.random() * 3) + 1;
		let question = await (await this.#col.questions.aggregate([
			{ $match: match },
			{ $sample: { size: 1 } }
		])).toArray();
		return question[0];
	}

	/**
	 * Deletes every settings and users data from a guild
	 */
	async resetGuildSettings(guildID) {
		await Database.#deleteMany(this.#col.channels, { guildID: guildID });
		await Database.#deleteMany(this.#col.usersGuild, { guildID: guildID });
		await Database.#deleteMany(this.#col.settings, { guildID: guildID });
		logger.info("Settings resetted successfully for guild " + guildID);
    }

	/**
	 * Adds a guild channel inside the database (allow normal users to start games within it)
	 * @return {boolean} If the channel was existing
	 */
    async addGuildChannel(guildID, channelID) {
		// Check if channel already exists
		if (await Database.#exists(this.#col.channels, { channelID: channelID })) {
			logger.info("Channel " + channelID + " already exists in guild " + guildID);
			return true;
		}
		// Insert channel if it doesn't exists
		if (await Database.#insertOne(this.#col.channels, { guildID: guildID, channelID: channelID })) {
			logger.info("Channel " + channelID + " inserted successfully in guild " + guildID);
			return false;
		}
    }

	/**
	 * Removes a guild channel from the database (disallow normal users to start games within it)
	 * @return {boolean} If the channel was existing
	 */
    async removeGuildChannel(channelID) {
		const query = { channelID: channelID };
		// If channel does not exists
		if (!await Database.#exists(this.#col.channels, query)) {
			logger.info("Channel " + channelID + " does not exists");
			return false;
		}
		// If channel exists, delete it
        if (await Database.#deleteOne(this.#col.channels, query)) {
			logger.info("Channel " + channelID + " deleted successfully");
			return true;
		}
    }

	/**
	 * Used by the channels command to list the channels
	 * @return {Array} All the added channels of a given guild
	 */
    async getGuildChannels(guildID) {
		let channels = await (await Database.#findMany(this.#col.channels, { guildID: guildID }, { projection: { _id: 0, guildID: 0 } })).toArray();
		return channels || []
    }

	/**
	 * Increase the score and the won games from a user globally and in the guild, in the database
	 * @param {Integer} addedScore - The total points to add to the user's score
	 * @param {addedWon} addedWon - The total won parties to add to the user's wons
	 */
    async updateUserStats(guildID, userID, username, addedScore, addedWon) {
        let userQuery = { userID: userID };
		let userGuildQuery = { guildID: guildID, userID: userID };

        let user = await Database.#findOne(this.#col.users, userQuery);
		if (user) {
			logger.info("Updated user " + username + " [Score: " + user.score + " => " + (user.score + addedScore) + ", " + "Won: " + user.won + " => " + (user.won + addedWon) + "]");
			await Database.#updateOne(this.#col.users, userQuery, { $inc: { score: addedScore, won: addedWon } }, { $set: { username: username } });
		} else {
			logger.info("Added user " + username + " [Score: 0 => " + addedScore + ", " + "Won: 0 => " + addedWon + "]");
			await Database.#insertOne(this.#col.users, { userID: userID, username: username, score: addedScore, won: addedWon });
		}

		var userGuild = await Database.#findOne(this.#col.usersGuild, userGuildQuery);
		if (userGuild) {
			logger.info("Updated user guild score " + username + " [Score: " + userGuild.score + " => " + (userGuild.score + addedScore) + ", " + "Won: " + userGuild.won + " => " + (userGuild.won + addedWon) + "]");
			await Database.#updateOne(this.#col.usersGuild, userGuildQuery, { $inc: { score: addedScore, won: addedWon } }, { $set: { username: username } });
		} else {
			logger.info("Added user guild score " + username + " [Score: 0 => " + addedScore + ", " + "Won: 0 => " + addedWon + "]");
			await Database.#insertOne(this.#col.usersGuild, { guildID: guildID, userID: userID, username: username, score: addedScore, won: addedWon });
		}
    }

	/**
	 * Get the global score and the specific guild score of a user
	 * @return {Object} The global score and the guild score
	 */
    async getUserStats(guildID, userID) {
		var guildScore = await Database.#findOne(this.#col.usersGuild, { guildID: guildID, userID: userID });
		var globalScore = await Database.#findOne(this.#col.users, { userID: userID });
		return { global: globalScore || {}, guild: guildScore || {} };
    }

	/**
	 * Insert a setting which is missing from a guild
	 * @return The value of the setting
	 */
	async #insertMissingSetting(guildID, settingName) {
		const projection = { projection: { _id: 0, guildID: 0 } };
		let globalSetting = await Database.#findOne(this.#col.defaultSettings, { setting: settingName }, projection);
		if (globalSetting) {
			let success = await Database.#insertOne(this.#col.settings, { guildID: guildID, setting: settingName, value: globalSetting.value });
			if (success) logger.info("Setting " + settingName + " was missing in " + guildID + " and was added");
			else logger.error("Error while adding missing setting " + settingName + " in " + guildID);
			return globalSetting.value;
		} else logger.error("Setting " + settingName + " was not found in default_settings");
	}

	/**
	 * Get a setting from a guild
	 * @param {settingName} A string or an array of the settings to get
	 * @return The value of the setting
	 */
    async getSetting(guildID, settingName) {
		const projection = { projection: { _id: 0, guildID: 0, setting: 0 } };
		let query = { guildID: guildID, setting: settingName };
		let setting = await Database.#findOne(this.#col.settings, query, projection);
		if (setting != null) return setting.value;
		else return await this.#insertMissingSetting(guildID, settingName);
    }
	
	/**
	 * Get multiple settings from a guild
	 * @param {settingName} An array of the settings to get
	 * @return A key value object or null
	 */
    async getSettings(guildID, settingName) {
		const projection = { projection: { _id: 0, guildID: 0 } };
		let query = { guildID: guildID, setting: { $in: [] } };
		for (let setting of settingName) query.setting.$in.push(setting);
		let tmpSettings = await (await Database.#findMany(this.#col.settings, query, projection)).toArray();
		var setting = {};
		// Parse to a key value map
		for (let tmpSetting of tmpSettings) setting[tmpSetting.setting] = tmpSetting.value;
		for (let tmpSetting of settingName) {
			if (setting[tmpSetting] == null) setting[tmpSetting] = await this.#insertMissingSetting(guildID, tmpSetting);
		}
		return setting;
    }

	/**
	 * Set a setting for a guild
	 */
    async setSetting(guildID, settingName, value) {
		let settingToFind = { guildID: guildID, setting: settingName };
		if (await Database.#exists(this.#col.settings, settingToFind)) {
			let result = await Database.#updateOne(this.#col.settings, settingToFind, { $set: { value: value } });
			if (result) logger.info("Setting " + settingName + " successfully updated to " + value);
			else logger.error("Error while updating " + settingName + " to " + value);
		} else {
			let result = await Database.#insertOne(this.#col.settings, { guildID: guildID, setting: settingName, value: value });
			if (result) logger.info("Setting " + settingName + " successfully inserted as " + value);
			else logger.error("Error while inserting " + settingName + " as " + value);
		}
    }

	/**
	 * Get the top 10 users score of a given guild
	 * @return {Object} The total users that have a score and a string of the users scores
	 */
    async getTop(guildID) {
		let guildUsers = await (await Database.#findMany(this.#col.usersGuild, { guildID: guildID }, { sort: { score: -1, won: -1 }, projection: { _id: 0, guildID: 0 } })).toArray();
		return guildUsers;
    }

	/**
	 * Get every users that used the bot and their scores
	 * @return A sorted list by score and then won of every users
	 */
	async getAllUsers() {
		var users = await (await Database.#findMany(this.#col.users, null, { sort: { score: -1, won: -1 }, projection: { _id: 0 } })).toArray();
		return users;
    }
}

module.exports = Database;
