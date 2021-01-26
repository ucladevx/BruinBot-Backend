const WebSocket = require('ws');
const { WS_PORT } = require('./constants');

const wss = new WebSocket.Server({ port: WS_PORT });

module.exports.wss = wss;
