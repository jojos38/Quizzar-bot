
// ------------------------------------------- SOME VARIABLES ------------------------------------------- //
const Discord = require('discord.js');
const logoURL = "https://cdn.discordapp.com/avatars/586183772136013824/60e91b15dec572463835bfb7cbd78ce7.webp?size=128";
const orange = 16750869;
const red = 15728640;
// ------------------------------------------- SOME VARIABLES ------------------------------------------- //

module.exports = {

    mention: function (id, type) {
        if (type == 'u') {
            return "<@" + id + ">";
        } else if (type == 'c') {
            return "<#" + id + ">";
        }
    },

    // ------------- COMMANDS ------------- //
    getHelpEmbed: function (prefix) {
	prefix = prefix || "!j";
	const embed1 = new Discord.MessageEmbed({
            color: orange,
            author: {
                name: "Voici la liste des commandes disponibles :",
                icon_url: logoURL
            },
            fields: [
		{
		    name: prefix + "globaltop [utilisateur]",
		    value: "**nouveau** - Affiche le top global ou la position d'un utilisateur dans ce dernier (l'utilisateur doit être mentionné)"
		},
		{
                    name: prefix + "lang [langue]",
                    value: " - Change la langue du bot (langues disponibles: french / english)"
                },
                {
                    name: prefix + "play [difficulté] [nombre de questions] ou " + prefix + "start",
                    value: " - Démarre une partie\n**Note :** Si le nombre de questions spécifié est 0 alors la partie sera (quasi-)infinie"
                },
                {
                    name: prefix + "stop",
                    value: " - Arrête la partie en cours\n**Note :** La permission 'gérer les messages' permet d'arrêter n'importe quelle partie"
                },
                {
                    name: prefix + "diff",
                    value: " - Affiche la liste des difficultés disponibles"
                },
                {
                    name: prefix + "help ou " + prefix + "h",
                    value: " - Affiche l\'aide"
                },
                {
                    name: prefix + "info",
                    value: " - Affiche les crédits"
                },
                {
                    name: prefix + "stats",
                    value: " - Affiche vos statistiques"
                },
                {
                    name: prefix + "top",
                    value: " - Affiche le top 10 de meilleurs joueurs"
                },
                {
                    name: prefix + "admin",
                    value: " - Affiche la liste des commandes administrateur\n**Note :** Nécessite la permission de gérer le serveur"
                },
                {
                    name: "Découvrez mon autre bot, Observation!",
                    value: "https://top.gg/bot/772446137499385866"
                }
            ]
        });

        const embed2 = new Discord.MessageEmbed({
            author: {
                name: "Et voici les règles :",
                icon_url: logoURL
            },
            color: orange,
            description: "- Vous ne pouvez choisir qu'une seule réponse, la bonne réponse sera donnée à la fin du temps impartit\n- Pour répondre à une question cliquez sur la réaction associée à la réponse\n- Une question facile donne **1** points\n- Une question intermédiaire donne **2** points\n- Une question difficile donne **3** points\n- Une partie gagnée donne **1** point de victoire\n **Note:** Pour qu'un point de victoire soit compté il faut que vous gagniez une partie avec au minimum deux participants"
        });
        const embedTable = { 0: embed1, 1: embed2 };
        return embedTable;
    },


    getInfoEmbed: function (users, servers, uptime) {
        const embed = new Discord.MessageEmbed({
			author: {
				name: "Crédits :",
				icon_url: logoURL
			},
            color: orange,
            title: "Bot crée par jojos38",
			description: "Lien du bot : https://top.gg/bot/586183772136013824\nMerci à http://www.openquizzdb.org/ pour les questions.\nServeur de support: https://discord.gg/DXpb9DN\nDonate: https://paypal.me/wanzera\nMon autre bot: https://top.gg/bot/772446137499385866",
			fields: [
			  {
				name: "Serveurs",
				value: servers,
				inline: true
			  },
			  {
				name: "Utilisateurs",
				value: users,
				inline: true
			  },
			  {
				name: "Uptime",
				value: uptime,
				inline: true
			  }
			]
        });
        return embed;
    },


    getDifEmbed: function () {
        const embed = new Discord.MessageEmbed({
            color: orange,
            description: "0 : Toutes les difficultés mélangées\n1 : Facile\n2 : Confirmé\n3 : Expert",
            author: {
                name: "Liste des difficultés disponibles :",
                icon_url: logoURL
            }
        });
        return embed;
    },
    getAdminHelpEmbed: function (prefix) {
	prefix = prefix || "!j";
        const embed = new Discord.MessageEmbed({
            description: "Un 'channel autorisé' est un channel ou les commandes du bot sont autorisées",
            color: orange,
            author: {
                name: "Voici la liste des commandes administrateur :",
                icon_url: logoURL
            },
            fields: [
				{
					name: prefix + "prefix",
					value: "Changer le préfix du bot"
				},
                {
                    name: prefix + "add",
                    value: "Ajoute le channel où est lancé la commande dans la liste des channel autorisés\n**Note** : Si aucun channel n'est spécifié, tous les channels seront autorisés"
                },
                {
                    name: prefix + "remove",
                    value: "Retire le channel où est lancé la commande de la liste des channels autorisés"
                },
                {
                    name: prefix + "reset",
                    value: "Supprime toutes les données de configuration du serveur (la liste des channels autorisés etc...)\n**Attention :** Cette commande supprime également toutes les statistiques des utilisateurs !"
                },
                {
                    name: prefix + "channels",
                    value: "Affiche la liste des channels autorisés"
                },
                {
                    name: prefix + "delayquestion",
                    value: "Défini le délai pour répondre à une question **(en millisecondes) (entre 2500 et 1800000)**"
                },
                {
                    name: prefix + "delayanswer",
                    value: "Défini le délai d'affichage de la réponse avant de continuer **(en millisecondes) (entre 500 et 50000)**"
                },
                {
                    name: prefix + "defdifficulty",
                    value: "Défini la difficulté par défaut lorsque qu'aucun paramètre n'est choisi (entre 0 et 3)"
                },
                {
                    name: prefix + "defquestions",
                    value: "Défini le nombre de questions par défaut lorsque qu'aucun paramètre n'est choisi (entre 1 et 2147483647)"
                },
				{
                    name: prefix + "stuck",
                    value: "Si le bot est bloqué utilisez cette commande (Cette commande peut causer des problèmes, ne l'utilisez qu'en cas de nécessité !)"
                }
            ]
        });
        return embed;
    },
    getUserStatsEmbed: function (stats) {
        const embed = new Discord.MessageEmbed({
            author: {
                name: "Stats :",
                icon_url: logoURL
            },
            color: orange,
			fields: [
			  {
				name: "Stats globales",
				value: "Score: " + (stats.global.score || 0) + "\n" + "Won : " + (stats.global.won || 0)
			  },
			  {
				name: "Stats du serveur",
				value: "Score: " + (stats.guild.score || 0) + "\n" + "Won : " + (stats.guild.won || 0)
			  }
			]
        });
        return embed;
    },
    getTopEmbed: function (totalUsers, users) {
		let descUsers;
		let descScore;
		let descPosition;
		let i = 1;
		for (user of users) {
			descPosition = descPosition ? descPosition + "\n" + i : i;
			descUsers = descUsers ? descUsers + "\n" + user.position : user.position;
			descScore = descScore ? descScore + "\n" + user.won + " - " + user.score : user.won + " - " + user.score;
			i++;
		}
		const embed = new Discord.MessageEmbed({
            author: {
                name: "Top (" + totalUsers + " utilisateurs) :",
                icon_url: logoURL
            },
			fields: [
				{
					name: "#",
					value: descPosition,
					inline: true
				},
				{
					name: "Utilisateur",
					value: descUsers,
					inline: true
				},
				{
					name: "Gagnées / Score",
					value: descScore,
					inline: true
				}
			],
            color: orange
        });
        return embed;
    },
    getNoStatsEmbed: function () {
        const embed = new Discord.MessageEmbed({
            author: {
                name: "Statistiques :",
                icon_url: logoURL
            },
            color: orange,
            description: "Aucune statistiques trouvées, vous devez gagner au minimum 1 point pour posséder des statistiques"
        });
        return embed;
    },
    // ------------- COMMANDS------------- //

    // ------------- COMMANDS ERRORS ------------- //
    getBadDifEmbed: function () {
        const embed = new Discord.MessageEmbed({
            title: "La difficultée doit être comprise entre 0 et 3",
            color: red,
        });
        return embed;
    },
    getNotAllowedEmbed: function (channelsString) {
        const embed = new Discord.MessageEmbed({
            author: {
                name: "Mince",
                icon_url: logoURL
            },
            color: red,
            title: "Vous ne pouvez pas effectuer de commandes quizz dans ce channel.",
            description: "Si vous êtes administrateur utilisez !jadd pour ajouter ce channel.\nJetez un coup d'oeil ici : " + channelsString
        });
        return embed;
    },
    getAlreadyRunningEmbed: function (channelID) {
        const embed = new Discord.MessageEmbed({
            title: "Une autre partie est déjà en cours",
            description: this.mention(channelID, 'c'),
            color: red
        });
        return embed;
    },
    getBadQuesEmbed: function () {
        const embed = new Discord.MessageEmbed({
            title: "Le nombre de questions doit se situer entre 1 et 100",
            color: red,
        });
        return embed;
    },
    getWrongPlayerStopEmbed: function () {
        const embed = new Discord.MessageEmbed({
            title: "Seul le joueur qui a démarré la partie peut l'arrêter",
            color: red
        });
        return embed;
    },
    getWrongChannelEmbed: function (channel) {
        const embed = new Discord.MessageEmbed({
            title: "Aucune partie n'est en cours dans ce channel",
            description: "Allez jeter un coup d'oeil ici : " + channel,
            color: red
        });
        return embed;
    },
    getNoGameRunningEmbed: function () {
        const embed = new Discord.MessageEmbed({
            title: "Aucune partie n'est en cours",
            description: "Utilisez !jplay pour démarrer une partie",
            color: red
        });
        return embed;
    },
    // ------------- COMMANDS ERRORS ------------- //

    // -------------------------------- GAME -------------------------------- //
    getStartEmbed: function (difficulty, questionsAmount) {
        const embed = new Discord.MessageEmbed({
            title: "Démarrage de la partie",
            description: "Difficultée : " + difficulty + "\nNombre de questions : " + questionsAmount,
            color: orange,
        });
        return embed;
    },
    getQuestionEmbed: function (qData, qNumber, qTotal, timeleft, embedColor) {
        // 0:thème --- 1:difficulté --- 2:question --- 3:propositions --- 4:réponse --- 5:anecdote --- 6:points --- 7:num.ques --- 8:tot.ques
        const proposals = qData.proposals;
        const embed = new Discord.MessageEmbed({
            author: {
                name: "Question " + qNumber + " / " + qTotal + " :",
                icon_url: logoURL
            },
            footer: {
                text: "Temps restant :⠀" + timeleft + "s",
            },
            description: "Thème : " + qData.theme + " (" + qData.difficulty + ")```yaml\n" + qData.question + "```",
            color: embedColor,
            fields: [
                {
                    name: "\u200B",
                    value: "Réponse A :```- " + proposals[0] + "``` Réponse C :```- " + proposals[2] + "```",
                    inline: true
                },
                {
                    name: "\u200B",
                    value: "Réponse B :```- " + proposals[1] + "``` Réponse D :```- " + proposals[3] + "```",
                    inline: true
                }
            ]
        });
        return embed;
    },
    getAnswerEmbed: function (answerLetter, answer, anectode, playersString, color) {
        const embed = new Discord.MessageEmbed({
            color: color,
            title: "La bonne réponse était la réponse " + answerLetter + " : " + answer,
            description: "```" + anectode + "```\n" + playersString,
        });
        return embed;
    },
    getStopEmbed: function (reason) {
        const embed = new Discord.MessageEmbed({
            title: "La partie va s'arrêter",
            description: reason,
            color: orange,
        });
        return embed;
    },
    getGameStoppedEmbed: function () {
        const embed = new Discord.MessageEmbed({
            title: "Partie terminée !",
            description: "La partie en cours a été arrêtée manuellement",
            color: orange
        });
        return embed;
    },
    getGameEndedEmbed: function (players) {
        const embed = new Discord.MessageEmbed({
            title: "Gagnants :",
            color: orange,
            description: players[0] + "\n" + players[1] + "\nVous aimez Quizzar ? Soutenez moi sur https://paypal.me/wanzera\nMon autre bot https://top.gg/bot/772446137499385866"
        });
        return embed;
    },
    // -------------------------------- GAME -------------------------------- //
};
