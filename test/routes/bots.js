const chai = require('chai');
const chaiHttp = require('chai-http');
const suppressLogs = require('mocha-suppress-logs');
const assert = require('assert');
let { app } = require('../../app');

let { BruinBot } = require('../../models/bruinbot.model');
let { createAndSaveBot } = require('./utils');

const testPort = 8888;
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

// Doesn't exist statement until server is set up
before((done) => {
	app.on('Mongoose ready', () => {
		app = app.listen(testPort, async () => {
			console.log(`This server is running on port ${testPort}!\n`);

			// Start from a fresh db collection
			await BruinBot.deleteMany({});
			done();
		});
	});
});

describe('Bot routes', () => {
	suppressLogs();

	// Clean up after each test
	afterEach(async () => {
		await BruinBot.deleteMany({});
	});

	describe('get /bots/bot', () => {
		it('Should return a specific BruinBot', async () => {
			let botA = await createAndSaveBot(exampleBotA);

			return await chai
				.request(app)
				.get('/bots/bot')
				.query({ botId: botA._id.toString() })
				.then((res) => {
					assert.strictEqual(res.status, 200);
					assert.strictEqual(exampleBotA.name, res.body.name);
				});
		});

		it('Should return error status if BruinBot not found', async () => {
			await createAndSaveBot(exampleBotA);

			return await chai
				.request(app)
				.get('/bots/bot')
				.query({ botId: 'clearlyWrongId' })
				.then((res) => {
					assert.notStrictEqual(res.status, 200);
				});
		});
	});

	describe('get /bots/closest', () => {
		it('Should return closest of two BruinBots', async () => {
			await createAndSaveBot(exampleBotA);
			await createAndSaveBot(exampleBotB);

			return await chai
				.request(app)
				.get('/bots/closest')
				.query({ longitude: 149, latitude: 149 })
				.then((res) => {
					assert.strictEqual(res.status, 200);
					assert.strictEqual(exampleBotA.name, res.body.name);
				});
		});
	});

	describe('get /bots/location', () => {
		it('Should return a location of a BruinBot', async () => {
			let botA = await createAndSaveBot(exampleBotA);

			return await chai
				.request(app)
				.get('/bots/location')
				.query({ botId: botA._id.toString() })
				.then((res) => {
					assert.strictEqual(res.status, 200);
					assert.strictEqual(exampleBotA.longitude, res.body.longitude);
					assert.strictEqual(exampleBotA.latitude, res.body.latitude);
				});
		});
	});

	describe('post /bots', () => {
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

		it('Should reject creation of BruinBot with duplicate name', async () => {
			await createAndSaveBot(exampleBotA);

			return await chai
				.request(app)
				.post('/bots')
				.send(exampleBotA)
				.then(async (res) => {
					assert.notStrictEqual(res.status, 200);
				});
		});
	});

	describe('delete /bots', () => {
		it('Should delete a BruinBot', async () => {
			let savedBot = await createAndSaveBot(exampleBotA);

			return await chai
				.request(app)
				.delete('/bots')
				.send({
					botId: savedBot._id,
				})
				.then(async (res) => {
					assert.strictEqual(res.status, 200);
					let bots = await BruinBot.find();
					assert.strictEqual(bots.length, 0);
				});
		});

		it('Should return error status if BruinBot not found', async () => {
			return await chai
				.request(app)
				.delete('/bots')
				.send({
					botId: 'clearlyWrongId',
				})
				.then(async (res) => {
					assert.notStrictEqual(res.status, 200);
				});
		});
	});
});

after(async () => {
	app.close();
});
