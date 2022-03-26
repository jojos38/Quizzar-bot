/**
 * @file Useful functions and such
 * @author jojos38
 */



// -------------------- SOME VARIABLES -------------------- //
const logger = require('./logger.js');
// -------------------- SOME VARIABLES -------------------- //



module.exports = {
	/**
	 * Mention a user or a channel
	 * @param {string} id - The ID of the user or the channel
	 * @param {char} type - 'u' or 'c' for user or channel
	 */
	mention: function(id, type) {
        if (type == 'u') {
            return "<@" + id + ">";
        } else if (type == 'c') {
            return "<#" + id + ">";
        }
	},

	/**
	 * Tells if the given number is an integer
	 */
	isInt: function(value) {
		return !isNaN(value) && parseInt(Number(value)) == value && !isNaN(parseInt(value, 10));
	},

	/**
	 * Formats a timestamp to a dd:hh:mm:ss format
	 */
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

	/**
	 * Those functions are used to safely interact with the Discord api
	 */
	sendCatch: async function(channel, message) {
		const embed = typeof message === 'object';
		const messageObj = embed ? { embeds: [message] } : { content: message };
		try { return await channel.send(messageObj) }
		catch (error) { logger.warn("Error while sending message"); logger.error(error); return null; }
	},

	replyCatch: async function(interaction, message, type, ephemeral) {
		if (type === 0) var messageObj = { content: message, ephemeral: ephemeral };
		else if (type === 1) var messageObj = { embeds: [message], ephemeral: ephemeral };
		else if (type === 2) { var messageObj = message; messageObj.ephemeral = ephemeral; }
		try { return await interaction.reply(messageObj) }
		catch (error) { logger.warn("Error while replying interaction"); logger.error(error); return null; }
	},

	editCatch: async function(message, newContent) {
		try { await message.edit(newContent); }
		catch (error) { logger.warn("Can't edit message"); logger.warn(error); }
	},

	reactCatch: async function(message, reaction) {
		try { await message.react(reaction); return true;}
		catch (error) { logger.warn("Can't react to message"); logger.warn(error); return false;}
	},

	removeReactionCatch: async function(reaction, userID) {
		try { await reaction.users.remove(userID); return true;}
		catch (error) { logger.warn("Can't remove reaction from message"); logger.warn(error); return false;}
	}
}