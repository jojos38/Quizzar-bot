
// -------------------- SOME VARIABLES -------------------- //
var MongoClient = require('mongodb').MongoClient
const config = require('./config.json');
const { database, username, password, ip, port } = require('./dbconfig.json');
const eb = require('./' + config.lang + '.js');
var client;
var mainDB;
// -------------------- SOME VARIABLES -------------------- //



function sendCatch(channel, message) {
    try { channel.send(message); }
    catch (error) { console.log(error); }
}



module.exports = {
    // ------------------------------------- INIT AND CLOSE ------------------------------------- //
    init: function () {
        return new Promise(async function (resolve, reject) {
            const url = 'mongodb://' + username + ':' + password + '@' + ip + ':' + port + '/' + database + '?authSource=admin';
            MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true, poolSize: 1 }, async function (err, tempClient) {
                if (err) throw err;
                client = tempClient;
                mainDB = client.db(database);
                console.log("Database ready");
                resolve();
            });
        });
    },

    close: function () {
        client.close();
    },
    // ------------------------------------- INIT AND CLOSE ------------------------------------- //



    // ------------------------------------- SOME FUNCTIONS ------------------------------------- //
    resetGuildSettings: function (guild, message) {
        const guildID = guild.id;
        const guildCollection = mainDB.collection(guildID);
        if (guildCollection) {
            guildCollection.drop(function (err, result) {
                if (!err) {
                    if (message) sendCatch(message.channel, "Paramètres réinitialisés");
                    console.log("Deleted collection from server " + guild.name);
                } else {
                    if (message) sendCatch(message.channel, "Une erreur est survenue lors de la suppression des paramètres: aucun paramètre existant.");
                    console.log(err);
                }
            });
        }
    },

    addGuildChannel: function (guild, channelID, message) {
        const guildID = guild.id;
        const guildCollection = mainDB.collection(guildID);
        guildCollection.findOne({ channel: channelID }, function (err, result) { // Try to find the channel to add
            if (result) { // If it already exist
                sendCatch(message.channel, "Ce salon est déjà dans la liste des salons autorisés.");
                return; // Return if channel already exist
            }
            guildCollection.insertOne({ channel: channelID }, function (err, item) { // Insert channel:4891657867278524898
                if (!err) {
                    sendCatch(message.channel, "Le salon a été ajouté avec succés");
                    console.log("Document { channel:" + channelID + " } inserted successfully");
                } else {
                    sendCatch(message.channel, "Une erreur est survenue lors de l'ajout du salon.");
                    console.log(err);
                }
            });
        });
    },

    removeGuildChannel: function (guild, channelID, message) {
        const guildID = guild.id;
        const guildCollection = mainDB.collection(guildID);
        guildCollection.findOne({ channel: channelID }, function (err, result) { // Try to find the channel to add
            if (!result) { // If it already exist
                if (message) sendCatch(message.channel, "Ce salon n'est pas dans la liste des channels autorisés.");
                return;
            }
            guildCollection.deleteOne({ channel: channelID }, function (err, item) { // Delete channel:4891654898
                if (!err) {
                    if (message) sendCatch(message.channel, "Le salon a été supprimé avec succés");
                    console.log("Document { channel:" + channelID + " } deleted successfully");
                } else {
                    if (message) sendCatch(message.channel, "Une erreur est survenue lors de la suppression du salon.");
                    console.log(err);
                }
            });
        });
    },

    updateUserStats: function (guild, user, newScore, wonGame) {
        const userID = user.id;
        const username = user.username;
        const guildID = guild.id;
        const guildCollection = mainDB.collection(guildID);
        const userToFind = { user: userID };
        guildCollection.findOne(userToFind, function (err, result) {
            if (result) {
                const finalScore = (newScore + result.score) || newScore;
                const finalWon = (wonGame + result.won) || wonGame;
				console.log("Updated user " + username + " [Score: " + result.score + " => " + finalScore + ", " + "Won: " + result.won + " => " + finalWon + "]");
                guildCollection.updateOne(userToFind, { $set: { user: userID, score: finalScore, won: finalWon } });
            } else {
                guildCollection.insertOne({ user: userID, username: username, score: newScore, won: wonGame });
            }
        });
    },

    getUserStats: function (guild, message) {
        return new Promise(async function (resolve, reject) {
            const guildID = guild.id;
            const guildCollection = mainDB.collection(guildID);
            const userID = message.author.id;
            guildCollection.findOne({ user: userID }, function (err, userStats) {
                resolve(userStats);
            });
        });
    },

    getTop: function (guild, message) {
        const guildID = guild.id;
        const guildCollection = mainDB.collection(guildID);
        guildCollection.find({}, { projection: { _id: 0, user: 1, score: 1, won: 1, username: 1 } }).sort({ score: -1 }).toArray(function (err, statsTable) {
            var userNumber = 1;
            var usersString = "";
            for (var i = 0; i < statsTable.length; i++) {
                if (statsTable[i].user != null) {
                    var user = statsTable[i];
                    if (userNumber > 10) break;
                    usersString = usersString + "\n" + "**[ " + userNumber + " ]** - [ score : " + user.score + " ] - [ victoires : " + user.won + " ] - **" + user.username + "**";
                    userNumber++;
                }
            }
            if (statsTable.length == 0) {
                usersString = "Aucune donnée de statistiques";
            }
            try { message.channel.send(eb.getTopEmbed(usersString)) } catch (error) { console.log(error); }
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
