const app = require('./app.js');

const port = process.env.PORT || 5000;

app.on('Mongoose ready', () => {
	app.listen(port, () => {
		console.log(`This server is running on port ${port}!\n`);
	});
});
