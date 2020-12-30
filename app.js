/* eslint-disable no-console */
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Good practice to not use .env files in production and rather set them directly
if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// There exists a separate database for testing
let uri = process.env.ATLAS_URI;
if (process.env.NODE_ENV === 'test') {
	console.log('Testing...');
	uri = process.env.ATLAS_URI_TEST;
}

mongoose.connect(uri, {
	useNewUrlParser: true,
	useCreateIndex: true,
	useUnifiedTopology: true,
	useFindAndModify: false,
});

const connection = mongoose.connection;
connection.once('open', () => {
	console.log('Mongoose connection opened!');
	app.emit('Mongoose ready');
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
