const express = require('express');

const botsRouter = express.Router();

let { BruinBot, InventoryArticle } = require('../models/bruinbot.model');
let { MapNode, Location } = require('../models/map.model');
let PathFinding = require('../util/pathfinding');
let { coordDistanceM } = require('../util/utils');
let { VICINITY } = require('../constants');

/**
 * ----------------- GET (return information about objects) ----------------
 */

/**
 * Return a specific BruinBot by id
 */
botsRouter.route('/bot').get(async (req, res) => {
	const botId = req.query.botId;
	if (!botId)
		return res.status(400).json(`'botId' not provided in request params`);

	try {
		let data = await BruinBot.findById(botId).populate({
			path: 'inventory.item',
			model: 'Item',
		});
		res.json(data);
	} catch (err) {
		res.status(404).json(err);
	}
});

/**
 * Search through all BruinBot objects and return the closest BruinBot object
 * to the coordinates in the request's body.
 */
botsRouter.route('/closest').get((req, res) => {
	const lat = req.query.latitude;
	const lon = req.query.longitude;

	if (!lat || !lon) {
		return res
			.status(400)
			.json('Required lat / long data not in request body.');
	}

	BruinBot.find({}, function (err, bots) {
		if (err) {
			console.log('Error: ' + err);
			res.status(400).json(err);
			return;
		}

		let closest = findBotCoords(bots, lat, lon);
		if (closest == null) {
			res.status(404).json('No bots in collection.');
			return;
		}

		res.json(closest);
	});
});

/**
 * Returns Location of the BruinBot with the provided id.
 */
botsRouter.route('/location').get(async (req, res) => {
	const botId = req.query.botId;

	if (!botId) {
		return res.status(400).json('Required botId not in request query.');
	}

	try {
		let bot = await BruinBot.findById(botId);

		if (!bot)
			return res.status(404).json('Could not find bot specified by botId.');

		res.json(bot.location);
	} catch (err) {
		console.log('Error: ' + err);
		res.status(400).json(err);
	}
});

/**
 * Returns list of coordinates in the bot's waypoint queue.
 */
botsRouter.route('/queue').get(async (req, res) => {
	const botId = req.query.botId;

	if (!botId) {
		return res.status(400).json('Required botId not in request query.');
	}

	try {
		let bot = await BruinBot.findById(botId);

		if (!bot)
			return res.status(404).json('Could not find bot specified by botId.');

		res.json(bot.queue);
	} catch (err) {
		console.log('Error: ' + err);
		res.status(400).json(err);
	}
});

/**
 * ------------------------- POST (add new objects) -------------------------
 */

/**
 * Adds a new BruinBot object to the database with a Location
 * and name as provided in the request's body.
 */
botsRouter.route('/').post((req, res) => {
	const name = req.body.name;
	const lat = req.body.latitude;
	const lon = req.body.longitude;

	if (!name || !lat || !lon) {
		return res
			.status(400)
			.json('Required name / lat / lon data not in request body.');
	}

	const newBot = new BruinBot({
		location: {
			latitude: lat,
			longitude: lon,
		},
		status: 'Idle',
		name: name,
		inventory: [],
	});

	newBot.save(function (err) {
		if (err) {
			console.log('Error: ' + err);
			res.status(400).json(err);
		} else {
			console.log(`Successfully added bot: ${newBot}`);
			res.json(newBot);
		}
	});
});

/**
 * Adds an existing item to an existing bot
 */
