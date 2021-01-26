const WebSocket = require('ws');
const { WS_PORT } = require('./constants');

const wss = new WebSocket.Server({ port: WS_PORT });

const messageHandler = (msg) => {
	console.log(`received: ${msg}`);
};

module.exports.wss = wss;
module.exports.messageHandler = messageHandler;
