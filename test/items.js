const chai = require('chai');
const chaiHttp = require('chai-http');
const suppressLogs = require('mocha-suppress-logs');
const assert = require('assert');
let app = require('../app.js');
const fs = require('fs');

let { Item } = require('../models/item.model.js');
let { Event } = require('../models/event.model.js');
let { createAndSaveEvent, createAndSaveItem } = require('./utils.js');
let { deleteImageFromS3 } = require('../routes/utils.js');

const testPort = 8888;
chai.use(chaiHttp);

const exampleItemA = {
	name: 'Boba',
	price: 4.99,
	img: 'Boba',
};

const exampleEvent = {
	name: 'Bear Gathering',
	bot_ids: ['5fc8e9d411fb0d00125750d3', '5fc90026d5869f00143e7fa6'],
	admin_ids: ['5fc9014bd5869f00143e7fab'],
};

// Doesn't exist statement until server is set up
before((done) => {
	app.on('Mongoose ready', () => {
		app = app.listen(testPort, () => {
			console.log(`This server is running on port ${testPort}!\n`);
			done();
		});
	});
});

describe('Item', () => {
	suppressLogs();

	// Start from fresh collection for each test
	beforeEach(async () => {
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

					await deleteImageFromS3(res.body.imgKey);
				});
		});

		it('Should reject creation of an Item without image file', async () => {
			let event = await createAndSaveEvent(exampleEvent);

			return await chai
				.request(app)
				.post('/items/add')
				.set('content-type', 'multipart/form-data')
				.field('name', 'Boba')
				.field('price', 4.99)
				.field('eventId', event._id.toString())
				.then(async (res) => {
					assert.notStrictEqual(res.status, 200);
				});
		});

		it('Should reject creation of an Item without name, price, or eventId', async () => {
			return await chai
				.request(app)
				.post('/items/add')
				.set('content-type', 'multipart/form-data')
				.attach(
					'img',
					fs.readFileSync(`${__dirname}/assets/sample-image.jpg`),
					'sample-image.jpg'
				)
				.then(async (res) => {
					assert.notStrictEqual(res.status, 200);
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
					let item = await Item.findById(savedItem._id.toString());
					assert.strictEqual(item.weight, 12.7);
					await deleteImageFromS3(savedItem.imgKey);
				});
		});

		it('Should reject update weight of an item without id/weight', async () => {
			let event = await createAndSaveEvent(exampleEvent);
			let savedItem = await createAndSaveItem(exampleItemA, event._id);

			return await chai
				.request(app)
				.put('/items/weight')
				.then(async (res) => {
					assert.strictEqual(res.status, 400);
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
					assert.strictEqual(res.status, 404);
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
					let updatedEvent = await Event.findById(event._id.toString());
					assert.strictEqual(updatedEvent.items.length, 0);
				});
		});

		it('Should reject delete an item without itemId/eventId', async () => {
			let event = await createAndSaveEvent(exampleEvent);
			let savedItem = await createAndSaveItem(exampleItemA, event._id);

			return await chai
				.request(app)
				.delete('/items')
				.then(async (res) => {
					assert.strictEqual(res.status, 400);
					await deleteImageFromS3(savedItem.imgKey);
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
					assert.strictEqual(res.status, 404);
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
					assert.strictEqual(res.status, 404);
					await deleteImageFromS3(savedItem.imgKey);
				});
		});
	});
});

after(async () => {
	await Item.deleteMany({});
	await Event.deleteMany({});
	app.close();
});
