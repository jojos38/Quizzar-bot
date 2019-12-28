
// -------------------- SOME VARIABLES -------------------- //
const i18n = require("i18n");
const logger = require('./logger.js');
i18n.configure({
    //locales:['en', 'fr'],
    directory: __dirname + '/locales',
	extension: '.json',
});
// -------------------- SOME VARIABLES -------------------- //



module.exports = {
	getLocales: function() {
		return i18n.getLocales();
	},
	
	shuffle: function(a) {
		var j, x, i;
		for (i = a.length - 1; i > 0; i--) {
			j = Math.floor(Math.random() * (i + 1));
			x = a[i];
			a[i] = a[j];
			a[j] = x;
		}
		return a;
	},
	
	mention: function(id, type) {
        if (type == 'u') {
            return "<@" + id + ">";
        } else if (type == 'c') {
            return "<#" + id + ">";
        }
	},
	
	isInt: function(value) {
		return !isNaN(value) && parseInt(Number(value)) == value && !isNaN(parseInt(value, 10));
	},
	
	getString: function(name, lang, variables) {
		if (variables)
			return i18n.__({phrase:name, locale:lang}, variables).replace(/&lt;/g, "<").replace(/&gt;/g, ">");
		else
			return i18n.__({phrase:name, locale:lang});
	},
	
	format: function(seconds) {
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
	},
	
	sendCatch: async function(channel, message) {
		try { return await channel.send(message); }
		catch (error) { logger.error(error); }
	},
	
	editCatch: async function(message, newContent) {
		try { await message.edit(newContent); }
		catch (error) { logger.error("Error while editing message"); }
	},
	
	reactCatch: async function(message, reaction) {
		try { await message.react(reaction); return true;}
		catch (error) { logger.error("Error while reaction to message"); return false;}
	}
	
}
