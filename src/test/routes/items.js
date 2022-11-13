const chai = require('chai');
const chaiHttp = require('chai-http');
const suppressLogs = require('mocha-suppress-logs');
const assert = require('assert');
let { app } = require('../../app');
const fs = require('fs');

let { Item } = require('../../models/item.model');
let { Event } = require('../../models/event.model');
let { createAndSaveEvent, createAndSaveItem } = require('./utils');
let { deleteImageFromS3 } = require('../../util/aws');

const testPort = 8888;
chai.use(chaiHttp);

const exampleItemA = {
	name: 'Boba',
	price: 4.99,
	img: 'Boba',
};

const exampleEvent = {
	name: 'Bear Gathering',
};

// Doesn't exist statement until server is set up
before((done) => {
	app.on('Mongoose ready', () => {
		app = app.listen(testPort, async () => {
			console.log(`This server is running on port ${testPort}!\n`);

			// Start from fresh db collections
			await Item.deleteMany({});
			await Event.deleteMany({});
			done();
		});
	});
});

describe('Item routes', () => {
	suppressLogs();

	// Clean up after each test
	afterEach(async () => {
		await Item.deleteMany({});
		await Event.deleteMany({});
	});

	describe('post /items/add', () => {
		it('Should add an Item', async () => {
			let event = await createAndSaveEvent(exampleEvent);

			return await chai
				.request(app)
				.post('/items/add')
				.set('content-type', 'multipart/form-data')
				.field('name', 'Boba')
				.field('price', 4.99)
				.field('eventId', event._id.toString())
				.attach(
					'img',
					fs.readFileSync(`${__dirname}/assets/sample-image.jpg`),
					'sample-image.jpg'
				)
				.then(async (res) => {
					assert.strictEqual(res.status, 200);
					let items = await Item.find();
					assert.strictEqual(items.length, 1);
					let updatedEvent = await Event.findById(event._id);
					assert.strictEqual(updatedEvent.items.length, 1);

					await deleteImageFromS3(res.body.imgKey);
				});
		});
	});

	describe('put /items/weight', () => {
		it('Should update weight of an item', async () => {
			let event = await createAndSaveEvent(exampleEvent);
			let savedItem = await createAndSaveItem(exampleItemA, event._id);

			return await chai
				.request(app)
				.put('/items/weight')
				.send({
					itemId: savedItem._id.toString(),
					weight: 12.7,
				})
				.then(async (res) => {
					assert.strictEqual(res.status, 200);
					let item = await Item.findById(savedItem._id);
					assert.strictEqual(item.weight, 12.7);

					await deleteImageFromS3(savedItem.imgKey);
				});
		});

		it('Should return error status if Item not found', async () => {
			let event = await createAndSaveEvent(exampleEvent);
			let savedItem = await createAndSaveItem(exampleItemA, event._id);

			return await chai
				.request(app)
				.put('/items/weight')
				.send({
					itemId: 'clearlyWrongId',
					weight: 12.7,
				})
				.then(async (res) => {
					assert.notStrictEqual(res.status, 200);

					await deleteImageFromS3(savedItem.imgKey);
				});
		});
	});

	describe('delete /items', () => {
		it('Should delete an item', async () => {
			let event = await createAndSaveEvent(exampleEvent);
			let savedItem = await createAndSaveItem(exampleItemA, event._id);

			return await chai
				.request(app)
				.delete('/items')
				.query({
					itemId: savedItem._id.toString(),
					eventId: event._id.toString(),
				})
				.then(async (res) => {
					assert.strictEqual(res.status, 200);
					let items = await Item.find();
					assert.strictEqual(items.length, 0);
					let updatedEvent = await Event.findById(event._id);
					assert.strictEqual(updatedEvent.items.length, 0);

					// await deleteImageFromS3(savedItem.imgKey);
				});
		});

		it('Should return error status if Item not found', async () => {
			let event = await createAndSaveEvent(exampleEvent);
			let savedItem = await createAndSaveItem(exampleItemA, event._id);

			return await chai
				.request(app)
				.delete('/items')
				.query({
					itemId: 'clearlyWrongId',
					eventId: event._id.toString(),
				})
				.then(async (res) => {
					assert.notStrictEqual(res.status, 200);

					await deleteImageFromS3(savedItem.imgKey);
				});
		});

		it('Should return error status if Event of Item is not found', async () => {
			let event = await createAndSaveEvent(exampleEvent);
			let savedItem = await createAndSaveItem(exampleItemA, event._id);

			return await chai
				.request(app)
				.delete('/items')
				.query({
					itemId: savedItem._id.toString(),
					eventId: 'clearlyWrongId',
				})
				.then(async (res) => {
					assert.notStrictEqual(res.status, 200);

					await deleteImageFromS3(savedItem.imgKey);
				});
		});
	});
});

after(() => {
	app.close();
});
