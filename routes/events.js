const express = require('express');

const eventsRouter = express.Router();
let Event = require('../models/event.model');

/**
 * Gets all the events
 */
eventsRouter.route('/').get((req, res) => {
	Event.find()
		.then((events) => res.json(events))
		.catch((err) => res.status(400).json('Error: ' + err));
});

/**
 * Gets items for an event by id
 */
eventsRouter.route('/items').get((req, res) => {
	const id = req.body.id;

	if (!id) {
		return res.status(400).json({
			err: 'Please provide the id of the event.',
		});
	}

	Event.findById(id)
		.then((event) => res.json(event.items))
		.catch((err) => res.status(400).json('Error: ' + err));
});

/**
 * Gets bots for an event by id
 */
eventsRouter.route('/bots').get((req, res) => {
	const id = req.body.id;

	if (!id) {
		return res.status(400).json({
			err: 'Please provide the id of the event.',
		});
	}

	Event.findById(id)
		.then((event) => res.json(event.bots))
		.catch((err) => res.status(400).json('Error: ' + err));
});

/**
 * Gets admins for an event by id
 */
eventsRouter.route('/admins').get((req, res) => {
	const id = req.body.id;

	if (!id) {
		return res.status(400).json({
			err: 'Please provide the id of the event.',
		});
	}

	Event.findById(id)
		.then((event) => res.json(event.admins))
		.catch((err) => res.status(400).json('Error: ' + err));
});

/**
 * Adds a new Event object with the name provided in the request body and any
 * other additional parameters like items, bots, admins
 */
eventsRouter.route('/add').post((req, res) => {
	const { name, items, bots, admins } = req.body;

	if (!name || !items || !bots || !admins) {
		return res.status(400).json({
			err: 'Please provide name, items, bots, and admins of the event.',
		});
	}
	if (items.length == 0 || bots.length == 0 || admins.length == 0) {
		return res.status(400).json({
			err: 'Items, bots, and admins cannot be empty',
		});
	}

	const newEvent = new Event({
		name: name,
		items: items,
		bots: bots,
		admins: admins,
	});

	newEvent
		.save()
		.then(() => res.json(newEvent))
		.catch((err) => res.status(400).json('Error: ' + err));
});

/**
 * Updates the list of bots with a new updated list of bots for an event
 * specified by id
 */
eventsRouter.route('/bots').put((req, res) => {
	const { id, bots } = req.body;

	if (!id) {
		return res.status(400).json({
			err: 'Please provide the id of the event.',
		});
	}

	if (!bots) {
		return res.status(400).json({
			err: 'Please provide the updated list of bots',
		});
	}

	Event.updateOne({ _id: id }, { bots: bots }, function (err) {
		if (err) res.status(400).json('Error: ' + err);
		else res.json('The bots of Event ' + id + ' was updated!');
	});
});

/**
 * Updates the list of items with a new updated list of items for an event
 * specified by id
 */
eventsRouter.route('/items').put((req, res) => {
	const { id, items } = req.body;

	if (!id) {
		return res.status(400).json({
			err: 'Please provide the id of the event.',
		});
	}

	if (!items) {
		return res.status(400).json({
			err: 'Please provide the updated list of bots',
		});
	}

	Event.updateOne({ _id: id }, { items: items }, function (err) {
		if (err) res.status(400).json('Error: ' + err);
		else res.json('The items of Event ' + id + ' was updated!');
	});
});

/**
 * Updates the list of admins with a new updated list of admins for an event
 * specified by id
 */
eventsRouter.route('/admins').put((req, res) => {
	const { id, admins } = req.body;

	if (!id) {
		return res.status(400).json({
			err: 'Please provide the id of the event.',
		});
	}

	if (!admins) {
		return res.status(400).json({
			err: 'Please provide the updated list of bots',
		});
	}

	Event.updateOne({ _id: id }, { admins: admins }, function (err) {
		if (err) res.status(400).json('Error: ' + err);
		else res.json('The admins of Event ' + id + ' was updated!');
	});

	Event.findByIdAndUpdate(id, { admins: admins }, function (err) {
		if (err) res.status(400).json('Error: ' + err);
		else res.json('The bots of Event ' + id + ' was updated!');
	});
});

/**
 * Deletes an event by id
 */
eventsRouter.route('/').delete((req, res) => {
	const id = req.body.id;

	Event.findById(id)
		.then((event) => event.remove())
		.then(() => res.json('Event ' + id + ' was deleted!'))
		.catch((err) => res.status(400).json('Error: ' + err));
});

module.exports = eventsRouter;
