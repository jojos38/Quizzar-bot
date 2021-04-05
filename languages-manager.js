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

module.exports = {
	getEb: function(lang) {
		return embeds[lang];
	},

	reloadLanguages: async function() {
		i18n.configure({
			directory: __dirname + '/locales',
			extension: '.json',
		});
		logger.success("Loaded i18n languages: " + i18n.getLocales());
		embeds = loadEmbeds();
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
