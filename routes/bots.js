const express = require('express');

const botsRouter = express.Router();

let BruinBot = require('../models/bruinbot.model');
let Map = require('../models/map.model');
let util = require('./utils');

/**
 * ------------------------- POST (add new objects) -------------------------
 */

/**
 * Adds a new BruinBot object to the FleetManager's bot array with a Location
 * and name as provided in the request's body.
 */
botsRouter.route('/add').post((req, res) => {
	const lat = req.body.latitude;
	const lon = req.body.longitude;
	const name = req.body.name;

	const newLocation = new Map.Location({
		latitude: lat,
		longitude: lon,
	});

	const newBot = new BruinBot({
		location: newLocation,
		status: 'Idle',
		name: name,
	});

	newBot.save(function (err) {
		if (err) {
			console.log(err);
			res.send(400, 'Bad request.');
		} else {
			res.json(newBot);
		}
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

	BruinBot.findOneAndUpdate(
		{ _id: id },
		{ 'location.latitude': lat, 'location.longitude': lon },
		(err, result) => {
			if (err) {
				console.log(err);
				res.send(400, 'Bad request.');
			} else {
				res.json(result);
			}
		}
	);
});

/**
 * ----------------- GET (return information about objects) ----------------
 */

/**
 * Return all BruinBot objects.
 */
botsRouter.route('/').get((req, res) => {
	BruinBot.find({}, function (err, bots) {
		if (err) {
			console.log(err);
			res.send(500, 'Internal error.');
		} else {
			res.json(bots);
		}
	});
});

/**
 * Search through all BruinBot objects and return the closest BruinBot object
 * to the coordinates in the request's body.
 */
botsRouter.route('/closest').get((req, res) => {
	const lat = req.body.latitude;
	const lon = req.body.longitude;

	BruinBot.find({}, function (err, bots) {
		if (err) {
			console.log(err);
			res.send(500, 'Internal error.');
			return;
		}
		let closest = findBotCoords(bots, lat, lon);
		if (closest == null) {
			res.send(500, 'No bots in collection.');
			return;
		}
		res.send(closest);
	});
});

/**
 * Returns Location of the BruinBot with the provided id.
 */
botsRouter.route('/location').get((req, res) => {
	const id = req.body.id;

	BruinBot.findOne({ _id: id }, function (err, bot) {
		if (err) {
			console.log(err);
			res.send(400, 'Bad request.');
		} else {
			res.json(bot.location);
		}
	});
});

/**
 * ------------------------- DELETE (remove objects) ------------------------
 */

/**
 * Deletes BruinBot with the id provided in the request's body.
 */
botsRouter.route('/').delete((req, res) => {
	const id = req.body.id;

	BruinBot.remove({ _id: id }, (err, result) => {
		if (err) {
			console.log(err);
			res.send(400, 'Bad request.');
		} else {
			res.json(result);
		}
	});
});

// Exports module for use in server.js
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

	// For all bots that are, first find their distance from the provided coordinates
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
