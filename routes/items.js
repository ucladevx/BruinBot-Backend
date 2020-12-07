const express = require('express');
const mongoose = require('mongoose');
let multer = require('multer');

let { Item } = require('../models/item.model');
let { Event } = require('../models/event.model');
let { uploadImageToS3, deleteImageFromS3 } = require('./utils.js');

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * ------------------------- POST (add new objects) -------------------------
 */

/**
 * Add an item with weight 0.
 *
 * The body of POST request should be multi-part/form-data - see the Notion for
 * more information about S3
 */
router.post('/add', upload.single('img'), async (req, res) => {
	if (!req.file) {
		return res.status(404).json('Please provide an image.');
	}

	const { name, price, eventId } = req.body;

	if (!name || !price || !eventId)
		return res.status(404).json('Please provide name, price, and eventId.');

	try {
		let event = await Event.findById(eventId);

		if (!event)
			return res.status(404).json('Could not find event specified by eventId.');

		let data = await uploadImageToS3(req.file);

		const newItem = new Item({
			name,
			price,
			imgSrc: data.Location,
			imgKey: data.Key,
			weight: 0.0,
		});

		event.items.push(newItem);
		await event.save();
		const savedItem = await newItem.save();
		res.json(savedItem);
	} catch (err) {
		console.log('Error: ' + err);
		res.status(400).json(err);
	}
});

/**
 * ------------------------- PUT (update existing objects) ------------------------
 */

/**
 * Update weight of item specified by item id
 */
router.route('/weight').put(async (req, res) => {
	const { itemId, weight } = req.body;

	if (!itemId || !weight)
		res
			.status(400)
			.json("Required itemId and/or weight not provided in request's body.");

	try {
		if (!mongoose.Types.ObjectId.isValid(itemId))
			return res.status(404).json('Could not find item specified by itemId.');

		let item = await Item.findById(itemId);

		if (!item)
			return res.status(404).json('Could not find item specified by itemId.');

		item.weight = weight;
		await item.save();
		res.json('Weight successfully updated for Item ' + itemId + '.');
	} catch (err) {
		console.log('Error ' + err);
		res.status(400).json(err);
	}
});

/**
 * ------------------------- DELETE (remove objects) ------------------------
 */

/**
 * Delete item specified by item id
 *
 * @param {string} itemId Object ID of the item to be deleted.
 * @param {string} eventId Object ID of the event to be modified.
 */
router.delete('/', async (req, res) => {
	const { itemId, eventId } = req.query;

	if (!itemId || !eventId)
		res.status(400).json('Required itemId not provided in requet body.');

	try {
		if (!mongoose.Types.ObjectId.isValid(itemId))
			return res.status(404).json('Could not find item specified by itemId.');
		if (!mongoose.Types.ObjectId.isValid(eventId))
			return res.status(404).json('Could not find item specified by eventId.');

		let event = await Event.findById(eventId);
		let item = await Item.findById(itemId);

		if (!event)
			return res.status(404).json('Could not find event specified by eventId.');
		if (!item)
			return res.status(404).json('Could not find item specified by itemId.');

		item.deleteOne();
		event.items.pull(itemId);
		await event.save();

		let data = await deleteImageFromS3(item.imgKey);
		res.json({ item, deletedImage: data });
	} catch (err) {
		console.log('Error: ' + err);
		res.status(400).json(err);
	}
});

module.exports = router;
