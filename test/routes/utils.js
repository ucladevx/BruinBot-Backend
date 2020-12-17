let { BruinBot } = require('../../models/bruinbot.model');
let { Event } = require('../../models/event.model');
let { Item } = require('../../models/item.model');

let { uploadImageToS3 } = require('../../util/aws');
const fs = require('fs');

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

/**
 * Creates item in memory and saves it to the test database
 *
 * @param {object} item Item object with name, price, image, and event_id
 * @param {string} eventId the id of the event the item is being added to
 * @returns {object} Saved item in database
 */
async function createAndSaveItem(item, eventId) {
	let file = {
		buffer: fs.readFileSync(`${__dirname}/assets/sample-image.jpg`),
		originalname: 'sample-image.jpg',
		mimetype: 'image/jpg',
	};

	let data = await uploadImageToS3(file);

	let newItem = new Item({
		name: item.name,
		price: item.price,
		imgSrc: data.Location,
		imgKey: data.Key,
		weight: 0.0,
	});

	let event = await Event.findById(eventId);
	event.items.push(newItem);
	await event.save();

	return await newItem.save();
}

module.exports.createAndSaveBot = createAndSaveBot;
module.exports.createAndSaveEvent = createAndSaveEvent;
module.exports.createAndSaveItem = createAndSaveItem;
