const db = require('./database.js');

function mention(userID) {
    return "<@" + userID + ">"
}



// Goal :
// p1 a répondu
// p1 et p2 ont répondu
// p1, p2 et p3 ont répondu

module.exports = {

    getPlayersString: function (players) {
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

    getScoreString: function (guild, scoreTable) {   
        if (scoreTable.size == 0) return { 0: "Il semblerait qu'il n'y ait aucun gagnant", 1: "" };
		// Sort the score in descending order (10, 7, 6, 2, 1...)
        scoreTable[Symbol.iterator] = function* () {
            yield* [...this.entries()].sort((b, a) => a[1] - b[1]);
        }
		// Put everything in a table with index
		var i = 0;
		var newScoreTable = [];
		for (let [id, points] of scoreTable) {
			newScoreTable[i] = {id:id, points:points};
			i++
		}
		
        var others = "";
        var winner = "";
        var userNumber = 1;
        for (var i = 0; i < newScoreTable.length; i++) {

            const id = newScoreTable[i].id;
            const points = newScoreTable[i].points;
			var nextPoints;
			if (newScoreTable[i+1]) nextPoints = newScoreTable[i+1].points;
			
            if (userNumber == 1 && points != nextPoints && i == 0) { // If next one doesn't have same amount of points and first loop then only 1 winner
                winner = "Le gagnant de la partie est " + mention(id) + " avec un total de " + points + " points !";
                if (newScoreTable.length > 1) db.updateUserStats(guild, { id: id, username: "" }, 0, 1); // If more than 1 player in the game
            }
			else if (userNumber == 1 && points == nextPoints) { // If winner and next one is also winner
                if (winner) winner = winner + ", " + mention(id);
                else winner = mention(id);
                if (newScoreTable.length > 1) db.updateUserStats(guild, { id: id, username: "" }, 0, 1); // If more than 1 player in the game
            }
			else if (userNumber == 1 && points != nextPoints) { // If winner and next win if not winner
                winner = "Les gagnants de la partie sont " + winner + " et " + mention(id) + " avec un total de " + points + " points !";
                if (newScoreTable.length > 1) db.updateUserStats(guild, { id: id, username: "" }, 0, 1); // If more than 1 player in the game
            }
            if (i < 20 && userNumber != 1) { // If less than 10 users and is not the winner
                others = others + "\n" + "[" + userNumber + "] - " + mention(id) + " (" + points + " points)";
            }
            if(points != nextPoints) {
                userNumber++;
            }
        }
        return { 0: winner, 1: others };
    }
}