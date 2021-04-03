
// ------------------------------------------- SOME VARIABLES ------------------------------------------- //
const Discord = require('discord.js');
const logoURL = "https://cdn.discordapp.com/avatars/586183772136013824/60e91b15dec572463835bfb7cbd78ce7.webp?size=128";
const orange = 16750869;
const red = 15728640;
// ------------------------------------------- SOME VARIABLES ------------------------------------------- //

module.exports = {

    mention: function (id, type) {
        if (type == 'u') {
            return "<@" + id + ">";
        } else if (type == 'c') {
            return "<#" + id + ">";
        }
    },

    // ------------- COMMANDS ------------- //
    getHelpEmbed: function (prefix) {
        const embed1 = new Discord.MessageEmbed({
            color: orange,
            author: {
                name: "Here is a list of all commands:",
                icon_url: logoURL
            },
            fields: [
                {
                    name: prefix + "globaltop [user]",
                    value: "**new** - Show the global top or the position of a user (have to be tagged)"
                },
		{
                    name: prefix + "lang [language]",
                    value: " - Change the language of the bot (languages available: french / english)"
                },
                {
                    name: prefix + "play [difficulty] [questions amount] or " + prefix + "start",
                    value: " - Start a game\n**Note :** If the questions number is 0 then the game is (almost) infinite"
                },
                {
                    name: prefix + "stop",
                    value: " - Stop the current game\n**Note :** The 'manage messages' permission allows you to stop any game"
                },
                {
                    name: prefix + "diff",
                    value: " - Show all difficulties"
                },
                {
                    name: prefix + "help or " + prefix + "h",
                    value: " - Show help"
                },
                {
                    name: prefix + "info",
                    value: " - Show informations about the bot"
                },
                {
                    name: prefix + "stats",
                    value: " - Show your stats"
                },
                {
                    name: prefix + "top",
                    value: " - Show top 10 best players"
                },
                {
                    name: prefix + "admin",
                    value: " - Show admin commands\n**Note :** Require 'manage server' permission"
                },
		{
		    name: "Check out my other bot Observation!",
		    value: "https://top.gg/bot/772446137499385866"
		}
            ]
        });

        const embed2 = new Discord.MessageEmbed({
            author: {
                name: "And the rules:",
                icon_url: logoURL
            },
            color: orange,
            description: "- You can choose only one answer, the right answer will be shown at the end of the time\n- To answer, click on the corresponding reaction of the answer\n- Easy question gives **1** point\n- Medium question gives **2** points\n- Hard question gives **3** points\n- Won game gives **1** point of victory\n **Note:** To get a victory point there need to be at least two players in the game"
        });
        const embedTable = { 0: embed1, 1: embed2 };
        return embedTable;
    },


    getInfoEmbed: function (users, servers, uptime) {
        const embed = new Discord.MessageEmbed({
			author: {
				name: "Crédits:",
				icon_url: logoURL
			},
            color: orange,
            title: "Bot made by jojos38",
			description: "Link of the bot: https://top.gg/bot/586183772136013824\nThanks to https://opentdb.com/ for the questions.\nSupport server: https://discord.gg/DXpb9DN\nPatreon: https://www.patreon.com/jojos38\nTipeee: https://fr.tipeee.com/jojos38s-quizzar-bot\nMy other bot: https://top.gg/bot/772446137499385866",
			fields: [
			  {
				name: "Servers",
				value: servers,
				inline: true
			  },
			  {
				name: "Users",
				value: users,
				inline: true
			  },
			  {
				name: "Uptime",
				value: uptime,
				inline: true
			  }
			]
        });
        return embed;
    },


    getDifEmbed: function () {
        const embed = new Discord.MessageEmbed({
            color: orange,
            description: "0 : All difficulties\n1 : Easy\n2 : Medium\n3 : Hard",
            author: {
                name: "List of available difficulties:",
                icon_url: logoURL
            }
        });
        return embed;
    },
    getAdminHelpEmbed: function (prefix) {
        const embed = new Discord.MessageEmbed({
            description: "An authorized channel is a channel where bot commands are allowed.",
            color: orange,
            author: {
                name: "Here is a list of admin commands:",
                icon_url: logoURL
            },
            fields: [
				{
					name: prefix + "prefix",
					value: "Change the bot prefix"
				},
                {
                    name: prefix + "add",
                    value: "Add the current channel in the authorized channels"
                },
                {
                    name: prefix + "remove",
                    value: "Remove the current channel from the authorized channels"
                },
                {
                    name: prefix + "reset",
                    value: "Delete all bot data from the server (Authorized channels etc...)\n**Warning :** This command also delete all players stats!"
                },
                {
                    name: prefix + "channels",
                    value: "Show all authorized channels"
                },
                {
                    name: prefix + "delayquestion",
                    value: "Define the delay to answer a question **(in millisecondes) (between 2500 and 1800000)**"
                },
                {
                    name: prefix + "delayanswer",
                    value: "Define the answer display time before continuing **(in millisecondes) (between 500 and 50000)**"
                },
                {
                    name: prefix + "defdifficulty",
                    value: "Define default difficulty when it's not specified (between 0 and 3)"
                },
                {
                    name: prefix + "defquestions",
                    value: "Define default number of questions when it's not specified (between 1 and 100)"
                },
				{
                    name: prefix + "stuck",
                    value: "If the bot is stuck use this command (This command can cause unexpected results, don't us it if not needed!)"
                }
            ]
        });
        return embed;
    },
    getUserStatsEmbed: function (stats) {
        const embed = new Discord.MessageEmbed({
            author: {
                name: "Stats :",
                icon_url: logoURL
            },
            color: orange,
			fields: [
			  {
				name: "Global stats",
				value: "Score: " + (stats.global.score || 0) + "\n" + "Won : " + (stats.global.won || 0)
			  },
			  {
				name: "Guild stats",
				value: "Score: " + (stats.guild.score || 0) + "\n" + "Won : " + (stats.guild.won || 0)
			  }
			]
        });
        return embed;
    },
    getTopEmbed: function (totalUsers, topString) {
        const embed = new Discord.MessageEmbed({
            author: {
                name: "Top (" + totalUsers + " users) :",
                icon_url: logoURL
            },
            color: orange,
            description: topString
        });
        return embed;
    },
    getNoStatsEmbed: function () {
        const embed = new Discord.MessageEmbed({
            author: {
                name: "Stats :",
                icon_url: logoURL
            },
            color: orange,
            description: "No stats found, you must get at least 1 point to have stats"
        });
        return embed;
    },
    // ------------- COMMANDS------------- //

    // ------------- COMMANDS ERRORS ------------- //
    getBadDifEmbed: function () {
        const embed = new Discord.MessageEmbed({
            title: "Difficulty must be between 0 and 3",
            color: red,
        });
        return embed;
    },
    getNotAllowedEmbed: function (channelsString) {
        const embed = new Discord.MessageEmbed({
            author: {
                name: "Oops",
                icon_url: logoURL
            },
            color: red,
            title: "You are not allowed to use Quizzar commands here",
            description: "If you are admin, use !jadd to add this channel.\nTake a look here: " + channelsString
        });
        return embed;
    },
    getAlreadyRunningEmbed: function (channelID) {
        const embed = new Discord.MessageEmbed({
            title: "A game is already running",
            description: this.mention(channelID, 'c'),
            color: red
        });
        return embed;
    },
    getBadQuesEmbed: function () {
        const embed = new Discord.MessageEmbed({
            title: "Questions amount must be between 0 and 100",
            color: red,
        });
        return embed;
    },
    getWrongPlayerStopEmbed: function () {
        const embed = new Discord.MessageEmbed({
            title: "Only the player who started the game can stop it",
            color: red
        });
        return embed;
    },
    getWrongChannelEmbed: function (channel) {
        const embed = new Discord.MessageEmbed({
            title: "No games are running in this channel",
            description: "Take a look here:" + channel,
            color: red
        });
        return embed;
    },
    getNoGameRunningEmbed: function () {
        const embed = new Discord.MessageEmbed({
            title: "No game running",
            description: "Use !jplay to start a game",
            color: red
        });
        return embed;
    },
    // ------------- COMMANDS ERRORS ------------- //

    // -------------------------------- GAME -------------------------------- //
    getStartEmbed: function (difficulty, questionsAmount) {
        const embed = new Discord.MessageEmbed({
            title: "Game starting",
            description: "Difficulty : " + difficulty + "\nQuestions amount : " + questionsAmount,
            color: orange,
        });
        return embed;
    },
    getQuestionEmbed: function (qData, timeleft, embedColor) {
        // 0:thème --- 1:difficulté --- 2:question --- 3:propositions --- 4:réponse --- 5:anecdote --- 6:points --- 7:num.ques --- 8:tot.ques
        const proposals = qData.proposals;
        const embed = new Discord.MessageEmbed({
            author: {
                name: "Question " + qData.qNumber + " / " + qData.qAmount + " :",
                icon_url: logoURL
            },
            footer: {
                text: "Remaining time :⠀" + timeleft + "s",
            },
            description: "Theme : " + qData.theme + " (" + qData.difficulty + ")```yaml\n" + qData.question + "```",
            color: embedColor,
            fields: [
                {
                    name: "\u200B",
                    value: "Answer A :```- " + proposals[0] + "``` Answer C :```- " + proposals[2] + "```",
                    inline: true
                },
                {
                    name: "\u200B",
                    value: "Answer B :```- " + proposals[1] + "``` Answer D :```- " + proposals[3] + "```",
                    inline: true
                }
            ]
        });
        return embed;
    },
    getAnswerEmbed: function (answerLetter, answer, anectode, playersString, color) {
        const embed = new Discord.MessageEmbed({
            color: color,
            title: "The good answer was " + answerLetter + ": " + answer,
            description: playersString,
        });
        return embed;
    },
    getStopEmbed: function (reason) {
        const embed = new Discord.MessageEmbed({
            title: "Game will stop",
            description: reason,
            color: orange,
        });
        return embed;
    },
    getGameStoppedEmbed: function () {
        const embed = new Discord.MessageEmbed({
            title: "Game ended !",
            description: "The current game was stopped manually",
            color: orange
        });
        return embed;
    },
    getGameEndedEmbed: function (players) {
        const embed = new Discord.MessageEmbed({
            title: "Winners :",
            color: orange,
            description: players[0] + "\n" + players[1] + "\nLike the bot? Vote on https://top.gg/bot/586183772136013824\nMy other bot https://top.gg/bot/772446137499385866"
        });
        return embed;
    },
    // -------------------------------- GAME -------------------------------- //
};
