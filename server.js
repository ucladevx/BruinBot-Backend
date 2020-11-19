/* eslint-disable no-console */
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

mongoose.set('useFindAndModify', false);

const uri = process.env.ATLAS_URI;
mongoose.connect(uri, {
	useNewUrlParser: true,
	useCreateIndex: true,
	useUnifiedTopology: true,
});
const connection = mongoose.connection;
connection.once('open', () => {
	console.log('Mongoose connection opened!');
});

const usersRouter = require('./routes/users');
const botsRouter = require('./routes/bots');
const itemsRouter = require('./routes/items');
const eventsRouter = require('./routes/events');

app.get('/', function (req, res) {
	res.send('Welcome to BruinBot API!');
});

app.use('/users', usersRouter);
app.use('/bots', botsRouter);
app.use('/items', itemsRouter);
app.use('/events', eventsRouter);

app.listen(port, () => {
	console.log(`This server is running on port ${port}!`);
});
