const WebSocket = require('ws');

const wss = new WebSocket.Server({ noServer: true });

const messageHandler = (msg) => {
	console.log(`received: ${msg}`);
};

wss.on('connection', (ws) => {
	ws.on('message', (msg) => {
		messageHandler(msg);
		ws.send(`received: ${msg}`);
	});

	ws.send('Welcome to BruinBot!');
});

module.exports.wss = wss;
