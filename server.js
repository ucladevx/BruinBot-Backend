const app = require('./app');
const { PORT } = require('./constants');

const port = process.env.PORT || PORT;
const host = process.env.HOST || '0.0.0.0';

app.on('Mongoose ready', () => {
	app.listen(port, host, () => {
		console.log(`The server is accepting connections from ${host}:${port}!\n`);
	});
});
