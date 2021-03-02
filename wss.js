const WebSocket = require('ws');

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

const messageHandler = async (ws, msg) => {
	console.log(`received: ${msg}`);
	if (msg.startsWith('register')) {
		const key = msg.split('register')[1].substring(1);
		clients.set(key, ws);
		ws.send(`Welcome to BruinBot! ${key} is registered.`);
	} else if (msg.startsWith('path')) {
		const paths = await Path.find().populate('nodeA').populate('nodeB');
		ws.send(JSON.stringify(paths));
	} else {
		ws.send('Invalid request');
	}
};

wss.on('connection', (ws) => {
	ws.on('message', (msg) => {
		messageHandler(ws, msg);
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
