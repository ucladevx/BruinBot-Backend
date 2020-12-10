const express = require('express');

const eventsRouter = express.Router();

let { Event } = require('../models/event.model');
let { BruinBot } = require('../models/bruinbot.model');
let { User } = require('../models/user.model');
let { Item } = require('../models/item.model');

/**
 * ----------------- GET (return information about objects) ----------------
 */

/**
 * Gets all the events
 */
eventsRouter.route('/').get((req, res) => {
	Event.find()
		.then((events) => res.json(events))
		.catch((err) => res.status(400).json(err));
});

/**
 * Gets the list of items for an event by id
 */
eventsRouter.route('/items').get(async (req, res) => {
	const eventId = req.query.eventId;

	if (!eventId) {
		return res.status(400).json('Please provide the id of the event.');
	}

	try {
		let event = await Event.findById(eventId);

		if (!event)
			return res.status(404).json('Could not find event specified by eventId.');

		let items = await Item.find().where('_id').in(event.items).exec();
		res.json(items);
	} catch (err) {
		console.log('Error ' + err);
		res.status(400).json(err);
	}
});

/**
 * Gets the enriched list of bots (actual items, not just item_ids) for an event by id
 */
eventsRouter.route('/bots').get(async (req, res) => {
	const eventId = req.query.eventId;

	if (!eventId) {
		return res.status(400).json('Please provide the id of the event.');
	}

	try {
		let event = await Event.findById(eventId);

		if (!event)
			return res.status(404).json('Could not find event specified by eventId.');

		let bots = await BruinBot.find()
			.populate({
				path: 'inventory.item',
				model: 'Item',
			})
			.where('_id')
			.in(event.bots)
			.exec();
		res.json(bots);
	} catch (err) {
		console.log('Error ' + err);
		res.status(400).json(err);
	}
});

/**
 * Gets the list of admins for an event by id
 */
eventsRouter.route('/admins').get(async (req, res) => {
	const eventId = req.query.eventId;

	if (!eventId) {
		return res.status(400).json('Please provide the id of the event.');
	}

	try {
		let event = await Event.findById(eventId);

		if (!event)
			return res.status(404).json('Could not find event specified by eventId.');

		let admins = await User.find().where('_id').in(event.admins).exec();
		res.json(admins);
	} catch (err) {
		console.log('Error ' + err);
		res.status(400).json(err);
	}
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
		return res
			.status(400)
			.json('Please provide name, bots, and admins of the event.');
	}

	if (bot_ids.length == 0 || admin_ids.length == 0) {
		return res
			.status(400)
			.json('The list of bot IDs and admin IDs cannot be empty');
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
		.catch((err) => res.status(400).json(err));
});

/**
 * --------------------- PUT (update existing objects) ----------------------
 */

/**
 * Adds a bot id to an event
 */
eventsRouter.route('/bots').put(async (req, res) => {
	const { eventId, bot_id } = req.body;

	if (!eventId) {
		return res.status(400).json('Please provide the id of the event.');
	}

	if (!bot_id) {
		return res.status(400).json('Please provide the id of the bot.');
	}

	try {
		let event = await Event.findById(eventId);

		if (!event)
			return res.status(404).json('Could not find event specified by eventId.');

		event.bots.push(bot_id);
		await event.save();
		res.json('Bot ' + bot_id + ' was added to Event ' + eventId + '.');
	} catch (err) {
		console.log('Error ' + err);
		res.status(400).json(err);
	}
});

/**
 * Adds an item id to an event
 */
eventsRouter.route('/items').put(async (req, res) => {
	const { eventId, item_id } = req.body;

	if (!eventId) {
		return res.status(400).json('Please provide the id of the event.');
	}

	if (!item_id) {
		return res.status(400).json('Please provide the id of the item.');
	}

	try {
		let event = await Event.findById(eventId);

		if (!event)
			return res.status(404).json('Could not find event specified by eventId.');

		event.items.push(item_id);
		await event.save();
		res.json('Item ' + item_id + ' was added to Event ' + eventId + '.');
	} catch (err) {
		console.log('Error ' + err);
		res.status(400).json(err);
	}
});

/**
 * Adds an admin id to the list of admin ids to an event specified by id
 */
eventsRouter.route('/admins').put(async (req, res) => {
	const { eventId, admin_id } = req.body;

	if (!eventId) {
		return res.status(400).json('Please provide the id of the event.');
	}

	if (!admin_id) {
		return res.status(400).json('Please provide the id of the admin.');
	}

	try {
		let event = await Event.findById(eventId);

		if (!event)
			return res.status(404).json('Could not find event specified by eventId.');

		event.admins.push(admin_id);
		await event.save();
		res.json('Admin ' + admin_id + ' was added to Event ' + eventId + '.');
	} catch (err) {
		console.log('Error ' + err);
		res.status(400).json(err);
	}
});

/**
 * ------------------------- DELETE (remove objects) ------------------------
 */

/**
 * Deletes an event by id and all items associated with the event
 *
 */
eventsRouter.route('/').delete(async (req, res) => {
	const eventId = req.body.eventId;

	if (!eventId) {
		return res.status(400).json('Please provide the id of the event.');
	}

	try {
		let event = await Event.findById(eventId);

		if (!event)
			return res.status(404).json('Could not find event specified by eventId.');

		for (var id of event.items) {
			let item = await Item.findById(id);
			if (item) item.deleteOne();
		}

		event.deleteOne();
		res.json(`Successfully deleted event ${eventId} and its items`);
	} catch (err) {
		console.log('Error ' + err);
		res.status(400).json(err);
	}
});

module.exports = eventsRouter;
