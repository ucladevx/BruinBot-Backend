const express = require('express');
const AWS = require('aws-sdk');

const router = express.Router();

let multer = require('multer');

let Item = require('../models/item.model');
let Event = require('../models/event.model');

const storage = multer.memoryStorage();

const upload = multer({ storage });

const s3 = new AWS.S3({
	accessKeyId: process.env.S3_ACCESS_KEY_ID,
	secretAccessKey: process.env.S3_ACCESS_KEY_SECRET,
});

const Bucket = 'bruinbot-item-images';

/**
 * ------------------------- POST (add new objects) -------------------------
 */

/**
 * Add an item with weight 0.
 *
 * The body of POST request should be multi-part/form-data - see the Notion for
 * more information about S3
 */
router.post('/add', upload.single('img'), (req, res) => {
	if (!req.file) {
		return res.status(404).json('Please provide an image.');
	}

	const { buffer, originalname, mimetype } = req.file;
	const { name, price, eventId } = req.body;

	if (!name || !price || !eventId) {
		return res.status(404).json('Please provide name, price, and eventId.');
	}

	const params = {
		Bucket,
		Key: originalname,
		Body: buffer,
		ContentType: mimetype,
		ACL: 'public-read',
	};

	try {
		s3.upload(params, async (err, data) => {
			if (err) {
				throw err;
			}

			const newItem = new Item({
				name,
				price,
				imgSrc: data.Location,
				imgKey: data.Key,
				weight: 0.0,
			});

			await Event.findByIdAndUpdate(eventId, { $push: { items: newItem } });
			const savedItem = await newItem.save();
			res.json(savedItem);
		});
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

	if (!itemId || !weight) {
		res
			.status(400)
			.json("Required itemId and/or weight not provided in request's body.");
	}

	try {
		await Item.findByIdAndUpdate(itemId, { weight: weight });
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

	if (!itemId || !eventId) {
		res.status(400).json('Required itemId not provided in requets body.');
	}

	try {
		const deletedItem = await Item.findByIdAndDelete(itemId);
		await Event.findByIdAndUpdate(eventId, { $pull: { items: itemId } });

		const params = {
			Bucket,
			Key: deletedItem.imgKey,
		};
		s3.deleteObject(params, (err, data) => {
			if (err) {
				throw err;
			}

			res.json({ deletedItem, deletedImage: data });
		});
	} catch (err) {
		console.log('Error: ' + err);
		res.status(400).json(err);
	}
});

module.exports = router;
