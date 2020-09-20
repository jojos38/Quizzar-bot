
// ----------- SOME VARIABLES ----------- //
const fs = require('fs');
const logger = require('../../logger.js');
// ----------- SOME VARIABLES ----------- //



function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}



function getRandomFile() {
	const files = fs.readdirSync('./locales/questions/resources/fr/') // Get all files in resource folder
	const filesNumber = files.length; // Get files number
	const randomFile = files[getRandomInt(filesNumber)]; // Pick one randomly
	logger.info("File: " + randomFile);
	return require('./resources/fr/' + randomFile);
}



module.exports = {
	getRandomQuestion: function(difficulty) {
		const file = getRandomFile();
		var difficultyString = "";
		difficulty = parseInt(difficulty);
		if (difficulty == 0) difficulty = 1 + getRandomInt(3); // Get random difficulty between 1 and 3 if it's 0
		switch (difficulty) {
			case 1: difficultyString = "débutant"; break;
			case 2: difficultyString = "confirmé"; break;
			case 3: difficultyString = "expert"; break;
			default: difficultyString = "débutant"; break; // Should not happen
		}
		const questionCategory = file.quizz[difficultyString];
		const question = questionCategory[getRandomInt(questionCategory.length)];
		return {
			"theme": file.thème,
			"question": question.question,
			"proposals": question.propositions,
			"answer": question.réponse,
			"anecdote": question.anecdote,
			"difficulty": difficultyString,
			"points": difficulty
		};
	}
};