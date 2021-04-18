const WebSocket = require('ws');
let { BruinBot } = require('./models/bruinbot.model');
let { coordDistanceM } = require('./util/utils');
let { VICINITY } = require('./constants');

const { Path } = require('./models/map.model');

const wss = new WebSocket.Server({ noServer: true });

const clients = new Map();

const commandBot = () => {
	clients.forEach((client, key) => {
		// Determine if we want to send command, who to send command to, and what to send
		console.log('Sending command to bots...');
		if (key === 'Teddy Bear') {
			client.send('Pinging from server...');
		}
	});
};

const updateLocationHandler = async function (botId, lat, lon) {
	try {
		let bot = await BruinBot.findById(botId);

		if (!bot) return;

		bot.location.latitude = lat;
		bot.location.longitude = lon;

		if (bot.status == 'InTransit') {
			let pathEnd = bot.path[bot.path.length - 1];
			if (
				coordDistanceM(lat, lon, pathEnd.latitude, pathEnd.longitude) < VICINITY
			) {
				bot.path = [];
				bot.status = 'Idle';
			}
		}

		await bot.save();
		console.log(`Successfully updated location of bot ${botId}`);
	} catch (err) {
		console.log('Error: ' + err);
	}
};

const messageHandler = async (msg, ws) => {
	const msgSplit = msg.split(' ');
	console.log(`received: ${msg}`);
	if (msg.startsWith('register')) {
		const key = msg.split('register')[1].substring(1);
		clients.set(key, ws);
		return `Welcome to BruinBot! ${key} is registered.`;
	} else if (msg.startsWith('path')) {
		const paths = await Path.find().populate('nodeA').populate('nodeB');
		return JSON.stringify(paths);
	} else if (msgSplit[0] == 'location' && msgSplit.length == 4) {
		updateLocationHandler(msgSplit[1], msgSplit[2], msgSplit[3]);
		return 'Accepted and attempting location update request to database!';
	} else if (msgSplit[0] == 'join') return 'Welcome to BruinBot!';
	else return 'Error: WebSocket request not valid.';
};

wss.on('connection', (ws) => {
	ws.on('message', async (msg) => {
		const response = await messageHandler(msg, ws);
		ws.send(response);
	});
	ws.on('close', () => {
		clients.forEach((client, key) => {
			if (ws === client) {
				console.log(`${key} is disconnected.`);
				clients.delete(key);
			}
		});
	});
});

setInterval(commandBot, 10000);

module.exports.wss = wss;
module.exports.clients = clients;
