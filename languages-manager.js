const logger = require('./logger.js');
const i18n = require("i18n");
var embeds;
var requests;

function loadEmbeds() {
	let embeds = {};
	let locales = i18n.getLocales();
	locales.forEach(language => {
		try {
			let path = './locales/embeds/' + language + '.js';
			if (embeds[language]) delete require.cache[require.resolve(path)];
			embeds[language] = require(path);
		} catch (error) {
			logger.error("Error while loading embed file for language " + language);
			logger.error(error);
			process.exit(1);
		}
	});
	logger.success("Loaded embeds languages: " + locales);
	return embeds;
}

async function loadRequests() {
	let requests = {};
	let locales = i18n.getLocales();
	for (const language of locales) {
		try {
			let path = './locales/questions/' + language + '.js';
			if (requests[language]) delete require.cache[require.resolve(path)];
			requests[language] = require(path);
		}
		catch (error) {
			logger.error("Error while loading questions file for language " + language);
			logger.error(error);
		}
	}
	logger.success("Loaded questions languages: " + locales);
	return requests;
}

module.exports = {
	getEb: function(lang) {
		return embeds[lang];
	},

	analyze: async function(guildID, lang, message, debug, severity) {
		var locales = i18n.getLocales();
		if (locales.includes(lang))
			return detection.analyze(message, debug, await db.getTriggerTable(lang), await db.getSetting(guildID, "S-triggerTable-" + lang) || {}, severity);
		else {
			logger.warn("Language " + lang + " does not exists");
			return {positive:false};
		}
	},

	reloadLanguages: async function() {
		i18n.configure({
			directory: __dirname + '/locales',
			extension: '.json',
		});
		logger.success("Loaded i18n languages: " + i18n.getLocales());
		embeds = loadEmbeds();
		requests = await loadRequests();
	},

	request: async function(lang, difficulty) {
		return requests[lang].getRandomQuestion(difficulty);
	},

	getString: function(name, lang, variables) {
		if (variables)
			return i18n.__({phrase:name, locale:lang}, variables).replace(/&lt;/g, "<").replace(/&gt;/g, ">");
		else
			return i18n.__({phrase:name, locale:lang});
	},

	getLocales: function() {
		return i18n.getLocales();
	}
}
