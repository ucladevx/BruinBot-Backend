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
eventsRouter.route('/items').get((req, res) => {
	const eventId = req.query.eventId;

	if (!eventId) {
		return res.status(400).json('Please provide the id of the event.');
	}

	Event.findById(eventId)
		.then(async (event) => {
			console.log(event);
			let items = await Item.find().where('_id').in(event.items).exec();
			res.json(items);
		})
		.catch((err) => res.status(400).json(err));
});

/**
 * Gets the enriched list of bots (actual items, not just item_ids) for an event by id
 */
eventsRouter.route('/bots').get((req, res) => {
	const eventId = req.query.eventId;

	if (!eventId) {
		return res.status(400).json('Please provide the id of the event.');
	}

	Event.findById(eventId)
		.then(async (event) => {
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
		})
		.catch((err) => res.status(400).json(err));
});

/**
 * Gets the list of admins for an event by id
 */
eventsRouter.route('/admins').get((req, res) => {
	const eventId = req.query.eventId;

	if (!eventId) {
		return res.status(400).json('Please provide the id of the event.');
	}

	Event.findById(eventId)
		.then(async (event) => {
			let admins = await User.find().where('_id').in(event.admins).exec();
			res.json(admins);
		})
		.catch((err) => res.status(400).json(err));
});

/**
 * ------------------------- POST (add new objects) -------------------------
 */

/**
 * Adds a new Event object with the name, list of bot ids, and list of admin ids
 * provided in the request body
 */
eventsRouter.route('/add').post((req, res) => {
	const { name, botIds, adminIds } = req.body;

	if (!name || !botIds || !adminIds) {
		return res
			.status(400)
			.json('Please provide name, bots, and admins of the event.');
	}

	if (botIds.length == 0 || adminIds.length == 0) {
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
		bots: botIds,
		admins: adminIds,
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
eventsRouter.route('/bots').put((req, res) => {
	const { eventId, botId } = req.body;

	if (!eventId) {
		return res.status(400).json('Please provide the id of the event.');
	}

	if (!botId) {
		return res.status(400).json('Please provide the id of the bot.');
	}

	Event.findByIdAndUpdate(eventId, { $push: { bots: botId } }, function (err) {
		if (err) res.status(400).json(err);
		else res.json('Bot ' + botId + ' was added to Event ' + eventId + '.');
	});
});

/**
 * Adds an item id to an event
 */
eventsRouter.route('/items').put((req, res) => {
	const { eventId, itemId } = req.body;

	if (!eventId) {
		return res.status(400).json('Please provide the id of the event.');
	}

	if (!itemId) {
		return res.status(400).json('Please provide the id of the item.');
	}

	Event.findByIdAndUpdate(eventId, { $push: { items: itemId } }, function (
		err
	) {
		if (err) res.status(400).json(err);
		else res.json('Item ' + itemId + ' was added to Event ' + eventId + '.');
	});
});

/**
 * Adds an admin id to the list of admin ids to an event specified by id
 */
eventsRouter.route('/admins').put((req, res) => {
	const { eventId, admin_id: adminId } = req.body;

	if (!eventId) {
		return res.status(400).json('Please provide the id of the event.');
	}

	if (!adminId) {
		return res.status(400).json('Please provide the id of the admin.');
	}

	Event.findByIdAndUpdate(eventId, { $push: { admins: adminId } }, function (
		err
	) {
		if (err) res.status(400).json(err);
		else res.json('Admin ' + adminId + ' was added to Event ' + eventId + '.');
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
	const eventId = req.body.eventId;

	Event.findByIdAndDelete(eventId)
		.then((event) => {
			console.log(`Successfully deleted event: ${event}`);
			return Item.deleteMany({ _id: { $in: event.items } });
		})
		.then((result) => {
			console.log(`Successfully deleted event's items: ${result}`);
			res.json(`Succesfully deleted event's items.`);
		})
		.catch((err) => {
			console.log('Error: ' + err);
			res.status(400).json(err);
		});
});

module.exports = eventsRouter;
