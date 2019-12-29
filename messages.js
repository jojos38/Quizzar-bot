
// -------------------- SOME VARIABLES -------------------- //
const db = require('./database.js');
const tools = require('./tools.js');
// -------------------- SOME VARIABLES -------------------- //



module.exports = {
    getPlayersString: function(players, lang) {
        var playersString = "";
        const playersNumber = players.length;
        if (playersNumber == 0) { // If no player answered	
            playersString = tools.getString("nobodyAnswered", lang);
            return playersString;
        }
        for (var i = 0; i < playersNumber; i++) { // For each player that answered correctly
            if (playersNumber == 1) { // If only one player
                playersString = tools.getString("onePlayerAnswer", lang, {player:tools.mention(players[0].id, 'u')});
                return playersString;
            } else { // If more than one player
                if (i == 0) { // If first player of the loop
                    playersString = tools.mention(players[0].id, 'u'); // Mention it
                } else if (i + 1 < playersNumber) { // If there is a next player
                    playersString = playersString + ", " + tools.mention(players[i].id, 'u'); // Put comma
                } else { // If it's the last player			
                    playersString = playersString + tools.getString("andPlayerAnswer", lang, {player:tools.mention(players[i].id, 'u')});
                    return playersString;
                }
            }
        }
    },

	getScoreString: function(guild, scoreTable, lang) {   
		if (scoreTable.size == 0) return { 0: tools.getString("noWinner", lang), 1: "" };
		var sorted = Array.from(scoreTable.entries());
		var len = sorted.len;
		for (var i = len - 1; i >= 0; i--){
			for (var j = 1; j <= i; j++){
				if (sorted[j-1][1] > sorted[j][1]){
					var temp = sorted[j-1];
					sorted[j-1] = sorted[j];
					sorted[j] = temp;
				}
			}
		}
		len = sorted.length - 1;
		var winners = 0;
		for (var i = len; i >= 0; i--) {
			winners++;
			if (!sorted[i-1]) break;
			if (sorted[i][1] != sorted[i-1][1]) break;
		}
		var others = "";
		var winner = tools.getString("winners", lang)
		if (winners == 1)
			winner = tools.getString("oneWinner", lang, {player:tools.mention(sorted[len][0], 'u'), points:sorted[len][1]});
		else if (winners == 2)
			winner = winner + tools.getString("twoWinners", lang, {p1:tools.mention(sorted[len][0], 'u'), p2:tools.mention(sorted[len-1][0], 'u'), points:sorted[len][1]});
		else {
			for (var i = len; i > len - winners + 1; i--) {
				if (i != len - winners + 2) winner = winner + tools.mention(sorted[i][0], 'u') + ", ";
				else winner = winner + tools.mention(sorted[i][0], 'u');
			}		
			winner = winner + tools.getString("oneWinner", lang, {player:tools.mention(sorted[len-winners+1][0], 'u'), points:sorted[len][1]});
		}
		var user = winners + 1;
		for (var i = len - winners; i >= 0; i--) {
			others = others + "\n" + "[" + user + "] " + tools.mention(sorted[i][0], 'u') + " (" + sorted[i][1] + " " + tools.getString("points", lang) + ")"; 
			if (sorted[i-1]) if (sorted[i][1] != sorted[i-1][1]) user++;
			if (len - i - winners == 9) break;
		}
		if (sorted.length > 1) {
			for (var i = len; i > len - winners; i--) {
				db.updateUserStats(guild, { id: sorted[i][0], username: "" }, 0, 1); // If more than 1 player in the game
			}
		}
		return { 0: winner, 1: others };
	}
}