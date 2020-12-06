const chai = require('chai');
const chaiHttp = require('chai-http');
const suppressLogs = require('mocha-suppress-logs');
const assert = require('assert');
let app = require('../app.js');
const fs = require('fs');

let { Item } = require('../models/item.model.js');
let { Event } = require('../models/event.model.js');
let { createAndSaveEvent } = require('./utils.js');

const testPort = 8888;
chai.use(chaiHttp);

/*const exampleItemA = {
	name: 'Boba',
	price: 4.99,
	img: 'Boba',
	eventId: '5fb49d9b30f3d1586ff2a355',
};*/

const exampleEvent = {
	name: 'Bear Gathering',
	bot_ids: ['5fc8e9d411fb0d00125750d3', '5fc90026d5869f00143e7fa6'],
	admin_ids: ['5fc9014bd5869f00143e7fab'],
};

/*const exampleItemB = {
	name: 'Chai',
	price: 5.49,
	img:
		'https://www.ohhowcivilized.com/wp-content/uploads/2019/05/0519-bubble-tea-14.jpg',
	eventId: '5fb49d9b30f3d1586ff2a354',
};*/

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

	/*describe('post /items/add', () => {
		it('Should add an Item', async () => {
			let event = await createAndSaveEvent(exampleEvent);

			const res = await chai
				.request(app)
				.post('/items/add')
				.set('content-type', 'multipart/form-data')
				.field('name', 'Boba')
				.field('price', '4.99')
				.field('eventId', event._id.toString())
				.attach(
					'img',
					fs.readFileSync(`${__dirname}/assets/boba.jpg`),
					'boba.jpg'
				);
			console.log(res);
			/*assert.strictEqual(res.status, 200);
			let items = await Item.find();
			assert.strictEqual(items.length, 1);
		});*/

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
					fs.readFileSync(`${__dirname}/assets/boba.jpg`),
					'boba.jpg'
				)
				.then(async (res) => {
					console.log(res);
					assert.strictEqual(res.status, 200);
					let items = await Item.find();
					assert.strictEqual(items.length, 1);
				});
		});
	});

	/*it('Should update weight of an item', async () => {
		let savedItem = await createAndSaveItem(exampleItemB);

		return await chai
			.request(app)
			.put('/items/weight')
			.send({
				id: savedItem._id,
				weight: 12.7,
			})
			.then(async (res) => {
				assert.strictEqual(res.status, 200);
				let item = await Item.findById(savedItem._id);
				assert.strictEqual(item.weight, 12.7);
			});
	});*/
});

/**
 * Creates item in memory and saves it to the test database
 *
 * @param {object} item Item object with name, price, image, and event_id
 * @returns {object} Saved item in database
 */
/*async function createAndSaveItem(item) {
	let newItem = new Item({
		name: item.name,
		price: item.price,
		weight: 0.0,
		img: item.img,
	});

	return await newItem.save();
}
*/
