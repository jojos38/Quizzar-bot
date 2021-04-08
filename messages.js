
// -------------------- SOME VARIABLES -------------------- //
const tools = require('tools.js');
// -------------------- SOME VARIABLES -------------------- //

module.exports = {
    getPlayersString: function(players, lang) {
        var playersString = "";
        const playersNumber = players.size;
        if (playersNumber == 0) { // If no player answered	
            playersString = lm.getString("nobodyAnswered", lang);
            return playersString;
        } else if (playersNumber == 1) { // If only one player
			playersString = lm.getString("onePlayerAnswer", lang, {player:tools.mention(players.keys().next().value, 'u')});
			return playersString;
		}
		
		let i = 0;
        for (const [userID, username] of goodAnswerPlayers.entries()) { // For each player that answered correctly
			if (i == 0) { // If first player of the loop
				playersString = tools.mention(userID, 'u'); // Mention it
			} else if (i + 1 < playersNumber) { // If there is a next player
				playersString = playersString + ", " + tools.mention(userID, 'u'); // Put comma
			} else { // If it's the last player			
				playersString = playersString + lm.getString("andPlayerAnswer", lang, {player:tools.mention(userID, 'u')});
				return playersString;
			}
			i++;
        }
    },

	getScoreString: function(guild, scoreTable, lang, db) {
		if (!scoreTable) return {0: "Error", 1: "Error"};
		if (Object.entries(scoreTable).length == 0) return { 0: lm.getString("noWinner", lang), 1: "" };

		var sorted = [];
		for (const [userID, score] of Object.entries(scoreTable))
			sorted.push([userID, score]);

		sorted.sort(function(a, b) {
			return a[1] - b[1];
		});
		let len = sorted.length - 1;

		var winners = 0;
		for (let i = len; i >= 0; i--) {
			winners++;
			if (!sorted[i-1]) break;
			if (sorted[i][1] != sorted[i-1][1]) break;
		}

		var others = "";
		var winner = lm.getString("winners", lang)
		if (winners == 1)
			winner = lm.getString("oneWinner", lang, {player:tools.mention(sorted[len][0], 'u'), points:sorted[len][1]});
		else if (winners == 2)
			winner = winner + lm.getString("twoWinners", lang, {p1:tools.mention(sorted[len][0], 'u'), p2:tools.mention(sorted[len-1][0], 'u'), points:sorted[len][1]});
		else {
			for (let i = len; i > len - winners + 1; i--) {
				if (i != len - winners + 2) winner = winner + tools.mention(sorted[i][0], 'u') + ", ";
				else winner = winner + tools.mention(sorted[i][0], 'u');
			}		
			winner = winner + lm.getString("mutlipleWinners", lang, {player:tools.mention(sorted[len-winners+1][0], 'u'), points:sorted[len][1]});
		}
		var user = winners + 1;
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