/**
 * @file Manages complex messages
 * @author jojos38
 */



// -------------------- SOME VARIABLES -------------------- //
const tools = require('tools.js');
// -------------------- SOME VARIABLES -------------------- //



module.exports = {
	/**
	 * Returns a string of every channel the bot is allowed to be used in
	 * @param {Array} channels - An array of every channel ID
	 */
	getChannelsString: function(channels, lang) {
		var channelsString = "";
		// Loop trough each channe and add them to a string
		for (var i = 0; i < channels.length; i++) {
			channelsString = channelsString + "\n" + tools.mention(channels[i].channelID, 'c');
		}
		// If the string is empty, mean there was no channel
		if (channelsString == "") channelsString = lm.getString("settings.noChannel", lang);
		return channelsString;
	},

	/**
	 * Returns a string of every player that answered correctly
	 * @param {Map} players - A map of every player nickname and ID
	 */
	getPlayersString: function(players, lang) {
        let playersString = "";
        const playersNumber = players.size;
        if (playersNumber == 0) { // If no player answered
            playersString = lm.getString("game.nobodyAnswered", lang);
            return playersString;
        } else if (playersNumber == 1) { // If only one player
			playersString = lm.getString("game.onePlayerAnswer", lang, {player:tools.mention(players.keys().next().value, 'u')});
			return playersString;
		}

		let i = 0;
        for (const [userID, username] of players.entries()) { // For each player that answered correctly
			if (i == 0) { // If first player of the loop
				playersString = tools.mention(userID, 'u'); // Mention it
			} else if (i + 1 < playersNumber) { // If there is a next player
				playersString = playersString + ", " + tools.mention(userID, 'u'); // Put comma
			} else { // If it's the last player
				playersString = playersString + lm.getString("game.andPlayerAnswer", lang, {player:tools.mention(userID, 'u')});
				return playersString;
			}
			i++;
        }
    },

	/**
	 * Returns a string of every winner and the scores
	 * @param {Map} players - A map of every player ID and score
	 */
	getScoreString: function(guild, scoreTable, lang, db) {
		// Check if scoreTable exists and if there is at least one score
		if (!scoreTable) return {0: "Error", 1: "Error"};
		if (Object.entries(scoreTable).length == 0) return { 0: lm.getString("game.noWinner", lang), 1: "" };

		// Convert the score map to an array
		let sorted = [];
		for (const [userID, score] of Object.entries(scoreTable))
			sorted.push([userID, score]);

		// Sort by score
		sorted.sort(function(a, b) {
			return a[1] - b[1];
		});
		let len = sorted.length - 1;

		// Check how many winners there are
		let winners = 0;
		for (let i = len; i >= 0; i--) {
			winners++;
			if (!sorted[i-1]) break;
			if (sorted[i][1] != sorted[i-1][1]) break;
		}

		// I made this code a long time ago
		// I don't understand it myself but hey, it works
		let others = "";
		let winner = lm.getString("game.winners", lang)
		if (winners == 1)
			winner = lm.getString("game.oneWinner", lang, {player:tools.mention(sorted[len][0], 'u'), points:sorted[len][1]});
		else if (winners == 2)
			winner = winner + lm.getString("game.twoWinners", lang, {p1:tools.mention(sorted[len][0], 'u'), p2:tools.mention(sorted[len-1][0], 'u'), points:sorted[len][1]});
		else {
			for (let i = len; i > len - winners + 1; i--) {
				if (i != len - winners + 2) winner = winner + tools.mention(sorted[i][0], 'u') + ", ";
				else winner = winner + tools.mention(sorted[i][0], 'u');
			}
			winner = winner + lm.getString("game.mutlipleWinners", lang, {player:tools.mention(sorted[len-winners+1][0], 'u'), points:sorted[len][1]});
		}
		let user = winners + 1;
		for (let i = len - winners; i >= 0; i--) {
			others = others + "\n" + "[" + user + "] " + tools.mention(sorted[i][0], 'u') + " (" + sorted[i][1] + " " + lm.getString("points", lang) + ")";
			if (sorted[i-1]) if (sorted[i][1] != sorted[i-1][1]) user++;
			if (len - i - winners == 9) break;
		}
		if (sorted.length > 1) {
			for (let i = len; i > len - winners; i--) {
				db.updateUserStats(guild.id, sorted[i][0], "", 0, 1); // If more than 1 player in the game
			}
		}
		return { 0: winner, 1: others };
	}
}