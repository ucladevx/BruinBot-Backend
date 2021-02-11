const { app } = require('./app');
const { EXPRESS_PORT, TCP_PORT } = require('./constants');
const { tcp } = require('./sockets');

const host = '0.0.0.0';

app.on('Mongoose ready', () => {
	app.listen(EXPRESS_PORT, host, () => {
		console.log(
			`The server is accepting connections from ${host}:${EXPRESS_PORT}!\n`
		);
	});
	tcp.listen(TCP_PORT, host, () => {
		console.log('TCP Server is running on port ' + TCP_PORT + '.');
	});
});
