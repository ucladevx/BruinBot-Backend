const express = require('express');

const remoteControlRouter = express.Router();

remoteControlRouter.route('/move').post(async (req, res) => {
	const { botId, message } = req.body;

	// Missing request data
	if (!botId || !message)
		return res
			.status(400)
			.json(`'botId' and/or 'message' not provided in request body`);

	console.log(message);

	// validate message
	if (
		message.toUpperCase() !== 'UP' ||
		message.toUpperCase() !== 'DOWN' ||
		message.toUpperCase() !== 'RIGHT' ||
		message.toUpperCase() !== 'LEFT'
	) {
		console.log('INVALID MESSAGE');
		return res.status(400).json(`Invalid message type`);
	}

	// TODO:Send message through websocket

	return res.json(`Successfully communicated message`);
});

module.exports = remoteControlRouter;
