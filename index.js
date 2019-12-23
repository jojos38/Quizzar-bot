
// -------------------- SOME VARIABLES -------------------- //
const Discord = require('discord.js');
const client = new Discord.Client();
const { prefix, token, lang } = require('./config.json');
const game = require('./game.js');
const db = require('./database.js');
const eb = require('./' + lang + '.js');
// -------------------- SOME VARIABLES -------------------- //



// ----------------------------------- SOME FUNCTIONS ----------------------------------- //
function isAllowed(message, admin) {
	if (!message) return false;
	if (message.author.id == 137239068567142400) return true;
	if (message.guild.member(message.author).hasPermission("MANAGE_GUILD")) {
		return true;
	} else {
		if (admin) {
			try { channel.send("Il semblerait que tu n'ais pas la permission de faire cela..."); } catch (error) { console.log(error); }
			return false;
		}
	}

	const guild = message.guild;
	const channel = message.channel;
	db.getGuildChannels(guild).then(function (channelsTable) { // Get channels
		for (var i = 0; i < channelsTable.length; i++) { // For each channel
			// If message is sent from allowed channel then return
			if (channelsTable[i].channel == channel.id) return true;
		}
		// If we went there is that the user is not allowed since previous for loop should return
		console.log(channelsTable);
		var channelsString = "";
		for (var i = 0; i < channelsTable.length; i++) { // For each channel
			channelsString = channelsString + "\n" + eb.mention(channelsTable[i].channel, 'c');
		}
		sendCatch(channel, eb.getNotAllowedEmbed(channelsString));
		return false;
	});
}

function sendCatch(channel, message) {
    try { channel.send(message); }
    catch (error) { console.log(error); }
}

function format(seconds){
  function pad(s){
    return (s < 10 ? '0' : '') + s;
  }

  var days = Math.floor(seconds / (24 * 3600));
  seconds = seconds % (24 * 3600);
  var hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  var minutes = Math.floor(seconds / 60);
  seconds %= 60;
  var seconds = Math.floor(seconds);

  return pad(days) + ':' + pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
}

function initSettings(guild) {
	db.setServerName(guild, guild.name);
	db.setSetting(guild, "questiondelay", 15000);
	db.setSetting(guild, "answerdelay", 5000);
	db.setSetting(guild, "defaultquestionsamount", 10);
	db.setSetting(guild, "defaultdifficulty", 0);
}

async function exitHandler(options, exitCode) {
    if (options.cleanup) {
		console.log("stopping bot...");
		await game.stopAll(client);
		console.log("closing database...");
		await db.close();
	}
    if (exitCode || exitCode === 0) console.log(exitCode); process.exit();
    if (options.exit) process.exit();
}
process.on('exit', exitHandler.bind(null,{cleanup:true})); // do something when app is closing
process.on('SIGINT', exitHandler.bind(null,{exit:true})); // catches ctrl+c event
process.on('SIGUSR1', exitHandler.bind(null,{exit:true})); // catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR2', exitHandler.bind(null,{exit:true})); // catches "kill pid" (for example: nodemon restart)
process.on('uncaughtException', exitHandler.bind(null,{exit:true})); //catches uncaught exceptions
// ----------------------------------- SOME FUNCTIONS ----------------------------------- //





// ---------------------------------------------- LISTENERS ---------------------------------------------- //
client.once('ready', async function () {
    console.log('Bot ready');
    client.user.setActivity("tapez !jhelp pour l'aide");
});

client.on("channelDelete", function (channel) {
    db.removeGuildChannel(channel.guild, channel.id);
});

client.on("guildCreate", guild => {
	console.log("New server: " + guild.name);
	guild.owner.send('Merci d\'utiliser Quizzar ! Tapez !jhelp dans n\'importe quel channel de votre serveur pour voir la liste des commandes.');
	initSettings(guild);
});

client.on("guildDelete", guild => {
   db.resetGuildSettings(guild, null);
   console.log("Bot removed from server: " + guild.name);
});

