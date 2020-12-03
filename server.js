const app = require('./app.js');

const port = process.env.PORT || 8080;
const host = process.env.HOST || '0.0.0.0';

app.on('Mongoose ready', () => {
	app.listen(port, host, () => {
		console.log(`The server is accepting connections from ${host}:${port}!\n`);
	});
});
