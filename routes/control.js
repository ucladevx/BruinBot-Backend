const express = require('express');
const { clients } = require('../wss.js');
//let { BruinBot } = require('../models/bruinbot.model');

const controlRouter = express.Router();

controlRouter.route('/move').post(async (req, res) => {
	const { botId, message } = req.body;

	// Missing request data
	if (!botId || !message)
		return res
			.status(400)
			.json(`'botId' and/or 'message' not provided in request body`);

	console.log(message);

	// validate message
	let formattedMessage = message.toLowerCase();
	if (
		formattedMessage !== 'up' &&
		formattedMessage !== 'down' &&
		formattedMessage !== 'right' &&
		formattedMessage !== 'left'
	) {
		console.log('INVALID MESSAGE');
		return res.status(400).json(`Invalid message type`);
	}

	// TODO: get bot by botId, commented out for now since it's hardcoded
	/*try {
		// Find bot document information for given bot id
		let bot = await BruinBot.findById(botId);

		// Missing bot with requested id
		if (!bot)
			return res.status(404).json('Could not find bot specified by botId.');
	} catch (err) {
		// Return and log error
		console.log('Error: ' + err);
		res.status(400).json(err);
	}*/

	let success = true;
	clients.forEach((client, key) => {
		console.log('Sending remote control command to bots...');
		// TODO: hardcoded to Teddy Bear for now, change to bot.name
		if (key === 'Teddy Bear' /*bot.name*/) {
			try {
				client.send(formattedMessage);
				success = true;
			} catch (e) {
				console.error(e);
			}
		}
	});

	if (success) return res.json(`Successfully communicated message`);
	else
		return res.json(
			`An error occurred in transmitting the message to the bot. Please try again.`
		);
});

module.exports = controlRouter;
