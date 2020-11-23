const chai = require('chai');
const chaiHttp = require('chai-http');
const suppressLogs = require('mocha-suppress-logs');
const assert = require('assert');
const app = require('../server');

let { BruinBot } = require('../models/bruinbot.model');
let { Location } = require('../models/map.model');

chai.use(chaiHttp);

const exampleBotA = {
	latitude: 100,
	longitude: 100,
	name: 'Bruin Bear',
};

const exampleBotB = {
	latitude: 200,
	longitude: 200,
	name: 'Polar Bear',
};

before((done) => {
	app.on('Ready', () => done());
});

describe('BruinBot', () => {
	suppressLogs();

	// Start from fresh collection for each test
	beforeEach(async () => {
		await BruinBot.deleteMany({});
	});

	it('Should return list of all BruinBots', async () => {
		await createAndSaveBot(exampleBotA);
		await createAndSaveBot(exampleBotB);

		return await chai
			.request(app)
			.get('/bots')
			.then((res) => {
				assert.strictEqual(res.status, 200);
				assert.ok(Array.isArray(res.body));
				assert.strictEqual(res.body.length, 2);
			});
	});

	it('Should add a BruinBot', async () => {
		return await chai
			.request(app)
			.post('/bots')
			.send(exampleBotA)
			.then(async (res) => {
				assert.strictEqual(res.status, 200);
				let bots = await BruinBot.find();
				assert.strictEqual(bots.length, 1);
			});
	});

	it('Should delete a BruinBot', async () => {
		let savedBot = await createAndSaveBot(exampleBotA);

		return await chai
			.request(app)
			.delete('/bots')
			.send({
				id: savedBot._id,
			})
			.then(async (res) => {
				assert.strictEqual(res.status, 200);
				let bots = await BruinBot.find();
				assert.strictEqual(bots.length, 0);
			});
	});
});

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
