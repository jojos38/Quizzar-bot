
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
    getHelpEmbed: function () {
        const embed1 = new Discord.RichEmbed({
            color: orange,
            author: {
                name: "Voici la liste des commandes disponibles :",
                icon_url: logoURL
            },
            fields: [
			    {
                    name: "**!jlang** [langue]",
                    value: " - **NOUVEAU** Change la langue du bot (langues disponibles: french / english)"
                },		
                {
                    name: "**!jplay** [difficulté] [nombre de questions] ou !jp ou !jstart",
                    value: " - Démarre une partie\n**Note :** Si le nombre de questions spécifié est 0 alors la partie sera (quasi-)infinie"
                },
                {
                    name: "**!jstop**",
                    value: " - Arrête la partie en cours\n**Note :** La permission 'gérer les messages' permet d'arrêter n'importe quelle partie"
                },
                {
                    name: "**!jdiff**",
                    value: " - Affiche la liste des difficultés disponibles"
                },
                {
                    name: "**!jhelp** ou !jh",
                    value: " - Affiche l\'aide"
                },
                {
                    name: "**!jinfo**",
                    value: " - Affiche les crédits"
                },
                {
                    name: "**!jstats**",
                    value: " - Affiche vos statistiques"
                },
                {
                    name: "**!jtop**",
                    value: " - Affiche le top 10 de meilleurs joueurs"
                },
                {
                    name: "**!jadmin**",
                    value: " - Affiche la liste des commandes administrateur\n**Note :** Nécessite la permission de gérer le serveur"
                }
            ]
        });

        const embed2 = new Discord.RichEmbed({
            author: {
                name: "Et voici les règles :",
                icon_url: logoURL
            },
            color: orange,
            description: "- Vous ne pouvez choisir qu'une seule réponse, le bonne réponse sera donnée à la fin du temps impartit\n- Pour répondre à une question cliquez sur la réaction associée à la réponse\n- Une question facile donne **1** points\n- Une question intermédiaire donne **2** points\n- Une question difficile donne **3** points\n- Une partie gagnée donne **1** point de victoire\n **Note:** Pour qu'un point de victoire soit compté il faut que vous gagniez une partie avec au minimum deux participants"
        });
        const embedTable = { 0: embed1, 1: embed2 };
        return embedTable;
    },
	
	
    getInfoEmbed: function (users, servers, uptime) {
        const embed = new Discord.RichEmbed({
			author: {
				name: "Crédits :",
				icon_url: logoURL
			},
            color: orange,
            title: "Bot crée par jojos38",
			description: "Lien du bot : https://top.gg/bot/586183772136013824\nMerci à http://www.openquizzdb.org/ pour les questions.\nServeur de support: https://discord.gg/DXpb9DN\nPatreon: https://www.patreon.com/jojos38\nTipeee: https://fr.tipeee.com/jojos38s-quizzar-bot",
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
        const embed = new Discord.RichEmbed({
            color: orange,
            description: "0 : Toutes les difficultés mélangées\n1 : Facile\n2 : Confirmé\n3 : Expert",
            author: {
                name: "Liste des difficultés disponibles :",
                icon_url: logoURL
            }
        });
        return embed;
    },
    getAdminHelpEmbed: function () {
        const embed = new Discord.RichEmbed({
            description: "Un 'channel autorisé' est un channel ou les commandes du bot sont autorisées",
            color: orange,
            author: {
                name: "Voici la liste des commandes administrateur :",
                icon_url: logoURL
            },
            fields: [
                {
                    name: "!jadd",
                    value: "Ajoute le channel où est lancé la commande dans la liste des channel autorisés\n**Note** : Si aucun channel n'est spécifié, tous les channels seront autorisés"
                },
                {
                    name: "!jremove",
                    value: "Retire le channel où est lancé la commande de la liste des channels autorisés"
                },
                {
                    name: "!jreset",
                    value: "Supprime toutes les données de configuration du serveur (la liste des channels autorisés etc...)\n**Attention :** Cette commande supprime également toutes les statistiques des utilisateurs !"
                },
                {
                    name: "!jchannels",
                    value: "Affiche la liste des channels autorisés"
                },
                {
                    name: "!jdelayquestion",
                    value: "Défini le délai pour répondre à une question **(en millisecondes) (entre 2500 et 1800000)**"
                },
                {
                    name: "!jdelayanswer",
                    value: "Défini le délai d'affichage de la réponse avant de continuer **(en millisecondes) (entre 500 et 50000)**"
                },
                {
                    name: "!jdefdifficulty",
                    value: "Défini la difficulté par défaut lorsque qu'aucun paramètre n'est choisi (entre 0 et 3)"
                },
                {
                    name: "!jdefquestions",
                    value: "Défini le nombre de questions par défaut lorsque qu'aucun paramètre n'est choisi (entre 1 et 2147483647)"
                },
				{
                    name: "!jstuck",
                    value: "Si le bot est bloqué utilisez cette commande (Cette commande peut causer des problèmes, ne l'utilisez qu'en cas de nécessité !)"
                }
            ]
        });
        return embed;
    },
    getUserStatsEmbed: function (userStats) {
        const embed = new Discord.RichEmbed({
            author: {
                name: "Statistiques :",
                icon_url: logoURL
            },
            color: orange,
            description: "Parties gagnées : " + userStats.won + "\nScore total : " + userStats.score
        });
        return embed;
    },
    getTopEmbed: function (topString) {
        const embed = new Discord.RichEmbed({
            author: {
                name: "Top :",
                icon_url: logoURL
            },
            color: orange,
            description: topString
        });
        return embed;
    },
    getNoStatsEmbed: function () {
        const embed = new Discord.RichEmbed({
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
        const embed = new Discord.RichEmbed({
            title: "La difficultée doit être comprise entre 0 et 3",
            color: red,
        });
        return embed;
    },
    getNotAllowedEmbed: function (channelsString) {
        const embed = new Discord.RichEmbed({
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
        const embed = new Discord.RichEmbed({
            title: "Une autre partie est déjà en cours",
            description: this.mention(channelID, 'c'),
            color: red
        });
        return embed;
    },
    getBadQuesEmbed: function () {
        const embed = new Discord.RichEmbed({
            title: "Le nombre de questions doit se situer entre 1 et 100",
            color: red,
        });
        return embed;
    },
    getWrongPlayerStopEmbed: function () {
        const embed = new Discord.RichEmbed({
            title: "Seul le joueur qui a démarré la partie peut l'arrêter",
            color: red
        });
        return embed;
    },
    getWrongChannelEmbed: function (channel) {
        const embed = new Discord.RichEmbed({
            title: "Aucune partie n'est en cours dans ce channel",
            description: "Allez jeter un coup d'oeil ici : " + channel,
            color: red
        });
        return embed;
    },
    getNoGameRunningEmbed: function () {
        const embed = new Discord.RichEmbed({
            title: "Aucune partie n'est en cours",
            description: "Utilisez !jplay pour démarrer une partie",
            color: red
        });
        return embed;
    },
    // ------------- COMMANDS ERRORS ------------- //

    // -------------------------------- GAME -------------------------------- //
    getStartEmbed: function (difficulty, questionsAmount) {
        const embed = new Discord.RichEmbed({
            title: "Démarrage de la partie",
            description: "Difficultée : " + difficulty + "\nNombre de questions : " + questionsAmount,
            color: orange,
        });
        return embed;
    },
    getQuestionEmbed: function (qData, timeleft, embedColor) {
        // 0:thème --- 1:difficulté --- 2:question --- 3:propositions --- 4:réponse --- 5:anecdote --- 6:points --- 7:num.ques --- 8:tot.ques
        const proposals = qData.proposals;
        const embed = new Discord.RichEmbed({
            author: {
                name: "Question " + qData.qNumber + " / " + qData.qAmount + " :",
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
        const embed = new Discord.RichEmbed({
            color: color,
            title: "La bonne réponse était la réponse " + answerLetter + " : " + answer,
            description: "```" + anectode + "```\n" + playersString,
        });
        return embed;
    },
    getStopEmbed: function (reason) {
        const embed = new Discord.RichEmbed({
            title: "La partie s'arrêtera à la fin de la question en cours",
            description: reason,
            color: orange,
        });
        return embed;
    },
    getGameStoppedEmbed: function () {
        const embed = new Discord.RichEmbed({
            title: "Partie terminée !",
            description: "La partie en cours a été arrêtée manuellement",
            color: orange
        });
        return embed;
    },
    getGameEndedEmbed: function (players) {
        const embed = new Discord.RichEmbed({
            title: "Gagnants :",
            color: orange,
            description: players[0] + "\n" + players[1] + "\n\nSi le bot vous plait n'hésitez pas à aller voter sur le site !\nhttps://top.gg/bot/586183772136013824"
        });
        return embed;
    },
    // -------------------------------- GAME -------------------------------- //
};
