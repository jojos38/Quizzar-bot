/**
 * @file Manages api interactions
 * @author jojos38
 */



// ------------------------ SOME FUNCTIONS ------------------------ //
/**
 * This is used by the delayChecking function to wait x ms
 */
async function delay(ms) {
	return await new Promise(resolve => setTimeout(resolve, ms));
}
// ------------------------ SOME FUNCTIONS ------------------------ //



// --------- SOME VARIABLES --------- //
const logger = require('./logger.js');
const https = require('https');
// --------- SOME VARIABLES --------- //



class ApiManager {
	#tokens;
	#selfID;
	#client;
	#running;
	#postDelay;
	#initialized;

	constructor(client, selfID, tokens, delay) {
		this.#client = client;
		this.#selfID = selfID;
		this.#tokens = tokens;
		this.#initialized = false;
		this.#postDelay = delay || 60 * 60 * 1000;
	}

	/**
	 * Do a post request for a given api
	 * @param {string} hostname - The hostname of the api without path
	 * @param {string} path - The path for the post request (with a / at beginning)
	 * @param {object} data - An object containing the data to post
	 * @param {string} token - The authorization token for the api
	 */
	#post(hostname, path, data, token) {
		if (!token) { logger.error("Error: no token provided for " + hostname); return; }
		data = JSON.stringify(data);
		const options = {
			hostname: hostname,
			port: 443,
			path: path,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Content-Length': data.length,
				'Authorization': token
			}
		};
		const req = https.request(options, res => {
			if (res.statusCode == 200 || res.statusCode == 204) logger.info("Successfully posted guilds count for " + hostname);
			else logger.error("Error while posting guilds count for " + hostname + ": " + res.statusCode);
		});
		req.on('error', error => { console.error(error) });
		req.write(data)
		req.end()
	}

	/**
	 * Gets the bot's data and send it to the api
	 */
	queryAndSend() {
		const guilds = this.#client.guilds.cache;
		let userCount = 0;
		let guildCount = 0;
		guilds.forEach(g => {
			userCount += g.memberCount;
			guildCount++;
		})

		this.#post(
			'discordbotlist.com',
			'/api/v1/bots/' + this.#selfID + '/stats',
			{guilds: guildCount, users: userCount},
			this.#tokens.discordbotlist
		);
		this.#post(
			'top.gg',
			'/api/bots/' + this.#selfID + '/stats',
			{server_count: guildCount},
			this.#tokens.topgg
		);
		this.#post(
			'discord.bots.gg',
			'/api/v1/bots/' + this.#selfID + '/stats',
			{guildCount: guildCount},
			this.#tokens.discordbots
		);
		this.#post(
			'bots.ondiscord.xyz',
			'/bot-api/bots/' + this.#selfID + '/guilds',
			{guildCount: guildCount},
			this.#tokens.botsondiscord
		);
		/*this.#post(
			'discord.boats',
			'/api/bot/' + this.#selfID,
			{server_count: guildCount},
			this.#tokens.discordboats
		);*/
	}

	/**
	 * Stop the api from sending data
	 */
	stop() {
		this.#initialized = false;
	}


	/**
	 * Starts the sending of the data at a given rate
	 */
	async init() {
		if (!this.#initialized) {
			this.#initialized = true;
			logger.success("Api Manager initialized");
			while (this.#initialized) {
				await delay(this.#postDelay);
				this.queryAndSend();
			}
		}
	}
}

module.exports = ApiManager;
