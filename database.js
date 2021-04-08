
// -------------------- SOME VARIABLES -------------------- //
var MongoClient = require('mongodb').MongoClient
const config = require('./config.json');
const { database, username, password, ip, port } = require('./dbconfig.json');
const tools = require('./tools.js');
const logger = require('./logger.js');
const eb = tools.embeds;
var client;
var mainDB;
var col = {};
// -------------------- SOME VARIABLES -------------------- //



// -------------------- SOME FUNCTIONS -------------------- //
function removeSmallest(arr) {
  var min = Math.min.apply(null, arr);
  return arr.filter((e) => {return e != min});
}

async function findOneCatch(collection, toFind) {
	try { return await collection.findOne(toFind); }
	catch (err) { logger.error(err);  return null; }
}

async function findCatch(collection, toFind, filter) {
	try { return await collection.find(toFind, filter); }
	catch (err) { logger.error(err);  return null; }
}

async function insertOneCatch(collection, toInsert) {
	try { return await collection.insertOne(toInsert); }
	catch (err) { logger.error(err);  return null; }
}

async function deleteOneCatch(collection, toDelete) {
	try { return await collection.deleteOne(toDelete); }
	catch (err) { logger.error(err);  return null; }
}

async function deleteCatch(collection, toDelete) {
	try { return await collection.deleteMany(toDelete); }
	catch (err) { logger.error(err);  return null; }
}

async function updateOneCatch(collection, toUpdate, newValue) {
	try { return await collection.updateOne(toUpdate, newValue); }
	catch (err) { logger.error(err);  return null; }
}

async function listCatch(db) {
	try { return await mainDB.listCollections(); }
	catch (err) { logger.error(err);  return null; }
}
// -------------------- SOME FUNCTIONS -------------------- //



