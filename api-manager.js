const logger = require('./logger.js');

function post(hostname, path, data, token) {
	if (!token) { logger.error("Error: no token provided for " + hostname); return; }
	const https = require('https');
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

function queryAndSend(client) {
	var guilds = client.guilds;
	var userCount = 0;
	var guildCount = 0;
	client.guilds.forEach(g => {
		userCount += g.memberCount;
		guildCount++;
	})
	var uptime = process.uptime();
	post(
		'discordbotlist.com',
		'/api/v1/bots/' + config.id + '/stats',
		{guilds: guildCount, users: userCount},
		config.discordbotlist
	);
	post(
		'top.gg',
		'/api/bots/' + config.id + '/stats',
		{server_count: guildCount},
		config.topgg
	);
	post(
		'discord.bots.gg',
		'/api/v1/bots/' + config.id + '/stats',
		{guildCount: guildCount},
		config.discordbots
	);
	post(
		'bots.ondiscord.xyz',
		'/bot-api/bots/' + config.id + '/guilds',
		{guildCount: guildCount},
		config.botsondiscord
	);
}

module.exports = {
	init: function(client) {
		setInterval(function() { queryAndSend(client) }, 300000); //logs hi every second
	}
}
