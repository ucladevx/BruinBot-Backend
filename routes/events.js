const express = require('express');

const eventsRouter = express.Router();
let Event = require('../models/event.model');
let Bots = require('../models/bruinbot.model');
let Admins = require('../models/user.model');
let Items = require('../models/item.model');

/**
 * Gets all the events
 */
eventsRouter.route('/').get((req, res) => {
	Event.find()
		.then((events) => res.json(events))
		.catch((err) => res.status(400).json('Error: ' + err));
});

/**
 * Gets the list of items for an event by id
 */
eventsRouter.route('/items').get((req, res) => {
	const id = req.body.id;

	if (!id) {
		return res.status(400).json({
			err: 'Please provide the id of the event.',
		});
	}

	Event.findById(id)
		.then(async (event) => {
			let items = await Items.find().where('_id').in(event.items).exec();
			res.json(items);
		})
		.catch((err) => res.status(400).json('Error: ' + err));
});

/**
 * Gets the list of bots for an event by id
 */
eventsRouter.route('/bots').get((req, res) => {
	const id = req.body.id;

	if (!id) {
		return res.status(400).json({
			err: 'Please provide the id of the event.',
		});
	}

	Event.findById(id)
		.then(async (event) => {
			let bots = await Bots.find().where('_id').in(event.bots).exec();
			res.json(bots);
		})
		.catch((err) => res.status(400).json('Error: ' + err));
});

/**
 * Gets the list of admins for an event by id
 */
eventsRouter.route('/admins').get((req, res) => {
	const id = req.body.id;

	if (!id) {
		return res.status(400).json({
			err: 'Please provide the id of the event.',
		});
	}

	Event.findById(id)
		.then(async (event) => {
			let admins = await Admins.find().where('_id').in(event.admins).exec();
			res.json(admins);
		})
		.catch((err) => res.status(400).json('Error: ' + err));
});

/**
 * Adds a new Event object with the name, list of bot ids, and list of admin ids
 * provided in the request body
 */
eventsRouter.route('/add').post((req, res) => {
	const { name, bots_ids, admins_ids } = req.body;

	if (!name || !bots_ids || !admins_ids) {
		return res.status(400).json({
			err: 'Please provide name, bots, and admins of the event.',
		});
	}
	if (bots_ids.length == 0 || admins_ids.length == 0) {
		return res.status(400).json({
			err: 'The list of bot IDs and admin IDs cannot be empty',
		});
	}

	const newEvent = new Event({
		name: name,
		items: [],
		bots: bots_ids,
		admins: admins_ids,
	});

	newEvent
		.save()
		.then(() => res.json(newEvent))
		.catch((err) => res.status(400).json('Error: ' + err));
});

/**
 * Adds a bot id to the list of bot ids to an event specified by id
 */
eventsRouter.route('/bots').put((req, res) => {
	const { id, bot_id } = req.body;

	if (!id) {
		return res.status(400).json({
			err: 'Please provide the id of the event.',
		});
	}

	if (!bot_id) {
		return res.status(400).json({
			err: 'Please provide the id of the bot.',
		});
	}

	Event.updateOne({ _id: id }, { $push: { bots: bot_id } }, function (err) {
		if (err) res.status(400).json('Error: ' + err);
		else res.json('Bot ' + bot_id + ' was added to Event ' + id + '.');
	});
});

/**
 * Adds an item id to the list of item ids to an event specified by id
 */
eventsRouter.route('/items').put((req, res) => {
	const { id, item_id } = req.body;

	if (!id) {
		return res.status(400).json({
			err: 'Please provide the id of the event.',
		});
	}

	if (!item_id) {
		return res.status(400).json({
			err: 'Please provide the id of the item.',
		});
	}

	Event.updateOne({ _id: id }, { $push: { items: item_id }}, function (err) {
		if (err) res.status(400).json('Error: ' + err);
		else res.json('Item ' + item_id + ' was added to Event ' + id + '.');
	});
});

/**
 * Adds an admin id to the list of admin ids to an event specified by id
 */
eventsRouter.route('/admins').put((req, res) => {
	const { id, admin_id } = req.body;

	if (!id) {
		return res.status(400).json({
			err: 'Please provide the id of the event.',
		});
	}

	if (!admin_id) {
		return res.status(400).json({
			err: 'Please provide the id of the admin.',
		});
	}

	Event.updateOne({ _id: id }, { $push: { admins: admin_id }}, function (err) {
		if (err) res.status(400).json('Error: ' + err);
		else res.json('Admin ' + admin_id + ' was added to Event ' + id + '.');
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
