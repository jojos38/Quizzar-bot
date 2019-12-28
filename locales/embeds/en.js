
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
    getHelpEmbed: function () {
        const embed1 = new Discord.RichEmbed({
            color: orange,
            author: {
                name: "Here is a list of all commands:",
                icon_url: logoURL
            },
            fields: [
				{
                    name: "**!jlang** [language]",
                    value: " - **NEW** Change the language of the bot (Languages available: french / english)"
                },	
                {
                    name: "**!jplay** [difficulty] [questions amount] or !jp or !jstart",
                    value: " - Start a game\n**Note :** If the questions number is 0 then the game is (almost) infinite"
                },
                {
                    name: "**!jstop**",
                    value: " - Stop the current game\n**Note :** The 'manage messages' permission allows you to stop any game"
                },
                {
                    name: "**!jdiff**",
                    value: " - Show all difficulties"
                },
                {
                    name: "**!jhelp** ou !jh",
                    value: " - Show help"
                },
                {
                    name: "**!jinfo**",
                    value: " - Show informations about the bot"
                },
                {
                    name: "**!jstats**",
                    value: " - Show your stats"
                },
                {
                    name: "**!jtop**",
                    value: " - Show top 10 best players"
                },
                {
                    name: "**!jadmin**",
                    value: " - Show admin commands\n**Note :** Require 'manage server' permission"
                }
            ]
        });

        const embed2 = new Discord.RichEmbed({
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
        const embed = new Discord.RichEmbed({
			author: {
				name: "Crédits:",
				icon_url: logoURL
			},
            color: orange,
            title: "Bot made by jojos38",
			description: "Link of the bot: https://top.gg/bot/586183772136013824\nThanks to https://opentdb.com/ for the questions.",
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
        const embed = new Discord.RichEmbed({
            color: orange,
            description: "0 : All difficulties\n1 : Easy\n2 : Medium\n3 : Hard",
            author: {
                name: "List of available difficulties:",
                icon_url: logoURL
            }
        });
        return embed;
    },
    getAdminHelpEmbed: function () {
        const embed = new Discord.RichEmbed({
            description: "An authorized channel is a channel where bot commands are allowed.",
            color: orange,
            author: {
                name: "Here is a list of admin commands:",
                icon_url: logoURL
            },
            fields: [
                {
                    name: "!jadd",
                    value: "Add the current channel in the authorized channels"
                },
                {
                    name: "!jremove",
                    value: "Remove the current channel from the authorized channels"
                },
                {
                    name: "!jreset",
                    value: "Delete all bot data from the server (Authorized channels etc...)\n**Warning :** This command also delete all players stats!"
                },
                {
                    name: "!jchannels",
                    value: "Show all authorized channels"
                },
                {
                    name: "!jdelayquestion",
                    value: "Define the delay to answer a question **(in millisecondes) (between 2500 and 1800000)**"
                },
                {
                    name: "!jdelayanswer",
                    value: "Define the answer display time before continuing **(in millisecondes) (between 500 and 50000)**"
                },
                {
                    name: "!jdefdifficulty",
                    value: "Define default difficulty when it's not specified (between 0 and 3)"
                },
                {
                    name: "!jdefquestions",
                    value: "Define default number of questions when it's not specified (between 1 and 100)"
                }

            ]
        });
        return embed;
    },
    getUserStatsEmbed: function (userStats) {
        const embed = new Discord.RichEmbed({
            author: {
                name: "Stats :",
                icon_url: logoURL
            },
            color: orange,
            description: "Won games : " + userStats.won + "\nTotal score : " + userStats.score
        });
        return embed;
    },
    getTopEmbed: function (topString) {
        const embed = new Discord.RichEmbed({
            author: {
                name: "Top :",
                icon_url: logoURL
            },
            color: orange,
            description: topString
        });
        return embed;
    },
    getNoStatsEmbed: function () {
        const embed = new Discord.RichEmbed({
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
        const embed = new Discord.RichEmbed({
            title: "Difficulty must be between 0 and 3",
            color: red,
        });
        return embed;
    },
    getNotAllowedEmbed: function (channelsString) {
        const embed = new Discord.RichEmbed({
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
        const embed = new Discord.RichEmbed({
            title: "A game is already running",
            description: this.mention(channelID, 'c'),
            color: red
        });
        return embed;
    },
    getBadQuesEmbed: function () {
        const embed = new Discord.RichEmbed({
            title: "Questions amount must be between 0 and 100",
            color: red,
        });
        return embed;
    },
    getWrongPlayerStopEmbed: function () {
        const embed = new Discord.RichEmbed({
            title: "Only the player who started the game can stop it",
            color: red
        });
        return embed;
    },
    getWrongChannelEmbed: function (channel) {
        const embed = new Discord.RichEmbed({
            title: "No games are running in this channel",
            description: "Take a look here:" + channel,
            color: red
        });
        return embed;
    },
    getNoGameRunningEmbed: function () {
        const embed = new Discord.RichEmbed({
            title: "No game running",
            description: "Use !jplay to start a game",
            color: red
        });
        return embed;
    },
    // ------------- COMMANDS ERRORS ------------- //

    // -------------------------------- GAME -------------------------------- //
    getStartEmbed: function (difficulty, questionsAmount) {
        const embed = new Discord.RichEmbed({
            title: "Game starting",
            description: "Difficulty : " + difficulty + "\nQuestions amount : " + questionsAmount,
            color: orange,
        });
        return embed;
    },
    getQuestionEmbed: function (qData, timeleft, embedColor) {
        // 0:thème --- 1:difficulté --- 2:question --- 3:propositions --- 4:réponse --- 5:anecdote --- 6:points --- 7:num.ques --- 8:tot.ques
        const proposals = qData.proposals;
        const embed = new Discord.RichEmbed({
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
        const embed = new Discord.RichEmbed({
            color: color,
            title: "The good answer was " + answerLetter + ": " + answer,
            description: playersString,
        });
        return embed;
    },
    getStopEmbed: function (reason) {
        const embed = new Discord.RichEmbed({
            title: "Game will stop at the end of the current question",
            description: reason,
            color: orange,
        });
        return embed;
    },
    getGameStoppedEmbed: function () {
        const embed = new Discord.RichEmbed({
            title: "Game ended !",
            description: "The current game was stopped manually",
            color: orange
        });
        return embed;
    },
    getGameEndedEmbed: function (players) {
        const embed = new Discord.RichEmbed({
            title: "Winners :",
            color: orange,
            description: players[0] + "\n" + players[1] + "\n\nIf you like the bot, you can vote for it on \nhttps://top.gg/bot/586183772136013824"
        });
        return embed;
    },
    // -------------------------------- GAME -------------------------------- //
};
