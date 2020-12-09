const express = require('express');

const botsRouter = express.Router();

let { BruinBot, InventoryArticle } = require('../models/bruinbot.model');
let { Path } = require('../models/map.model');
let util = require('./utils');

/**
 * ----------------- GET (return information about objects) ----------------
 */

/**
 * Return all BruinBot objects.
 */
botsRouter.route('/').get((req, res) => {
	BruinBot.find({}, function (err, bots) {
		if (err) {
			console.log('Error: ' + err);
			res.status(404).json(err);
		} else {
			res.json(bots);
		}
	});
});

/**
 * Return a specific BruinBot by id
 */
botsRouter.route('/bot').get(async (req, res) => {
	const botId = req.query.botId;
	if (!botId) res.status(400).json(`'botId' not provided in request params`);

	try {
		let data = await BruinBot.findById(botId);
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
botsRouter.route('/location').get((req, res) => {
	const botId = req.query.botId;

	if (!botId) {
		return res.status(400).json('Required botId not in request query.');
	}

	BruinBot.findById(botId, function (err, bot) {
		if (err) {
			console.log('Error: ' + err);
			res.status(400).json(err);
		} else {
			res.json(bot.location);
		}
	});
});

/**
 * ------------------------- POST (add new objects) -------------------------
 */

/**
 * Adds a new BruinBot object to the FleetManager's bot array with a Location
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
botsRouter.route('/addItem').post((req, res) => {
	const botId = req.body.botId;
	const itemId = req.body.itemId;
	const quantity = req.body.quantity;

	if (!botId || !itemId || !quantity) {
		res
			.status(400)
			.json('Required parameters itemId / quantity not in request body.');
	}

	BruinBot.findById(botId).then((bot) => {
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
			});

			bot.inventory.push(newInventoryArticle);
		}

		bot
			.save()
			.then(() => {
				console.log('Added items to bot inventory: ', bot);
				res.json(
					`Successfully added ${quantity} instances of item ${itemId} to bot ${botId}`
				);
			})
			.catch((err) => {
				console.log('Error: ' + err);
				res.json(err);
			});
	});
});

/**
 * --------------------- PUT (update existing objects) ----------------------
 */

/**
 * Update BruinBot object with specified id to have new location.
 */
botsRouter.route('/updateLocation').put((req, res) => {
	const id = req.body.id;
	const lat = req.body.latitude;
	const lon = req.body.longitude;

	if (!id || !lat || !lon) {
		return res
			.status(400)
			.json('Required id / lat / lon data not in request body.');
	}

	BruinBot.findByIdAndUpdate(
		id,
		{ 'location.latitude': lat, 'location.longitude': lon },
		(err, result) => {
			if (err) {
				console.log('Error: ' + err);
				res.status(400).json(err);
			} else {
				console.log(`Sucessfully updated location: ${result}`);
				res.json(result);
			}
		}
	);
});

/**
 * Update BruinBot object with specified id to have new path from path object id.
 *
 * @param {string} botId id of the bot to be updated.
 * @param {string} pathId id of the path to be added.
 */
botsRouter.put('/updatePath', async (req, res) => {
	const botId = req.body.id;
	const pathId = req.body.path;

	if (!botId || !pathId)
		res.status(400).json('Required bot id / path id data not in request body.');

	try {
		let bot = await BruinBot.findById(botId);
		let pathCount = await Path.count(pathId);

		if (!bot)
			return res.status(404).json('Bot with specified id does not exist.');
		if (pathCount < 1)
			return res.status(404).json('Path with specified id does not exist.');

		bot.path = pathId;
		await bot.save();
		res.json(`Successfully added path with id ${pathId} to bot ${botId}.`);
	} catch (err) {
		console.log('Error: ' + err);
		res.status(400).json(err);
	}
});

/**
 * Update BruinBot object with specified id to have a null path.
 *
 * @param {string} botId id of the bot to be updated.
 */
botsRouter.put('/removePath', async (req, res) => {
	const botId = req.body.id;

	if (!botId) res.status(400).json('Required bot id data not in request body.');

	try {
		let bot = await BruinBot.findById(botId);

		if (!bot)
			return res.status(404).json('Bot with specified id does not exist.');
		if (bot.path == null)
			return res
				.status(409)
				.json('Bot with specified id already has null path.');

		bot.path = null;
		await bot.save();
		res.json(`Successfully removed path from bot ${botId}.`);
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
botsRouter.route('/').delete((req, res) => {
	const id = req.body.id;

	if (!id) {
		return res.status(400).json('Required id data not in request body.');
	}

	BruinBot.findByIdAndDelete(id, (err, bot) => {
		if (err) {
			console.log('Error: ' + err);
			res.status(404).json(err);
		} else {
			console.log(`Successfully deleted bot: ${bot}`);
			res.json(`Deleted bot ${id}`);
		}
	});
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
		currentDistance = util.coordDistanceM(
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