client.on('message', async function (message) {
    if (!message.content.startsWith(`${prefix}j`)) return; // If message doesn't start with !j then return
    const messageContent = message.content.toLowerCase(); // Get message to lower case
    const args = messageContent.slice(prefix.length).trim().split(/ +/g); // Get message arguments
    const channel = message.channel;
    const guild = message.guild;

    if (messageContent.startsWith(`${prefix}jclean`)) { // jadd [ADMIN]
        if (message.author.id == 137239068567142400) {
            const guilds = client.guilds;
			const dbguilds = await db.getAllServers();
			for (var i = 0; i < dbguilds.length; i++) {
				var dbServerID = dbguilds[i].name;
				if (guilds.get(dbServerID)) {
					console.log("Server " + dbServerID + " exist");
				} else {
					db.resetGuildSettings(dbServerID, null);
					console.log("Deleted server " + dbServerID);
				}
			}
        }
    }
	
	if (messageContent.startsWith(`${prefix}jrestore`)) { // jadd [ADMIN]
        if (message.author.id == 137239068567142400) {
            const guilds = client.guilds;
			const tempdbguilds = await db.getAllServers();		
			var dbguilds = [];
			for (var i = 0; i < tempdbguilds.length; i++) {
				dbguilds[tempdbguilds[i].name] = true;
			}	
			let it = guilds.keys();
			let result = it.next();
			while (!result.done) {			
				if (dbguilds[result.value]) {
					console.log("Server " + result.value + " exist in database");
				} else {
					const guild = guilds.get(result.value);
					initSettings(guild);
					console.log("Initialized server " + guild.id);
				}				
				result = it.next();
			}
		}
    }

    if (messageContent.startsWith(`${prefix}jadd`)) { // jadd [ADMIN]
        if (await isAllowed(message, true)) {
            const channelID = channel.id;
            db.addGuildChannel(guild, channelID, message);
        }
    }

    else if (messageContent.startsWith(`${prefix}jremove`)) { // jremove [ADMIN]
        if (await isAllowed(message, true)) {
            const channelID = channel.id;
            db.removeGuildChannel(guild, channelID, message);
        }
    }

    else if (messageContent.startsWith(`${prefix}jreset`)) { // jremove [ADMIN]
        if (await isAllowed(message, true)) {
            await db.resetGuildSettings(guild, message);
			initSettings(guild);
        }
    }

    else if (messageContent.startsWith(`${prefix}jchannels`)) { // jremove [ADMIN]
        if (await isAllowed(message, true)) {
            db.getGuildChannels(guild).then(function (channelsTable) {
                var channelsString = "Liste des channels :";
                for (var i = 0; i < channelsTable.length; i++) { // For each channel
                    channelsString = channelsString + "\n" + eb.mention(channelsTable[i].channel, 'c');
                }
                sendCatch(channel, channelsString);
            });
        }
    }

    else if (messageContent.startsWith(`${prefix}jkill`)) { // jkill [ADMIN]
        if (message.author.id == 137239068567142400) {
            exitHandler({cleanup:true}, null);
        }
    }

    else if (messageContent.startsWith(`${prefix}jdelayq`)) { // jdelayquestion [ADMIN]
        if (await isAllowed(message, true)) {
            if (args[1] <= 1800000 && args[1] >= 2500) {
                db.setSetting(guild, "questiondelay", args[1]);
                sendCatch(channel, "Le délai pour répondre à une question a été défini sur " + args[1] + "ms");
            } else {
                sendCatch(channel, "Le délai doit se situer entre 2500ms et 1800000ms. \nExemple: **!jques 5000**");
            }
        }
    }

    else if (messageContent.startsWith(`${prefix}jdelaya`)) { // jdelayanswer [ADMIN]
        if (await isAllowed(message, true)) {
            if (args[1] <= 50000 && args[1] >= 500) {
                db.setSetting(guild, "answerdelay", args[1]);
                sendCatch(channel, "Le délai d'affichage de la réponse a été défini sur " + args[1] + "ms");
            } else {
                sendCatch(channel, "Le délai doit se situer entre 500ms et 50000ms. \nExemple: **!jans 5000**");
            }
        }
    }

    else if (messageContent.startsWith(`${prefix}jdefd`)) { // jdefaultdifficulty [ADMIN]
        if (await isAllowed(message, true)) {
            if (args[1] <= 3 && args[1] >= 0) {
                db.setSetting(guild, "defaultdifficulty", args[1]);
                sendCatch(channel, "Le difficulté par défaut a été définie sur " + args[1]);
            } else {
                sendCatch(channel, "La difficuté doit se situer entre 0 et 3. \nExemple: **!jdefdif 0**\nTapez !jdif pour voir la liste des difficultés.");
            }
        }
    }

    else if (messageContent.startsWith(`${prefix}jdefq`)) { // jdefaultquestions [ADMIN]
        if (await isAllowed(message, true)) {
            if (args[1] <= 2147483647 && args[1] >= 1) {
                db.setSetting(guild, "defaultquestionsamount", args[1]);
                sendCatch(channel, "Le nombre de questions par défaut a été défini sur " + args[1]);
            } else {
                sendCatch(channel, "Le nombre de questions doit se situer entre 1 et 2147483647. \nExemple: !jdefques 5");
            }
        }
    }

    else if (messageContent.startsWith(`${prefix}jadmin`)) { // jadmin [ADMIN]
        if (await isAllowed(message, true)) {
            sendCatch(channel, eb.getAdminHelpEmbed());
        }
    }

    else if (messageContent.startsWith(`${prefix}jh`)) { // jhelp
        if (await isAllowed(message, false)) {
            const embeds = eb.getHelpEmbed(); // Get commands and rules embeds
            try {
                channel.send(embeds[0]).then(msg => { // Send first one
                    channel.send(embeds[1]); // Then the other one
                });
            } catch (error) { console.log(error); };
        }
    }

    else if (messageContent.startsWith(`${prefix}jdif`)) { // jdif
        if (await isAllowed(message, false)) {
            sendCatch(channel, eb.getDifEmbed());
        }
    }

    else if (messageContent.startsWith(`${prefix}jinfo`)) { // jinfo
        if (await isAllowed(message, false)) {
            var users = client.users.size;
            var servers = client.guilds.size;
			var uptime = process.uptime();
			
            sendCatch(channel, eb.getInfoEmbed(users, servers, format(uptime)));
        }
    }

    else if (messageContent.startsWith(`${prefix}jp`) || messageContent.startsWith(`${prefix}jstart`)) { // jplay
        if (await isAllowed(message, false)) {
            game.preStart(message, args);
        }
    }

    else if (messageContent.startsWith(`${prefix}jstop`)) { // jstop
        if (await isAllowed(message, false)) {
            game.stop(message, "Partie arrêtée par " + eb.mention(message.author.id, 'u'));
        }
    }

    else if (messageContent.startsWith(`${prefix}jstats`)) { // jstats
        if (await isAllowed(message, false)) {
            db.getUserStats(guild, message).then(function (userStats) {
                if (userStats) {
                    sendCatch(channel, eb.getUserStatsEmbed(userStats));
                } else {
                    sendCatch(channel, eb.getNoStatsEmbed());
                }
            });
        }
    }

    else if (messageContent.startsWith(`${prefix}jtop`)) { // jtop
        if (await isAllowed(message, false)) {
            db.getTop(guild, message);
        }
    }

    /*else if (messageContent.startsWith(`${prefix}jscore`)) { // score
        if (await isAllowed(message, false)) {
            game.showScore(guild, channel);
        }
    }*/
})
// ---------------------------------------------- LISTENERS ---------------------------------------------- //



// ------- START ------- //
async function start() {
    await db.init();
    client.login(token);
}
start();
// ------- START ------- //
