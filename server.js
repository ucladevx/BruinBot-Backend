const { app } = require('./app');
const { wss, messageHandler } = require('./wss');
const { EXPRESS_PORT } = require('./constants');

const port = EXPRESS_PORT;
const host = '0.0.0.0';

app.on('Mongoose ready', () => {
	app.listen(port, host, () => {
		console.log(`The server is accepting connections from ${host}:${port}!\n`);
	});

	wss.on('connection', (ws) => {
		ws.on('message', (msg) => {
			messageHandler(msg);
			ws.send(`received: ${msg}`);
		});

		ws.send('Welcome to BruinBot!');
	});
});
