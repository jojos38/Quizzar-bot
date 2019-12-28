
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
        return new Promise(async function (resolve, reject) {
            const url = 'mongodb://' + username + ':' + password + '@' + ip + ':' + port + '/' + database + '?authSource=admin';
            MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true, poolSize: 1 }, async function (err, tempClient) {
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
    },
    // ------------------------------------- INIT AND CLOSE ------------------------------------- //



    // ------------------------------------- SOME FUNCTIONS ------------------------------------- //
    resetGuildSettings: function (guildID, guildName, message, lang) {
        const guildCollection = mainDB.collection(guildID);
        if (guildCollection) {
            guildCollection.drop(function (err, result) {
                if (!err) {
                    if (message) tools.sendCatch(message.channel, tools.getString("resetted", lang));
                    logger.info("Deleted collection from server " + guildName);
                } else {
                    if (message) tools.sendCatch(message.channel, tools.getString("resettedError", lang));
                    logger.error(err);
                }
            });
        }
    },

    addGuildChannel: function (guild, channelID, message, lang) {
        const guildID = guild.id;
        const guildCollection = mainDB.collection(guildID);
        guildCollection.findOne({ channel: channelID }, function (err, result) { // Try to find the channel to add
            if (result) { // If it already exist
                tools.sendCatch(message.channel, tools.getString("alreadyAuthorized", lang));
                return; // Return if channel already exist
            }
            guildCollection.insertOne({ channel: channelID }, function (err, item) { // Insert channel:4891657867278524898
                if (!err) {
                    tools.sendCatch(message.channel, tools.getString("channelAdded", lang));
                    logger.info("Document { channel:" + channelID + " } inserted successfully");
                } else {
                    tools.sendCatch(message.channel, tools.getString("channelAddedError", lang));
                    logger.error(err);
                }
            });
        });
    },

    removeGuildChannel: function (guild, channelID, message, lang) {
        const guildID = guild.id;
        const guildCollection = mainDB.collection(guildID);
        guildCollection.findOne({ channel: channelID }, function (err, result) { // Try to find the channel to add
            if (!result) { // If it already exist
                if (message) tools.sendCatch(message.channel, tools.getString("channelNotInList", lang));
                return;
            }
            guildCollection.deleteOne({ channel: channelID }, function (err, item) { // Delete channel:4891654898
                if (!err) {
                    if (message) tools.sendCatch(message.channel, tools.getString("channelDeleted", lang));
                    logger.info("Document { channel:" + channelID + " } deleted successfully");
                } else {
                    if (message) tools.sendCatch(message.channel, tools.getString("channelDeletedError", lang));
                    logger.error(err);
                }
            });
        });
    },

    updateUserStats: function (guild, user, newScore, wonGame) {
        const userID = user.id;
        const username = user.username;
        const guildID = guild.id;
        const guildCollection = mainDB.collection(guildID);
        const userToFind = { id: userID };
        guildCollection.findOne(userToFind, function (err, result) {
            if (result) {
                const finalScore = (newScore + result.score) || newScore;
                const finalWon = (wonGame + result.won) || wonGame;
				logger.info("Updated user " + username + " [Score: " + result.score + " => " + finalScore + ", " + "Won: " + result.won + " => " + finalWon + "]");
                guildCollection.updateOne(userToFind, { $set: { id: userID, score: finalScore, won: finalWon } });
            } else {
				logger.info("Added user " + username + " [Score: 0 => " + newScore + ", " + "Won: 0 => " + wonGame + "]");
                guildCollection.insertOne({ id: userID, username: username, score: newScore, won: wonGame });
            }
        });
    },

    getUserStats: function (guild, message) {
        return new Promise(async function (resolve, reject) {
            const guildID = guild.id;
            const guildCollection = mainDB.collection(guildID);
            const userID = message.author.id;
            guildCollection.findOne({ id: userID }, function (err, userStats) {
                resolve(userStats);
            });
        });
    },

    getTop: function (guild, message, lang) {
        const guildID = guild.id;
        const guildCollection = mainDB.collection(guildID);
        guildCollection.find({}, { projection: { _id: 0, id: 1, score: 1, won: 1, username: 1 } }).sort({ score: -1 }).toArray(function (err, statsTable) {
            var userNumber = 1;
            var usersString = "";
            for (var i = 0; i < statsTable.length; i++) {
                if (statsTable[i].id != null) {
                    var user = statsTable[i];
                    if (userNumber > 10) break;
					var nick;
					if (guild.members.get(user.id)) {
						nick = guild.members.get(user.id).nickname || guild.members.get(user.id).user.username;
					} else {
						nick = user.username;
					}
					usersString = usersString + "\n" + "**[ " + userNumber + " ]** - [ " + tools.getString("score", lang) + " : " + user.score + " ] - [ " + tools.getString("victory", lang) + " : " + user.won + " ] - **" + nick + "**";
                    userNumber++;
                }
            }
            if (statsTable.length == 0) {
                usersString = tools.getString("noStats", lang);
            }
            tools.sendCatch(message.channel, eb[lang].getTopEmbed(usersString));
        });
    },

    getGuildChannels: function (guild) {
        return new Promise(function (resolve, reject) {
            const guildID = guild.id;
            const guildCollection = mainDB.collection(guildID);
            guildCollection.find({}, { projection: { _id: 0, channel: 1 } }).toArray(function (err, result) {
                if (err) throw err;
                resolve(result);
            });
        });
    },

    setSetting: function (guild, settingName, value) {
        return new Promise(async function (resolve) {
            const guildID = guild.id;
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

    getSetting: function (guild, settingName) {
        return new Promise(async function (resolve, reject) {
            const guildID = guild.id;
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
	
	setServerName: function (guild, serverName) {
        return new Promise(async function (resolve) {
            const guildID = guild.id;
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
