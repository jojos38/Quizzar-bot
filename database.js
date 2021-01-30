
// -------------------- SOME VARIABLES -------------------- //
var MongoClient = require('mongodb').MongoClient
const config = require('./config.json');
const { database, username, password, ip, port } = require('./dbconfig.json');
const tools = require('./tools.js');
const logger = require('./logger.js');
const eb = tools.embeds;
var client;
var mainDB;
var lastUsersChecking = {};
// -------------------- SOME VARIABLES -------------------- //



// -------------------- SOME FUNCTIONS -------------------- //
function removeSmallest(arr) {
  var min = Math.min.apply(null, arr);
  return arr.filter((e) => {return e != min});
}

async function dropCatch(collection) {
	try { return await collection.drop(); }
	catch (err) { logger.error(err); return null; }
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
		const guildCollection = mainDB.collection(guildID);
		var result = await dropCatch(guildCollection);
		if (result) {
			if (channel) tools.sendCatch(channel, lm.getString("resetted", lang));
			logger.info("Deleted collection from server " + guildName);
		} else {
			tools.sendCatch(channel, lm.getString("error", lang));
			logger.error("Error while deleting collection from server " + guildName);
		}
    },

    addGuildChannel: async function (channel, lang) {
		const channelID = channel.id;
        const guildCollection = mainDB.collection(channel.guild.id);
        var result = await findOneCatch(guildCollection, { channel: channelID });
		if (result) { // If it already exist
			await tools.sendCatch(channel, lm.getString("alreadyAuthorized", lang));
			return; // Return if channel already exist
		}
        var result = await insertOneCatch(guildCollection, { channel: channelID, lang: "auto" });
		if (result) {
			await tools.sendCatch(channel, lm.getString("channelAdded", lang));
			logger.info("Channel " + channelID + " inserted successfully in guild " + channel.guild.id);
		} else {
			tools.sendCatch(channel, lm.getString("error", lang));
			logger.error("Error while inserting channel " + channelID + " in guild " + channel.guild.id);
		}
    },

    removeGuildChannel: async function (channel, lang) {
        const channelID = channel.id;
        const guildCollection = mainDB.collection(channel.guild.id);
        var result = await findOneCatch(guildCollection, { channel: channelID });
		if (!result) { // If channel doesn't exist
			if (!channel.deleted) tools.sendCatch(channel, lm.getString("channelNotInList", lang));
			return;
		}
        var result = await deleteOneCatch(guildCollection, { channel: channelID });
        if (result) {
			if (!channel.deleted) await tools.sendCatch(channel, lm.getString("channelDeleted", lang));
			logger.info("Channel " + channelID + " deleted successfully");
		} else {
			tools.sendCatch(channel, lm.getString("error", lang));
			logger.error("Error while deleting channel " + channelID);
		}
    },

    getGuildChannels: async function (guildID) {
		const guildCollection = mainDB.collection(guildID);
		var result = (await findCatch(guildCollection, {channel: {$exists: true}}, { projection: { _id: 0} })).toArray();
		if (!result) logger.error("Error while getting guild channels for guild " + guildID);
		return result || []
    },

    updateUserStats: async function (guildID, userID, username, addedScore, addedWon) {
        const guildCollection = mainDB.collection(guildID);
        const userToFind = { id: userID };
		addedScore = Number(addedScore)
		if (!tools.isInt(addedScore)) { logger.warn("Error hapenned, score or won is not a valid number"); }
        var result = await findOneCatch(guildCollection, userToFind);
		if (result) {
			const finalScore = (addedScore + result.score) || addedScore;
			const finalWon = (addedWon + result.won) || addedWon;
			logger.info("Updated user " + username + " [Score: " + result.score + " => " + finalScore + ", " + "Won: " + result.won + " => " + finalWon + "]");
			await updateOneCatch(guildCollection, userToFind, { $set: { id: userID, score: finalScore, won: finalWon } });
		} else {
			logger.info("Added user " + username + " [Score: 0 => " + addedScore + ", " + "Won: 0 => " + addedWon + "]");
			await insertOneCatch(guildCollection, { id: userID, username: username, score: addedScore, won: addedWon });
		}
    },

    getUserStats: async function (guildID, userID) {
		const guildCollection = mainDB.collection(guildID);
		var result = await findOneCatch(guildCollection, { id: userID });
		if (!result) logger.info("No stats found for user " + userID);
		return result;
    },

    getTop: async function (guild, channel, lang) {
        const guildID = guild.id;
        const guildCollection = mainDB.collection(guildID);
        var result = await findCatch(guildCollection, {username: {$exists: true}}, { projection: { _id: 0, id: 1, score: 1, won: 1, username: 1 } });
		result = await result.sort({ score: -1 }).toArray();
		if (!result) logger.error("Error while getting top for guild " + guildID);
		var usersString = "";
		for (var i = 0; i < result.length; i++) {
			if (i > 10) break;
			var user = result[i];
			var nick;
			if (guild.members.get(user.id)) nick = guild.members.get(user.id).nickname || guild.members.get(user.id).user.username;
			else nick = user.username;
			usersString = usersString + "\n" + "**[ " + (i+1) + " ]** [" + lm.getString("score", lang) + ": " + user.score + "] [" + lm.getString("victory", lang) + ": " + user.won + "] **" + nick + "**";
		}
		if (result.length == 0) usersString = lm.getString("noStats", lang);
		tools.sendCatch(channel, lm.getEb(lang).getTopEmbed(usersString));
    },

    setSetting: async function (guildID, settingName, value) {
		const guildCollection = mainDB.collection(guildID);
		const settingToFind = { setting: settingName };
		var result = await findOneCatch(guildCollection, settingToFind);
		if (result) {
			var result = await updateOneCatch(guildCollection, settingToFind, { $set: { value: value } });
			if (result) logger.info("Setting " + settingName + " successfully updated to " + value);
			else logger.error("Error while updating " + settingName + " to " + value);
		} else {
			var result = await insertOneCatch(guildCollection, { setting: settingName, value: value });
			if (result) logger.info("Setting " + settingName + " successfully inserted as " + value);
			else logger.error("Error while inserting " + settingName + " as " + value);
		}
    },

    getSetting: async function (guildID, settingName) {
		const guildCollection = mainDB.collection(guildID);
		const settingToFind = { setting: settingName }
		var result = await findOneCatch(guildCollection, settingToFind);
		if (result) return result.value;
		else {
			const globalCollection = mainDB.collection("Global");
			var result = await findOneCatch(globalCollection, settingToFind);
			if (result) {
				var ok = await insertOneCatch(guildCollection, { setting: settingName, value: result.value });
				if (ok) logger.info("Setting " + settingName + " was missing in " + guildID + " and was added");
				else logger.error("Error while adding missing setting " + settingName + " in " + guildID);
				return result.value;
			}
		}
		return null;
    },

	getAllServers: async function () {
		var result = (await listCatch(mainDB)).toArray();
		if (!result) logger.error("Error while getting all servers from mainDB");
		return result || [];
    },

	getAllUsers: async function () {

		if (Date.now() - lastUsersChecking.time < 120000) return lastUsersChecking.list;

		var tempList = [];
		var usersList = [];
		// First we get all servers and we loop trough them
		var servers = await db.getAllServers();
		for(let guild of servers) {
			let guildID = guild.name;
			let guildCollection = mainDB.collection(guildID);
			// We get all the users of each servers
			var users = await findCatch(guildCollection, {username: {$exists: true}}, { projection: { _id: 0, id: 1, score: 1, won: 1, username: 1 } });
			users = await users.toArray();
			for (let user of users) {
				// We push to the list only if the score is higher (a user might be in multiple servers, we take the highest score)
				// tempList is used as temperary list to prevent having to compare objects because
				// .sort on a key value array list doesn't seem to work
				if (tempList[user.id]) tempList[user.id].score += user.score;
				else tempList[user.id] = user;
				usersList.push(tempList[user.id]);
			}
			// We sort the list by score
			usersList = usersList.sort((a, b) => (a.score < b.score) ? 1 : ((b.score < a.score) ? -1 : 0));
		}
		lastUsersChecking = {time: Date.now(), list: usersList};
		return usersList;
    }
    // ------------------------------------- SOME FUNCTIONS ------------------------------------- //
}
