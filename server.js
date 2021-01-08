const { app } = require('./app');
const { PORT } = require('./constants');

const port = PORT;
const host = '0.0.0.0';

app.on('Mongoose ready', () => {
	app.listen(port, host, () => {
		console.log(`The server is accepting connections from ${host}:${port}!\n`);
	});
});
