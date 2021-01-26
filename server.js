const { app } = require('./app');
const { wss } = require('./wss');
const { EXPRESS_PORT } = require('./constants');

const port = EXPRESS_PORT;
const host = '0.0.0.0';

app.on('Mongoose ready', () => {
	app.listen(port, host, () => {
		console.log(`The server is accepting connections from ${host}:${port}!\n`);
	});

	wss.on('connection', (ws) => {
		ws.on('message', (message) => {
			console.log('received: %s', message);
			ws.send(`received: ${message}`);
		});

		ws.send('Welcome to BruinBot!');
	});
});
