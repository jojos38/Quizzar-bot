
// -------------------- SOME VARIABLES -------------------- //
var MongoClient = require('mongodb').MongoClient
const config = require('./config.json');
const { database, username, password, ip, port } = require('./dbconfig.json');
const eb = {"en": require('./locales/embeds/en.js'), "fr": require('./locales/embeds/fr.js')};
const tools = require('./tools.js');
const logger = require('./logger.js');
var client;
var mainDB;
// -------------------- SOME VARIABLES -------------------- //



module.exports = {
    // ------------------------------------- INIT AND CLOSE ------------------------------------- //
    init: function () {
        return new Promise(function (resolve, reject) {
            const url = 'mongodb://' + username + ':' + password + '@' + ip + ':' + port + '/' + database + '?authSource=admin';
            MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true, poolSize: 1 }, function (err, tempClient) {
                if (err) throw err;
                client = tempClient;
                mainDB = client.db(database);
                logger.info("Database ready");
                resolve();
            });
        });
    },
	
    close: function () {
        client.close();
		logger.info("Database closed");
    },
    // ------------------------------------- INIT AND CLOSE ------------------------------------- //



    // ------------------------------------- SOME FUNCTIONS ------------------------------------- //
    resetGuildSettings: function (guildID, guildName, channel, lang) {
		return new Promise(function (resolve, reject) {
			const guildCollection = mainDB.collection(guildID);
			if (guildCollection) {
				guildCollection.drop(function (err, result) {
					if (!err) {
						if (channel) tools.sendCatch(channel, tools.getString("resetted", lang));
						logger.info("Deleted collection from server " + guildName);
						resolve();
					} else {
						if (channel) tools.sendCatch(channel, tools.getString("resettedError", lang));
						reject(err);
					}
				});
			}
		});
    },

    addGuildChannel: function (channel, lang) {
		const channelID = channel.id;
        const guildCollection = mainDB.collection(channel.guild.id);
        guildCollection.findOne({ channel: channelID }, function (err, result) { // Try to find the channel to add
            if (result) { // If it already exist
                tools.sendCatch(channel, tools.getString("alreadyAuthorized", lang));
                return; // Return if channel already exist
            }
            guildCollection.insertOne({ channel: channelID }, function (err, item) { // Insert channel:4891657867278524898
                if (!err) {
                    tools.sendCatch(channel, tools.getString("channelAdded", lang));
                    logger.info("Document { channel:" + channelID + " } inserted successfully");
                } else {
                    tools.sendCatch(channel, tools.getString("channelAddedError", lang));
                    logger.error(err);
                }
            });
        });
    },

    removeGuildChannel: function (channel, lang) {
        const channelID = channel.id;
        const guildCollection = mainDB.collection(channel.guild.id);
        guildCollection.findOne({ channel: channelID }, function (err, result) { // Try to find the channel to add
            if (!result) { // If channel doesn't exist
                tools.sendCatch(channel, tools.getString("channelNotInList", lang));
                return;
            }
            guildCollection.deleteOne({ channel: channelID }, function (err, item) { // Delete channel:4891654898
                if (!err) {
                    tools.sendCatch(channel, tools.getString("channelDeleted", lang));
                    logger.info("Document { channel:" + channelID + " } deleted successfully");
                } else {
                    tools.sendCatch(channel, tools.getString("channelDeletedError", lang));
                    logger.error(err);
                }
            });
        });
    },

    updateUserStats: function (guildID, userID, username, addedScore, addedWon) {
        const guildCollection = mainDB.collection(guildID);
        const userToFind = { id: userID };
        guildCollection.findOne(userToFind, function (err, result) {
            if (result) {
                const finalScore = (addedScore + result.score) || addedScore;
                const finalWon = (addedWon + result.won) || addedWon;
				logger.info("Updated user " + username + " [Score: " + result.score + " => " + finalScore + ", " + "Won: " + result.won + " => " + finalWon + "]");
                guildCollection.updateOne(userToFind, { $set: { id: userID, score: finalScore, won: finalWon } });
            } else {
				logger.info("Added user " + username + " [Score: 0 => " + addedScore + ", " + "Won: 0 => " + addedWon + "]");
                guildCollection.insertOne({ id: userID, username: username, score: addedScore, won: addedWon });
            }
        });
    },

    getUserStats: function (guildID, userID) {
        return new Promise(async function (resolve, reject) {
            const guildCollection = mainDB.collection(guildID);
            guildCollection.findOne({ id: userID }, function (err, userStats) {
                resolve(userStats);
            });
        });
    },

    getTop: function (guild, channel, lang) {
        const guildID = guild.id;
        const guildCollection = mainDB.collection(guildID);
        guildCollection.find({username: {$exists: true}}, { projection: { _id: 0, id: 1, score: 1, won: 1, username: 1 } }).sort({ score: -1 }).toArray(function (err, statsTable) {
			var userNumber = 1;
            var usersString = "";	
			for (var i = 0; i < statsTable.length; i++) {
				if (i > 10) break;
				var user = statsTable[i];
				var nick;
				if (guild.members.get(user.id)) nick = guild.members.get(user.id).nickname || guild.members.get(user.id).user.username;
				else nick = user.username;
				usersString = usersString + "\n" + "**[ " + i + " ]** [ " + tools.getString("score", lang) + ": " + user.score + " ] [ " + tools.getString("victory", lang) + ": " + user.won + " ] **" + nick + "**";
			}
            if (statsTable.length == 0) {
                usersString = tools.getString("noStats", lang);
            }
            tools.sendCatch(channel, eb[lang].getTopEmbed(usersString));
        });
    },

    getGuildChannels: function (guildID) {
        return new Promise(function (resolve, reject) {
            const guildCollection = mainDB.collection(guildID);
            guildCollection.find({channel: {$exists: true}}, { projection: { _id: 0, channel: 1 } }).toArray(function (err, result) {
                if (err) throw err;
                resolve(result);
            });
        });
    },

    setSetting: function (guildID, settingName, value) {
        return new Promise(async function (resolve) {
            const guildCollection = mainDB.collection(guildID);
            const settingToFind = { setting: settingName };
            guildCollection.findOne(settingToFind, function (err, result) {
                if (result) {
                    guildCollection.updateOne(settingToFind, { $set: { value: value } });
                    resolve();
                } else {
                    guildCollection.insertOne({ setting: settingName, value: value });
                    resolve();
                }
            });
        });
    },

    getSetting: function (guildID, settingName) {
        return new Promise(async function (resolve, reject) {
            const guildCollection = mainDB.collection(guildID);
            guildCollection.findOne({ setting: settingName }, function (err, setting) {
                if (setting) {
                    resolve(setting.value);
                } else {
                    resolve(setting);
                }
            });
        });
    },
	
	getAllServers: function () {
		return new Promise(async function (resolve, reject) {
			mainDB.listCollections().toArray(function(err, collInfos) {
				resolve(collInfos);
			});
		});
    },
	
	setServerName: function (guildID, serverName) {
        return new Promise(async function (resolve) {
            const guildCollection = mainDB.collection(guildID);
            const nameToFind = { name: serverName };
            guildCollection.findOne(nameToFind, function (err, result) {
                if (result) {
                    guildCollection.updateOne(nameToFind, { $set: { name: serverName } });
                    resolve();
                } else {
                    guildCollection.insertOne({ name: serverName });
                    resolve();
                }
            });
        });
	}
    // ------------------------------------- SOME FUNCTIONS ------------------------------------- //
}
