/**
 * @file Register the commands of the bot for testing purposes
 * @author jojos38
 */



global.config = require('./config.json');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');



let commands = [
    {
        name: 'help',
        description: 'Display all the user commands',
    },
    {
        name: 'admin',
        description: 'Display all the admin commands',
    },
    {
        name: 'stats',
        description: 'Display your stats',
    },
    {
        name: 'globaltop',
        description: 'Display the global top',
        options: [
            {
                type: 6,
                name: 'user',
                description: 'Show a specific user in the top',
                required: false
            }
        ]
    },
    {
        name: 'reset',
        description: 'Erase all data stored for this server (including all users data)',
    },
    {
        name: 'info',
        description: 'Display bot info'
    },
    {
        name: 'channels',
        description: 'Display all channels that Observation is monitoring'
    },
    {
      name: 'stop',
      description: 'Stop the currently running game'
    },
    {
        name: 'play',
        description: 'Start a game',
        options: [
            {
                type: 4,
                name: 'difficulty',
                description: 'The difficulty',
                required: false,
                choices: [
                    {
                        name: 'Random',
                        value: 0
                    },
                    {
                        name: 'Easy',
                        value: 1
                    },
                    {
                        name: 'Medium',
                        value: 2
                    },
                    {
                        name: 'Hard',
                        value: 3
                    },
                ]
            },
            {
                type: 4,
                name: 'questions',
                description: 'How many questions',
                min_value: 1,
                max_value: 100,
                required: false,

            }
        ]
    },
    {
        name: 'delayanswer',
        description: 'Define for how long the answer will be shown',
        options: [
            {
                type: 4,
                name: 'delay',
                description: 'Delay in milliseconds',
                min_value: 500,
                max_value: 50000,
                required: true
            }
        ]
    },
    {
        name: 'delayquestion',
        description: 'Define for how long a question will be shown',
        options: [
            {
                type: 4,
                name: 'delay',
                description: 'Delay in milliseconds',
                min_value: 2500,
                max_value: 1800000,
                required: true
            }
        ]
    },
    {
        name: 'defquestions',
        description: 'Define how many questions will a game have by default',
        options: [
            {
                type: 4,
                name: 'questions',
                description: 'The total number of questions',
                min_value: 1,
                max_value: 100,
                required: true
            }
        ]
    },
    {
        name: 'defdifficulty',
        description: 'Define the default difficulty of the bot',
        options: [
            {
                type: 4,
                name: 'difficulty',
                description: 'The difficulty to use',
                required: true,
                choices: [
                    {
                        name: 'Random',
                        value: 0
                    },
                    {
                        name: 'Easy',
                        value: 1
                    },
                    {
                        name: 'Medium',
                        value: 2
                    },
                    {
                        name: 'Hard',
                        value: 3
                    },
                ]
            }
        ]
    },
    {
        name: 'language',
        description: 'Change the bot global language',
        options: [
            {
                type: 3,
                name: 'language',
                description: 'The language to use',
                required: true,
                choices: [
                    {
                        name: 'French',
                        value: 'fr'
                    },
                    {
                        name: 'English',
                        value: 'en'
                    },
                    {
                        name: 'Spanish',
                        value: 'es'
                    },
                    {
                        name: 'Italian',
                        value: 'it'
                    },
                    {
                        name: 'Dutch',
                        value: 'nl'
                    }
                ]
            }
        ]
    },
    {
        name: 'add',
        description: 'Add a channel to be scanned and monitored by Quizzar',
        options: [
            {
                type: 7,
                name: 'channel',
                description: 'The channel to monitor',
                channel_types: [0],
                required: true,

            }
        ]
    },
    {
        name: 'remove',
        description: 'Remove a channel from the eyes of Quizzar',
        options: [
            {
                type: 7,
                name: 'channel',
                description: 'The channel to remove',
                channel_types: [0],
                required: true,

            }
        ]
    }
];

// commands = [];

const rest = new REST({ version: '9' }).setToken('config.token');

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(config.id),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

return;