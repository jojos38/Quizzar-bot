# Quizzar-Bot

Quizzar est un bot français qui possède plus de 1400 questions uniques, 3 niveaux de difficultés et une multitude de commandes pour régler les paramètres du bot. Les questions sont posées une par une, il y a 4 réponses possible par question, une seule réponse juste. Il y a une multitude de thèmes différents tel que l'informatique, l'histoire, la culture générale... Pour répondre à une question il suffit de cliquer sur la réaction qui correspond à la réponse souhaitée.

Le bot possède un système de statistiques, les joueurs peuvent comparer leur scores, leur statistiques et une commande permet de voir le top 10 des meilleurs joueurs du serveur.

- La permission de gérer les salons est facultative ! Si vous ne souhaitez pas que le bot puisse voir les salons cachés, désactivez la.
- Le bot n'en est encore qu'à ses débuts, il se peut qu'il y ai des bugs plus ou moins importants.
- Je ne peux pas garantir la longévitée du bot dans le temps !

Commandes utilisateurs
!jplay [difficulté] [nombre de questions] ou !jp ou !jstart
Démarre une partie
Note : Si le nombre de questions spécifié est 0 alors la partie sera (quasi-)infinie si l'utilisateur possède les droits admin
Exemple: !jplay 1 5 -> Démarre une partie avec difficultée facile et 5 questions.

!jstop
Arrête la partie en cours
Note : La permission 'gérer les messages' permet d'arrêter n'importe quelle partie

!jdiff
Affiche la liste des difficultés disponibles

!jhelp ou !jh
Affiche l'aide

!jinfo
Affiche les crédits

!jstats
Affiche vos statistiques

!jtop
Affiche le top 10 de meilleurs joueurs

Commandes administrateurs
Un 'channel autorisé' est un channel ou les commandes du bot sont autorisées

!jadmin
Affiche la liste des commandes administrateur
Note : Nécessite la permission de gérer le serveur

!jadd
Ajoute le channel où est lancée la commande dans la liste des channel autorisés
Note : Si aucun channel n'est spécifié, tous les channels seront autorisés

!jremove
Retire le channel où est lancée la commande de la liste des channels autorisés

!jreset
Supprime toutes les données de configuration du serveur (la liste des channels autorisés etc...)
Attention : Cette commande supprime également toutes les statistiques des utilisateurs !

!jchannels
Affiche la liste des channels autorisés

!jdelayquestion
Défini le délai pour répondre à une question (en millisecondes) (entre 2500 et 1800000)

!jdelayanswer
Défini le délai d'affichage de la réponse avant de continuer (en millisecondes) (entre 500 et 50000)

!jdefdifficulty
Défini la difficulté par défaut lorsque qu'aucun paramètre n'est choisi (entre 0 et 3)

!jdefquestions
Défini le nombre de questions par défaut lorsque qu'aucun paramètre n'est choisi (entre 1 et 2147483647)