module.exports = {
    // ------------------------------------- INIT AND CLOSE ------------------------------------- //
    init: async function () {
		logger.info("Database connection...");
		const url = 'mongodb://' + username + ':' + password + '@' + ip + ':' + port + '/' + database + '?authSource=admin';
		try  {
			var err, tempClient = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true, poolSize: 1 });
			client = tempClient;
			mainDB = client.db(database);
			col.users = mainDB.collection('users');
			col.channels = mainDB.collection('channels');
			col.settings = mainDB.collection('settings');
			col.usersGuild = mainDB.collection('users_guild');
			col.defaultSettings = mainDB.collection('default_settings');
			logger.success("Database ready");
		} catch (err) {
			logger.error(err);
			process.exit(1);
		}
    },

    close: function () {
        client.close();
		logger.success("Database closed");
    },
    // ------------------------------------- INIT AND CLOSE ------------------------------------- //




    // ------------------------------------- SOME FUNCTIONS ------------------------------------- //
	resetGuildSettings: async function (guildID, guildName, channel, lang) {
		await deleteCatch(col.channels, { guildID: guildID });
		logger.info("Channels deleted for " + guildName);
		await deleteCatch(col.usersGuild, { guildID: guildID });
		logger.info("Users deleted for " + guildName);
		await deleteCatch(col.settings, { guildID: guildID });
		logger.info("Settings deleted for " + guildName);
		if (channel && lang) await tools.sendCatch(channel, lm.getString("resetted", lang));
    },

    addGuildChannel: async function (guildID, channel, lang) {
		const channelID = channel.id;
        var result = await findOneCatch(col.channels, { channelID: channelID });
		if (result) { // If it already exist
			if (lang) await tools.sendCatch(channel, lm.getString("alreadyAuthorized", lang));
			return; // Return if channel already exist
		}
        var result = await insertOneCatch(col.channels, { guildID: guildID, channelID: channelID });
		if (result) {
			if (lang) await tools.sendCatch(channel, lm.getString("channelAdded", lang));
			logger.info("Channel " + channelID + " inserted successfully in guild " + guildID);
		} else {
			if (lang) await tools.sendCatch(channel, lm.getString("error", lang));
			logger.error("Error while inserting channel " + channelID + " in guild " + guildID);
		}
    },

    removeGuildChannel: async function (channel, lang) {
        const channelID = channel.id;
        var result = await findOneCatch(col.channels, { channelID: channelID });
		if (!result) { // If channel doesn't exist
			if (!channel.deleted) tools.sendCatch(channel, lm.getString("channelNotInList", lang));
			return;
		}
        var result = await deleteOneCatch(col.channels, { guildID: channel.guild.id, channelID: channelID });
        if (result) {
			if (!channel.deleted) await tools.sendCatch(channel, lm.getString("channelDeleted", lang));
			logger.info("Channel " + channelID + " deleted successfully");
		} else {
			tools.sendCatch(channel, lm.getString("error", lang));
			logger.error("Error while deleting channel " + channelID);
		}
    },

    getGuildChannels: async function (guildID) {
		var result = await (await findCatch(col.channels, { guildID: guildID }, { projection: { _id: 0} })).toArray();
		if (!result) logger.error("Error while getting guild channels for guild " + guildID);
		return result || []
    },

    updateUserStats: async function (guildID, userID, username, addedScore, addedWon) {
        const userToFind = { userID: userID };
		addedScore = Number(addedScore)
		addedWon = Number(addedWon);
		if (!tools.isInt(addedScore) || !tools.isInt(addedWon)) { logger.warn("Error hapenned, score or won is not a valid number"); return; }
        var result = await findOneCatch(col.users, userToFind);
		if (result) {
			const finalScore = (addedScore + result.score) || addedScore;
			const finalWon = (addedWon + result.won) || addedWon;
			logger.info("Updated user " + username + " [Score: " + result.score + " => " + finalScore + ", " + "Won: " + result.won + " => " + finalWon + "]");
			await updateOneCatch(col.users, userToFind, { $set: { username: username, score: finalScore, won: finalWon } });
		} else {
			logger.info("Added user " + username + " [Score: 0 => " + addedScore + ", " + "Won: 0 => " + addedWon + "]");
			await insertOneCatch(col.users, { userID: userID, username: username, score: addedScore, won: addedWon });
		}
		
		var resultGuild = await findOneCatch(col.usersGuild, { guildID: guildID, userID: userID });
		if (resultGuild) {
			const finalScore = (addedScore + resultGuild.score) || addedScore;
			const finalWon = (addedWon + resultGuild.won) || addedWon;
			logger.info("Updated user guild score " + username + " [Score: " + resultGuild.score + " => " + finalScore + ", " + "Won: " + resultGuild.won + " => " + finalWon + "]");
			await updateOneCatch(col.usersGuild, { guildID: guildID, userID: userID }, { $set: { username: username, score: finalScore, won: finalWon } });
		} else {
			logger.info("Added user guild score " + username + " [Score: 0 => " + addedScore + ", " + "Won: 0 => " + addedWon + "]");
			await insertOneCatch(col.usersGuild, { guildID: guildID, userID: userID, username: username, score: addedScore, won: addedWon });
		}
    },

    getUserStats: async function (guildID, userID) {
		var guildScore = await findOneCatch(col.usersGuild, { guildID: guildID, userID: userID });
		var globalScore = await findOneCatch(col.users, { userID: userID });
		return { global: globalScore || {}, guild: guildScore || {} };
    },

    getTop: async function (guild, channel, lang) {
        const guildID = guild.id;
        var result = await findCatch(col.usersGuild, { guildID: guildID });
		result = await result.sort({ score: -1 }).toArray();
		if (!result) { logger.error("Error while getting top for guild " + guildID); return; }
		var usersString = "";
		for (var i = 0; i < result.length; i++) {
			if (i > 10) break;
			var user = result[i];
			var nick;
			if (guild.members.cache.get(user.userID)) nick = guild.members.cache.get(user.userID).nickname || guild.members.cache.get(user.userID).user.username;
			else nick = user.username;
			usersString = usersString + "\n" + "**[ " + (i+1) + " ]** [" + lm.getString("score", lang) + ": " + user.score + "] [" + lm.getString("victory", lang) + ": " + user.won + "] **" + nick + "**";
		}
		if (result.length == 0) usersString = lm.getString("noStats", lang);
		tools.sendCatch(channel, lm.getEb(lang).getTopEmbed(result.length, usersString));
    },

    setSetting: async function (guildID, settingName, value) {
		const settingToFind = { guildID: guildID, setting: settingName };
		var result = await findOneCatch(col.settings, settingToFind);
		if (result) {
			var result = await updateOneCatch(col.settings, settingToFind, { $set: { value: value } });
			if (result) logger.info("Setting " + settingName + " successfully updated to " + value);
			else logger.error("Error while updating " + settingName + " to " + value);
		} else {
			var result = await insertOneCatch(col.settings, { guildID: guildID, setting: settingName, value: value });
			if (result) logger.info("Setting " + settingName + " successfully inserted as " + value);
			else logger.error("Error while inserting " + settingName + " as " + value);
		}
    },

    getSetting: async function (guildID, settingName) {
		var result = await findOneCatch(col.settings, { guildID: guildID, setting: settingName });
		if (result) return result.value;
		else {
			var result = await findOneCatch(col.defaultSettings, { setting: settingName });
			if (result) {
				var ok = await insertOneCatch(col.settings, { guildID: guildID, setting: settingName, value: result.value });
				if (ok) logger.info("Setting " + settingName + " was missing in " + guildID + " and was added");
				else logger.error("Error while adding missing setting " + settingName + " in " + guildID);
				return result.value;
			}
		}
		return null;
    },

	getAllUsers: async function () {
		var tempList = [];
		var usersList = [];
		// First we get all users
		var users = await findCatch(col.users, null, { projection: { _id: 0 } });
		// We sort the list by score
		users = await users.sort({ score: -1 }).toArray();
		return users;
    }
    // ------------------------------------- SOME FUNCTIONS ------------------------------------- //
}
