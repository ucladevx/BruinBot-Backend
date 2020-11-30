const app = require('./app.js');

const port = process.env.PORT || 5000;

app.on('Mongoose ready', () => {
	app.listen(port, () => {
		console.log(`This server is running on port ${port}!\n`);
	});
});

const usersRouter = require('./routes/users');
const botsRouter = require('./routes/bots');
const itemsRouter = require('./routes/items');
const eventsRouter = require('./routes/events');
const pathsRouter = require('./routes/paths');

app.get('/', (req, res) => {
	res.json('Welcome to BruinBot API!');
});
app.use('/users', usersRouter);
app.use('/bots', botsRouter);
app.use('/items', itemsRouter);
app.use('/events', eventsRouter);
app.use('/paths', pathsRouter);

module.exports = app;
