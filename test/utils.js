let { BruinBot } = require('../models/bruinbot.model');
let { Location } = require('../models/map.model');

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

module.exports.createAndSaveBot = createAndSaveBot;
