const db = require('./database.js');

function mention(userID) {
    return "<@" + userID + ">"
}

// Get players string pour les joueurs gagnants
// Ne pas augmenter le compteur si deux joueurs ont le même score

module.exports = {

    getPlayersString: function (players) {
        var playersString = "";
        const playersNumber = players.length;
        if (playersNumber == 0) {
            playersString = "Personne n'a su répondre correctement !";
            return playersString;
        }
        for (var i = 0; i < playersNumber; i++) {
            if (playersNumber == 1) {
                playersString = "Seul " + mention(players[0].id) + " a su répondre correctement !";
                return playersString;
            } else {
                if (i == 0) {
                    playersString = mention(players[0].id);
                } else if (i + 1 < playersNumber) {
                    playersString = playersString + ", " + mention(players[i].id);
                } else {
                    playersString = playersString + " et " + mention(players[i].id) + " ont su répondre correctement !";
                    return playersString;
                }
            }
        }
    },

    getWinString: function (guild, scoreTable) {     
        if (!scoreTable) { scoreTable = []; }
        scoreTable[Symbol.iterator] = function* () {
            yield* [...this.entries()].sort((b, a) => a[1] - b[1]);
        }
        var x = 0;
        var idTable = [];
        var pointsTable = [];
        for (let [id, points] of scoreTable) {
            idTable[x] = id;
            pointsTable[x] = points;
            x++;
        }
        var others = "";
        var winner = "";
        var userNumber = 1;
        if (idTable.length == 0) {
            return { 0: "Il semblerait qu'il n'y ait aucun gagnant", 1: "" };
        }
        for (var i = 0; i < idTable.length; i++) {
            const winnerID = idTable[i];
            const points = pointsTable[i];
            if (userNumber == 1 && points != pointsTable[i+1] && i == 0) { // If next one doesn't have same amount of points and first loop then only 1 winner
                winner = "Le gagnant de la partie est " + mention(winnerID) + " avec un total de " + points + " points !";
                console.log(idTable.length + " - " + winnerID);
                if (idTable.length > 1) { // If more than 1 player in the game
                    db.updateUserStats(guild, { id: winnerID, username:""}, 0, 1);
                }
            } else if (userNumber == 1 && points == pointsTable[i+1]) { // If winner and next one is also winner
                if (winner) winner = winner + ", " + mention(winnerID);
                else winner = mention(winnerID);
                console.log(idTable.length + " - " + winnerID);
                if (idTable.length > 1) { // If more than 1 player in the game
                    db.updateUserStats(guild, { id: winnerID, username: "" }, 0, 1);
                }
            } else if (userNumber == 1 && points != pointsTable[i+1]) { // If winner and next win if not winner
                winner = "Les gagnants de la partie sont " + winner + " et " + mention(winnerID) + " avec un total de " + points + " points !";
                if (idTable.length > 1) { // If more than 1 player in the game
                    db.updateUserStats(guild, { id: winnerID, username: "" }, 0, 1);
                }
            }
            if (i < 20 && userNumber != 1) { // If less than 10 users and is not the winner
                others = others + "\n" + "[" + userNumber + "] - " + mention(winnerID) + " (" + points + " points)";
            }
            if(points != pointsTable[i+1]) {
                userNumber++;
            }
        }
        return { 0: winner, 1: others };
    }
}