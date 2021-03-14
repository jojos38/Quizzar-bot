
// ----------- SOME VARIABLES ----------- //
const request = require('request');
const entities = require('html-entities');
const tools = require('../../tools.js');
// ----------- SOME VARIABLES ----------- //



function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}



module.exports = {
	getRandomQuestion: function(difficulty) {
		return new Promise(async function (resolve, reject) {
			if (difficulty == 0) difficulty = 1 + getRandomInt(3); // Get random difficulty between 1 and 3 if it's 0
			switch (difficulty) {
				case 1: difficultyString = "easy"; break;
				case 2: difficultyString = "medium"; break;
				case 3: difficultyString = "hard"; break;
				default: difficultyString = "easy"; break; // Should not happen
			}
			request({url: 'https://opentdb.com/api.php?amount=1&difficulty=' + difficultyString + '&type=multiple', json: true}, function(err, res, json) {
				if (err) { reject(err); return; }
				if (!json.results) { reject(null); return; }
				const result = json.results[0];
				const answer = entities.decode(result.correct_answer);
				var proposals = [
					answer,
					entities.decode(result.incorrect_answers[0]),
					entities.decode(result.incorrect_answers[1]),
					entities.decode(result.incorrect_answers[2])
				];
				proposals = tools.shuffle(proposals);
				const qData = {
					theme: result.category,
					difficulty: result.difficulty,
					question: entities.decode(result.question),
					proposals: proposals,
					answer: answer,
					anecdote: "",
					points: difficulty
				};
				resolve(qData);
				return;
			});
		});
	}
};