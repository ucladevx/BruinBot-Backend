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
 * Gets the list of item ids for an event by id
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
			let items = [];
			console.log(event.items);

			for (const item_id of event.items) {
				await Items.findById(item_id).then((item) => {
					items.push(item);
				});
			}
			res.json(items);
		})
		.catch((err) => res.status(400).json('Error: ' + err));
});

/**
 * Gets the list of bot ids for an event by id
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
			let bots = [];

			for (const bot_id of event.bots) {
				await Bots.findById(bot_id).then((bot) => {
					bots.push(bot);
				});
			}
			res.json(bots);
		})
		.catch((err) => res.status(400).json('Error: ' + err));
});

/**
 * Gets the list of admin ids for an event by id
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
			let admins = [];

			for (const admin_id of event.admins) {
				await Admins.findById(admin_id).then((admin) => {
					admins.push(admin);
				});
			}
			res.json(admins);
		})
		.catch((err) => res.status(400).json('Error: ' + err));
});

/**
 * Adds a new Event object with the name, list of bot ids, and list of admin ids
 * provided in the request body and any
 */
eventsRouter.route('/add').post((req, res) => {
	const { name, bots, admins } = req.body;

	if (!name || !bots || !admins) {
		return res.status(400).json({
			err: 'Please provide name, bots, and admins of the event.',
		});
	}
	if (bots.length == 0 || admins.length == 0) {
		return res.status(400).json({
			err: 'The list of bot IDs and admin IDs cannot be empty',
		});
	}

	const newEvent = new Event({
		name: name,
		items: [],
		bots: bots,
		admins: admins,
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

	Event.updateOne({ _id: id }, { $push: { bots: bot_id }}, function (err) {
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
