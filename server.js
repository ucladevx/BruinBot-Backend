const { app } = require('./app');
const { wss } = require('./wss');
const { PORT } = require('./constants');

const port = PORT;
const host = '0.0.0.0';

app.on('Mongoose ready', () => {
	const server = app.listen(port, host, () => {
		console.log(`The server is accepting connections from ${host}:${port}!\n`);
	});

	server.on('upgrade', (request, socket, head) => {
		wss.handleUpgrade(request, socket, head, (ws) => {
			wss.emit('connection', ws, request);
		});
	});
});
