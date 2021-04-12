
    // ------------- COMMANDS ERRORS ------------- //
    


    // ------------- COMMANDS ERRORS ------------- //

    // -------------------------------- GAME -------------------------------- //
    getStartEmbed(difficulty, questionsAmount) {
        return new Discord.MessageEmbed({
            title: "Game starting",
            description: "Difficulty : " + difficulty + "\nQuestions amount : " + questionsAmount,
            color: orange,
        });
        
    }
    getQuestionEmbed(qData, qNumber, qTotal, timeleft, embedColor) {
        // 0:thème --- 1:difficulté --- 2:question --- 3:propositions --- 4:réponse --- 5:anecdote --- 6:points --- 7:num.ques --- 8:tot.ques
        const proposals = qData.proposals;
		const difficultyTable = { 1: "easy", 2: "medium", 3: "hard" };
        return new Discord.MessageEmbed({
            author: {
                name: "Question " + qNumber + " / " + qTotal + " :",
                icon_url: logoURL
            }
            footer: {
                text: "Remaining time :⠀" + timeleft + "s",
            }
            description: "Theme : " + qData.theme + " (" + difficultyTable[qData.difficulty] + ")```yaml\n" + qData.question + "```",
            color: embedColor,
            fields: [
                {
                    name: "\u200B",
                    value: "Answer A :```- " + proposals[0] + "``` Answer C :```- " + proposals[2] + "```",
                    inline: true
                }
                {
                    name: "\u200B",
                    value: "Answer B :```- " + proposals[1] + "``` Answer D :```- " + proposals[3] + "```",
                    inline: true
                }
            ]
        });
        
    }
    getAnswerEmbed(answerLetter, answer, anecdote, playersString, color) {
		if (anecdote) description = "```" + anecdote + "```\n" + playersString;
		else description = playersString;
        return new Discord.MessageEmbed({
            color: color,
            title: "The good answer was " + answerLetter + ": " + answer,
            description: description,
        });
        
    }

    // -------------------------------- GAME -------------------------------- //
};
