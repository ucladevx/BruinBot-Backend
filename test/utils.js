let { BruinBot } = require('../models/bruinbot.model');
let { Location } = require('../models/map.model');
let { Event } = require('../models/event.model');

/**
 * Creates bot in memory and saves it to the test database
 *
 * @param {object} bot Bot object with latitude, longitude, and name
 *
 * @returns {object} Saved bot in database
 */
async function createAndSaveBot(bot) {
	let newLocation = new Location({
		latitude: bot.latitude,
		longitude: bot.longitude,
	});

	await newLocation.save();

	let newBot = new BruinBot({
		location: newLocation,
		status: 'Idle',
		name: bot.name,
		inventory: [],
	});

	return await newBot.save();
}

/**
 * Creates event in memory and saves it to the test database
 *
 * @param {object} event Event object with name, list of item_ids, bot_ids, and admin_ids
 *
 * @returns {object} Saved event in database
 */
async function createAndSaveEvent(event) {
	let newEvent = new Event({
		name: event.name,
		items: [],
		bots: event.bot_ids,
		admins: event.admin_ids,
	});

	return await newEvent.save();
}

module.exports.createAndSaveBot = createAndSaveBot;
module.exports.createAndSaveEvent = createAndSaveEvent;
