let { BruinBot } = require('../models/bruinbot.model');

/**
 * Creates bot in memory and saves it to the test database
 *
 * @param {object} bot Bot object with latitude, longitude, and name
 *
 * @returns {object} Saved bot in database
 */
async function createAndSaveBot(bot) {
	let newBot = new BruinBot({
		location: {
			latitude: bot.latitude,
			longitude: bot.longitude,
		},
		status: 'Idle',
		name: bot.name,
		inventory: [],
	});

	return await newBot.save();
}

module.exports.createAndSaveBot = createAndSaveBot;
