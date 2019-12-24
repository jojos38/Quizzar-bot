const db = require('./database.js');

function mention(userID) {
    return "<@" + userID + ">"
}



// Goal :
// p1 a répondu
// p1 et p2 ont répondu
// p1, p2 et p3 ont répondu


   

module.exports = {
    getPlayersString: function(players) {
        var playersString = "";
        const playersNumber = players.length;
        if (playersNumber == 0) { // If no player answered
            playersString = "Personne n'a su répondre correctement !";
            return playersString;
        }
        for (var i = 0; i < playersNumber; i++) { // For each player that answered correctly
            if (playersNumber == 1) { // If only one player
                playersString = "Seul " + mention(players[0].id) + " a su répondre correctement !";
                return playersString;
            } else { // If more than one player
                if (i == 0) { // If first player of the loop
                    playersString = mention(players[0].id); // Mention it
                } else if (i + 1 < playersNumber) { // If there is a next player
                    playersString = playersString + ", " + mention(players[i].id); // Put comma
                } else { // If it's the last player
                    playersString = playersString + " et " + mention(players[i].id) + " ont su répondre correctement !"; // "And"
                    return playersString;
                }
            }
        }
    },

	getScoreString: function(guild, scoreTable) {   
	if (scoreTable.size == 0) return { 0: "Il semblerait qu'il n'y ait aucun gagnant", 1: "" };
	var sorted = Array.from(scoreTable.entries());
	var len = sorted.length;
	for (var i = len - 1; i >= 0; i--){
		for (var j = 1; j <= i; j++){
			if (sorted[j-1][1] > sorted[j][1]){
				var temp = sorted[j-1];
				sorted[j-1] = sorted[j];
				sorted[j] = temp;
			}
		}
	}
	const length = sorted.length - 1;
	var totalWinners = 0;
	for (var i = length; i >= 0; i--) {
		totalWinners++;
		if (!sorted[i-1]) break;
		if (sorted[i][1] != sorted[i-1][1]) break;
	}
	var others = "";
	var winner = "Les gagnants de la partie sont ";
	if (totalWinners == 1)
		winner = "Le gagnant de la partie est " + mention(sorted[length][0]) + " avec un total de " + sorted[length][1] + " points !";
	else if (totalWinners == 2)
		winner = winner + mention(sorted[length][0]) + " et " + mention(sorted[length-1][0]) + " avec un total de " + sorted[length][1] + " points !";
	else {
		for (var i = length; i > length - totalWinners + 1; i--) {
			if (i != length - totalWinners + 2) winner = winner + mention(sorted[i][0]) + ", ";
			else winner = winner + mention(sorted[i][0]);
		}
		winner = winner + " et " + mention(sorted[length-totalWinners+1][0]) + " avec un total de " + sorted[length][1] + " points !";
	}
	var user = totalWinners + 1;
	for (var i = length - totalWinners; i >= 0; i--) {
		others = others + "\n" + "[" + user + "] " + mention(sorted[i][0]) + " (" + sorted[i][1] + " points)"; 
		if (sorted[i-1]) if (sorted[i][1] != sorted[i-1][1]) user++;
		if (length - i - totalWinners == 9) break;
	}
	if (sorted.length > 1) {
		for (var i = length; i > length - totalWinners; i--) {
			//db.updateUserStats(guild, { id: sorted[i][0], username: "" }, 0, 1); // If more than 1 player in the game
		}
	}
	return { 0: winner, 1: others };
}
}