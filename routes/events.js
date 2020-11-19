const express = require('express');

const eventsRouter = express.Router();

let Event = require('../models/event.model');
let { BruinBot } = require('../models/bruinbot.model');
let Admins = require('../models/user.model');
let Items = require('../models/item.model');

/**
 * ----------------- GET (return information about objects) ----------------
 */

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
 * Gets the enriched list of bots (actual items, not just item_ids) for an event by id
 */
eventsRouter.route('/bots').get((req, res) => {
	const eventId = req.body.id;

	if (!eventId) {
		return res.status(400).json({
			err: 'Please provide the id of the event.',
		});
	}

	Event.findById(eventId)
		.then(async (event) => {
			let bots = await BruinBot.find()
				.populate({
					path: 'inventory.item',
					model: 'Item',
				})
				.where('_id')
				.in(event.bots)
				.exec();
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
 * ------------------------- POST (add new objects) -------------------------
 */

/**
 * Adds a new Event object with the name, list of bot ids, and list of admin ids
 * provided in the request body
 */
eventsRouter.route('/add').post((req, res) => {
	const { name, bot_ids, admin_ids } = req.body;

	if (!name || !bot_ids || !admin_ids) {
		return res.status(400).json({
			err: 'Please provide name, bots, and admins of the event.',
		});
	}

	if (bot_ids.length == 0 || admin_ids.length == 0) {
		return res.status(400).json({
			err: 'The list of bot IDs and admin IDs cannot be empty',
		});
	}

	let item_ids = req.body.item_ids;
	if (!item_ids) {
		item_ids = [];
	}

	const newEvent = new Event({
		name: name,
		items: item_ids,
		bots: bot_ids,
		admins: admin_ids,
	});

	newEvent
		.save()
		.then(() => res.json(newEvent))
		.catch((err) => res.status(400).json('Error: ' + err));
});

/**
 * --------------------- PUT (update existing objects) ----------------------
 */

/**
 * Adds a bot id to an event
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
 * Adds an item id to an event
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

	Event.updateOne({ _id: id }, { $push: { items: item_id } }, function (err) {
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

	Event.updateOne({ _id: id }, { $push: { admins: admin_id } }, function (err) {
		if (err) res.status(400).json('Error: ' + err);
		else res.json('Admin ' + admin_id + ' was added to Event ' + id + '.');
	});
});

/**
 * ------------------------- DELETE (remove objects) ------------------------
 */

/**
 * Deletes an event by id
 *
 * TODO: figure out how to handle the event being successfully deleted but its items
 * failing to delete, leaving stranded items in the database
 */
eventsRouter.route('/').delete((req, res) => {
	const eventId = req.body.id;

	Event.findByIdAndDelete(eventId)
		.then((event) => {
			console.log(`Successfully deleted event: ${event}`);
			return Items.deleteMany({ _id: { $in: event.items } });
		})
		.then((result) => {
			console.log(`Successfully deleted event's items: ${result}`);
			res.json(`Succesfully deleted event's items.`);
		})
		.catch((err) => {
			console.log(`Failed to delete event ${eventId}`, err);
			res.status(400).json('Error: ' + err);
		});
});

module.exports = eventsRouter;