botsRouter.route('/addItem').post(async (req, res) => {
	const botId = req.body.botId;
	const itemId = req.body.itemId;
	const quantity = req.body.quantity;

	if (!botId || !itemId || !quantity) {
		return res
			.status(400)
			.json(
				'Required parameters botId / itemId / quantity not in request body.'
			);
	}

	if (quantity < 0) return res.status(400).json('Quantity cannot be below 0');

	try {
		let bot = await BruinBot.findById(botId);

		if (!bot)
			return res.status(404).json('Could not find bot specified by botId.');

		let isNewInventoryItem = true;

		bot.inventory.forEach((article) => {
			if (article.item == itemId) {
				isNewInventoryItem = false;
				article.set({
					quantity: parseInt(article.quantity) + parseInt(quantity),
				});
			}
		});

		if (isNewInventoryItem) {
			const newInventoryArticle = new InventoryArticle({
				item: itemId,
				quantity: quantity,
				sales: {
					numSold: 0,
				},
			});

			bot.inventory.push(newInventoryArticle);
		}

		await bot.save();
		console.log('Added items to bot inventory: ', bot);
		res.json(
			`Successfully added ${quantity} instances of item ${itemId} to bot ${botId}`
		);
	} catch (err) {
		console.log('Error: ' + err);
		res.status(400).json(err);
	}
});

/**
 * Finds a path from the bot's current location to a target node. The first segment
 * of the path is a straight line path from the current location to the nearest node,
 * and the rest is found using A* search. If the bot is already in transit, deny the
 * the request.
 */
botsRouter.route('/toNode').post(async (req, res) => {
	const { botId, nodeId } = req.body;

	if (!botId || !nodeId)
		return res.status(400).json('One or more of botId or nodeId is missing');

	try {
		let bot = await BruinBot.findById(botId);
		if (!bot)
			return res.status(404).json('Could not find bot specified by botId.');

		if (bot.status != 'Idle') {
			return res
				.status(400)
				.json(
					`${bot.name} is already on a path. Please wait the path to be completed first.`
				);
		}

		let endNode = await MapNode.findById(nodeId);
		if (!endNode)
			return res
				.status(404)
				.json('Could not find endNode specified by nodeId.');

		let startNode = await PathFinding.getClosestMapNode(
			bot.location.latitude,
			bot.location.longitude
		);
		let nodes = await PathFinding.getPathBetween(startNode, endNode);
		nodes.unshift(bot.location); // straight line from current location to nearest start node

		bot.path = nodes;
		bot.status = 'InTransit';
		await bot.save();

		res.json(nodes);
	} catch (err) {
		console.log('Error: ' + err);
		res.status(400).json(err);
	}
});

/**
 * --------------------- PUT (update existing objects) ----------------------
 */

/**
 * Purchases an existing item from an existing bot
 */
botsRouter.route('/purchase').put(async (req, res) => {
	const botId = req.body.botId;
	const itemId = req.body.itemId;
	const quantity = req.body.quantity;

	if (!botId || !itemId || !quantity) {
		return res
			.status(400)
			.json(
				'Required parameters botId / itemId / quantity not in request body.'
			);
	}

	if (quantity < 0) return res.status(400).json('Quantity cannot be below 0');

	try {
		let bot = await BruinBot.findById(botId);

		if (!bot)
			return res.status(404).json('Could not find bot specified by botId.');

		let itemFound = false;

		bot.inventory.forEach((article) => {
			if (article.item == itemId) {
				itemFound = true;
				article.set({
					sales: {
						numSold: parseInt(article.sales.numSold) + parseInt(quantity),
					},
				});

				article.set({
					quantity: parseInt(article.quantity) - parseInt(quantity),
				});
			}
		});

		if (!itemFound) {
			return res
				.status(400)
				.json('Could not find the item specified by itemId in bot inventory');
		}

		await bot.save();
		console.log('Purchased items from bot inventory: ', bot);
		res.json(
			`Successfully purchased ${quantity} instances of item ${itemId} from bot ${botId}`
		);
	} catch (err) {
		console.log('Error: ' + err);
		res.status(400).json(err);
	}
});

/**
 * Update BruinBot object with specified id to have new location.
 */
