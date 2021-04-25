/**
* @file Manages the database inputs / outputs
* @author jojos38
*/



// --------- SOME VARIABLES --------- //
const logoURL = "https://cdn.discordapp.com/avatars/586183772136013824/60e91b15dec572463835bfb7cbd78ce7.webp?size=128";
const Discord = require('discord.js');
const logger = require('logger.js');
const tools = require('tools.js');
const orange = 16750869;
const red = 15728640;
// --------- SOME VARIABLES --------- //



class LanguageManager {
	#i18n;
	#embeds;

	constructor() {
		this.#i18n = require("i18n");
	}

	/**
	* Initialize i18n
	*/
	async init() {
		this.#i18n.configure({
			directory: __dirname + '/locales',
			retryInDefaultLocale: true,
			objectNotation: true,
			defaultLocale: 'en',
			extension: '.json',
			autoReload: true,
			missingKeyFn: function (locale, value) {
				logger.error("Translation " + value + " does not exists in " + locale);
			}
		});
		logger.success("Loaded i18n languages: " + this.getLocales());
	}

	getString(name, lang, variables) {
		if (variables)
			return this.#i18n.__({phrase:name, locale:lang}, variables);
		else
			return this.#i18n.__({phrase:name, locale:lang});
	}

	getLocales() {
		return this.#i18n.getLocales();
	}

	getHelpEmbed(lang, prefix) {
		const t = JSON.parse(JSON.stringify(this.getString("embeds.help", lang)));
		for (let i = 0; i < t.fields.length - 1; i++)
			t.fields[i].name = prefix + t.fields[i].name;
		return new Discord.MessageEmbed({
			color: orange,
			author: { name: t.author, icon_url: logoURL },
			fields: t.fields
		});
	}

	getInfoEmbed(lang, users, servers, uptime) {
		const t = this.getString("embeds.info", lang);
		return new Discord.MessageEmbed({
			color: orange,
			author: { name: t.title, icon_url: logoURL },
			title: t.title,
			description: t.description,
			fields: [
				{ name: t.servers, value: servers, inline: true },
				{ name: t.users, value: users, inline: true },
				{ name: t.uptime, value: uptime, inline: true }
			]
		});
	}

	getDifEmbed(lang) {
		const t = this.getString("embeds.difficulties", lang);
		return new Discord.MessageEmbed({
			color: orange,
			description: t.description,
			author: { name: t.name, icon_url: logoURL }
		});
	}

	getAdminHelpEmbed(lang, prefix) {
		const t = JSON.parse(JSON.stringify(this.getString("embeds.admin", lang)));
		for (let i = 0; i < t.fields.length; i++)
			t.fields[i].name = prefix + t.fields[i].name;
		return new Discord.MessageEmbed({
			description: t.description,
			color: orange,
			author: { name: t.name, icon_url: logoURL },
			fields: t.fields
		});
	}

	getUserStatsEmbed(lang, stats) {
		const t = this.getString("embeds.stats", lang);
		return new Discord.MessageEmbed({
		author: { name: t.name,icon_url: logoURL },
		color: orange,
		fields: [
			{
				name: t.global,
				value: t.score + (stats.global.score || 0) + "\n" + t.won + (stats.global.won || 0)
			},
			{
				name: t.guild,
				value: t.score + (stats.guild.score || 0) + "\n" + t.won + (stats.guild.won || 0)
			}
		]
		});
	}

	getNoStatsEmbed(lang) {
		return new Discord.MessageEmbed({
			color: orange,
			author: {
				name: this.getString("embeds.noStats", lang),
				icon_url: logoURL
			}
		});
	}

	getTopEmbed(lang, totalUsers, users) {
		if (totalUsers == 0) return this.getNoStatsEmbed(lang);
		const t = this.getString("embeds.top", lang);
		let descUsers;
		let descScore;
		let descPosition;
		let i = 1;
		for (let user of users) {
			descPosition = descPosition ? descPosition + "\n" + i : i;
			descUsers = descUsers ? descUsers + "\n" + user.position : user.position;
			descScore = descScore ? descScore + "\n" + user.won + " - " + user.score : user.won + " - " + user.score;
			i++;
		}
		return new Discord.MessageEmbed({
			author: {
				name: this.getString("embeds.top.title", lang, {totalUsers}),
				icon_url: logoURL
			},
			fields: [
				{ name: "#", value: descPosition, inline: true },
				{ name: t.username, value: descUsers, inline: true },
				{ name: t.wonScore, value: descScore, inline: true}
			],
			color: orange
		});
	}

	getBadDifEmbed(lang) {
		const t = this.getString("embeds.badDif", lang);
		return new Discord.MessageEmbed({
			title: t.title,
			color: red
		});
	}

	getNotAllowedEmbed(lang, channelsString) {
		const t = this.getString("embeds.notAllowed", lang);
		return new Discord.MessageEmbed({
			author: { name: t.name, icon_url: logoURL },
			color: red,
			title: t.title,
			description: t.description + channelsString
		});
	}

	getAlreadyRunningEmbed(lang, channelID) {
		const t = this.getString("embeds.alreadyRunning", lang);
		return new Discord.MessageEmbed({
			title: t.title,
			description: tools.mention(channelID, 'c'),
			color: red
		});
	}

	getBadQuesEmbed(lang) {
		const t = this.getString("embeds.badQues", lang);
		return new Discord.MessageEmbed({
			title: t.title,
			color: red,
		});
	}

	getWrongPlayerStopEmbed(lang) {
		const t = this.getString("embeds.wrongPlayerStop", lang);
		return new Discord.MessageEmbed({
			title: t.title,
			color: red
		});
	}

	getNoGameRunningEmbed(lang) {
		const t = this.getString("embeds.noGameRunning", lang);
		return new Discord.MessageEmbed({
			title: t.title,
			description: t.description,
			color: red
		});
	}

	getStopEmbed(lang, reason) {
		const t = this.getString("embeds.stop", lang);
		return new Discord.MessageEmbed({
			title: t.title,
			description: reason,
			color: orange,
		});
	}

	getGameStoppedEmbed(lang) {
		const t = this.getString("embeds.gameStopped", lang);
		return new Discord.MessageEmbed({
			title: t.title,
			description: t.description,
			color: orange
		});
	}

	getGameEndedEmbed(lang, players) {
		const t = this.getString("embeds.gameEnded", lang);
		return new Discord.MessageEmbed({
			title: t.title,
			color: orange,
			description: players[0] + "\n" + players[1] + "\n" + t.description
		});
	}

	getStartEmbed(lang, difficulty, questionsAmount) {
		const t = this.getString("embeds.gameStarted", lang);
		return new Discord.MessageEmbed({
			title: "Game starting",
			description: t.difficulty + difficulty + "\n" + t.questions + questionsAmount,
			color: orange,
		});
	}

	getQuestionEmbed(lang, qData, qNumber, qTotal, timeleft, embedColor) {
		const t = this.getString("embeds.question", lang);
		const proposals = qData.proposals;
		return new Discord.MessageEmbed({
			author: {
				name: this.getString("embeds.question.header", lang, { qNumber, qTotal }),
				icon_url: logoURL
			},
			footer: {
				text: t.remaining + timeleft + "s",
			},
			description: t.theme + qData.theme + " (" + t.difficulties[qData.difficulty] + ")```yaml\n" + qData.question + "```",
			color: embedColor,
			fields: [
				{
					name: "\u200B",
					value: t.answer + "A :```- " + proposals[0] + "``` " + t.answer + "C :```- " + proposals[2] + "```",
					inline: true
				},
				{
					name: "\u200B",
					value: t.answer + "B :```- " + proposals[1] + "``` " + t.answer + "D :```- " + proposals[3] + "```",
					inline: true
				}
			]
		});
	}

	getAnswerEmbed(lang, answerLetter, answer, anecdote, playersString, color) {
		const t = this.getString("embeds.answer", lang);
		if (anecdote) var description = "```" + anecdote + "```\n" + playersString;
		else var description = playersString;
		return new Discord.MessageEmbed({
			color: color,
			title: t.answer + answerLetter + ": " + answer,
			description: description,
		});
	}
}

module.exports = LanguageManager;


