const net = require('net');

const server = net.createServer();

let sockets = [];

server.on('connection', (sock) => {
	console.log('CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);
	sock.write('Welcome to BruinBot!');
	sockets.push(sock);

	sock.setKeepAlive(true);

	sock.on('data', (data) => {
		// Handle data from bots here
		console.log(
			'RECEIVED FROM ' +
				sock.remoteAddress +
				':' +
				sock.remotePort +
				': ' +
				data
		);
	});

	sock.on('close', () => {
		let index = sockets.findIndex((o) => {
			return (
				o.remoteAddress === sock.remoteAddress &&
				o.remotePort === sock.remotePort
			);
		});
		if (index !== -1) sockets.splice(index, 1);
		console.log('CLOSED: ' + sock.remoteAddress + ' ' + sock.remotePort);
	});
});

module.exports.tcp = server;
module.exports.sockets = sockets;