botsRouter.route('/updateLocation').put(async (req, res) => {
	const botId = req.body.botId;
	const lat = req.body.latitude;
	const lon = req.body.longitude;

	if (!botId || !lat || !lon) {
		return res
			.status(400)
			.json('Required botId / lat / lon data not in request body.');
	}

	try {
		let bot = await BruinBot.findById(botId);

		if (!bot)
			return res.status(404).json('Could not find bot specified by botId.');

		bot.location.latitude = lat;
		bot.location.longitude = lon;

		if (bot.status == 'InTransit') {
			let pathEnd = bot.path[bot.path.length - 1];
			if (
				coordDistanceM(lat, lon, pathEnd.latitude, pathEnd.longitude) < VICINITY
			) {
				bot.path = [];
				bot.status = 'Idle';
			}
		}

		await bot.save();
		console.log(`Successfully updated location of bot ${botId}`);
		res.json(`Successfully updated location of bot ${botId}`);
	} catch (err) {
		console.log('Error: ' + err);
		res.status(400).json(err);
	}
});

/**
 * Replace BruinBot object's waypoint queue.
 */
botsRouter.route('/replaceQueue').put(async (req, res) => {
	const botId = req.body.botId;
	const latArray = req.body.latitudeArray;
	const lonArray = req.body.longitudeArray;

	if (!botId || !latArray || !lonArray) {
		return res
			.status(400)
			.json('Required botId / latArray / lonArray data not in request body.');
	}

	if (latArray.length != lonArray.length) {
		return res.status(400).json('Incomplete arrays of coordinate pairs.');
	}

	try {
		let bot = await BruinBot.findById(botId);

		if (!bot)
			return res.status(404).json('Could not find bot specified by botId.');

		var newQueue = [];

		for (var i = 0; i < latArray.length; i++) {
			newQueue.push(
				new Location({
					latitude: parseFloat(latArray[i]),
					longitude: parseFloat(lonArray[i]),
				})
			);
		}

		bot.queue = newQueue;

		await bot.save();
		console.log(`Successfully replaced queue of bot ${botId}`);
		res.json(`Successfully replaced queue of bot ${botId}`);
	} catch (err) {
		console.log('Error: ' + err);
		res.status(400).json(err);
	}
});

/**
 * ------------------------- DELETE (remove objects) ------------------------
 */

/**
 * Deletes BruinBot with the id provided in the request's body.
 */
botsRouter.route('/').delete(async (req, res) => {
	const botId = req.body.botId;

	if (!botId) {
		return res.status(400).json('Required botId data not in request body.');
	}

	try {
		let bot = await BruinBot.findById(botId);

		if (!bot)
			return res.status(404).json('Could not find bot specified by botId.');

		await bot.deleteOne();
		console.log(`Successfully deleted bot: ${bot}`);
		res.json(`Deleted bot ${botId}`);
	} catch (err) {
		console.log('Error: ' + err);
		res.status(400).json(err);
	}
});

module.exports = botsRouter;

/**
 * ---------------------------- Helper functions ----------------------------
 */

/**
 * Returns the bot object that's closest to the provided coordinate. Returns
 * null if there are no bots in the provided array.
 *
 * @param {Array} bots Array of BruinBot objects
 * @param {number} lat Latitude of the coordinate that we want to find the closest bot to
 * @param {number} lon Longitude of the coordinate that we want to find the closest bot to
 *
 * @returns {BruinBot} Closest bruinbot to provided coordinates
 */
function findBotCoords(bots, lat, lon) {
	if (bots.length < 1) {
		return null;
	}

	let closestBot = undefined;
	let smallestDistance = Infinity;
	let currentDistance = undefined;

	// For all bots, first find their distance from the provided coordinates
	for (var b of bots) {
		currentDistance = coordDistanceM(
			lat,
			lon,
			b.location.latitude,
			b.location.longitude
		);
		// If this distance is the smallest yet found, save this distance and
		// the bot it's associated with
		if (currentDistance < smallestDistance) {
			closestBot = b;
			smallestDistance = currentDistance;
		}
	}

	return closestBot;
}
