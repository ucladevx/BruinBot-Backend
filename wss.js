const WebSocket = require('ws');
let { BruinBot } = require('./models/bruinbot.model');
let { coordDistanceM } = require('./util/utils');
let { VICINITY } = require('./constants');

const wss = new WebSocket.Server({ noServer: true });

const updateLocationHandler = async function (botId, lat, lon) {
	try {
		let bot = await BruinBot.findById(botId);

		if (!bot) return;

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
	} catch (err) {
		console.log('Error: ' + err);
	}
};

const messageHandler = (msg) => {
	const msgSplit = msg.split(' ');
	console.log(msg);
	if (msgSplit[0] == 'LOCATION' && msgSplit.length == 4) {
		updateLocationHandler(msgSplit[1], msgSplit[2], msgSplit[3]);
		return 'Accepted and attempting location update request to database!';
	} else if (msgSplit[0] == 'JOIN') return 'Welcome to BruinBot!';
	else return 'Error: WebSocket request not valid.';
};

wss.on('connection', (ws) => {
	ws.on('message', (msg) => {
		ws.send(messageHandler(msg));
	});
});

module.exports.wss = wss;
