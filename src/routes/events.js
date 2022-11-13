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
 * Gets the enriched list of bots (actual items, not just itemIds) for an event by id
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
			.populate('path')
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
	const { name, botIds } = req.body;

	if (!name || !botIds) {
		return res
			.status(400)
			.json('Please provide name, bots, and admins of the event.');
	}

	let itemIds = req.body.itemIds;
	if (!itemIds) {
		itemIds = [];
	}

	const newEvent = new Event({
		name: name,
		items: itemIds,
		bots: botIds,
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
	const { eventId, botId } = req.body;

	if (!eventId) {
		return res.status(400).json('Please provide the id of the event.');
	}

	if (!botId) {
		return res.status(400).json('Please provide the id of the bot.');
	}

	try {
		let event = await Event.findById(eventId);

		if (!event)
			return res.status(404).json('Could not find event specified by eventId.');

		event.bots.push(botId);
		await event.save();
		res.json('Bot ' + botId + ' was added to Event ' + eventId + '.');
	} catch (err) {
		console.log('Error ' + err);
		res.status(400).json(err);
	}
});

/**
 * Adds an item id to an event
 */
eventsRouter.route('/items').put(async (req, res) => {
	const { eventId, itemId } = req.body;

	if (!eventId) {
		return res.status(400).json('Please provide the id of the event.');
	}

	if (!itemId) {
		return res.status(400).json('Please provide the id of the item.');
	}

	try {
		let event = await Event.findById(eventId);

		if (!event)
			return res.status(404).json('Could not find event specified by eventId.');

		event.items.push(itemId);
		await event.save();
		res.json('Item ' + itemId + ' was added to Event ' + eventId + '.');
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
			if (item) await item.deleteOne();
		}

		await event.deleteOne();
		res.json(`Successfully deleted event ${eventId} and its items`);
	} catch (err) {
		console.log('Error ' + err);
		res.status(400).json(err);
	}
});

module.exports = eventsRouter;
