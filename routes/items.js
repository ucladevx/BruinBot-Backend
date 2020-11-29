const express = require('express');

const router = express.Router();

let mongoose = require('mongoose');
let multer = require('multer');
let GridFsStorage = require('multer-gridfs-storage');

let Item = require('../models/item.model');
let Event = require('../models/event.model');

// There exists a separate database for testing
let uri = process.env.ATLAS_URI;
if (process.env.NODE_ENV === 'test') {
	uri = process.env.ATLAS_URI_TEST;
}

const connection = mongoose.connection;

let gfs;
let upload = multer();
connection.once('open', () => {
	gfs = new mongoose.mongo.GridFSBucket(connection.db, {
		bucketName: 'itemimages',
	});

	let storage = new GridFsStorage({
		db: connection,
		file: (req, file) => {
			return new Promise((resolve, reject) => {
				if (!file || !file.originalname) {
					reject({ err: 'No file found...' });
				}
				const filename = file.originalname;
				const fileInfo = {
					filename: filename,
					bucketName: 'itemimages',
				};
				resolve(fileInfo);
			});
		},
	});

	upload = multer({ storage });
});

/**
 * ----------------- GET (return information about objects) ----------------
 */

/**
 * Get a list of all items
 */
router.get('/', (req, res) => {
	Item.find()
		.then((items) => res.json(items))
		.catch((err) => res.status(400).json(err));
});

/**
 * Get image of item by the image's filename
 */
router.get('/img', (req, res) => {
	const { img } = req.query;
	if (!img) {
		return res.status(404).json('Please provide an image filename.');
	}
	const downloadStream = gfs.openDownloadStreamByName(img);
	downloadStream.on('data', (chunk) => {
		res.write(chunk);
	});
	downloadStream.on('error', () => {
		res.status(404).json('Something went wrong when retrieving the image...');
	});
	downloadStream.on('end', () => {
		res.end();
	});
});

/**
 * ------------------------- POST (add new objects) -------------------------
 */

/**
 * Adds an item
 * The POST request should be multi-part/form-data
 *
 * See how GridFS works in Notion Wiki
 */
router.post('/add', upload.single('img'), (req, res) => {
	if (!req.file) {
		return res.status(404).json('Please provide an image.');
	}

	const { name, price, eventId, weight } = req.body;

	if (!name || !price || !eventId || !weight) {
		removeOneImage(req.file.originalname);
		return res.status(404).json('Please provide name, price, and eventId.');
	}

	const newItem = new Item({
		name: name,
		price: price,
		img: req.file.originalname,
		weight: weight,
	});

	Event.findByIdAndUpdate(eventId, { $push: { items: newItem } })
		.then(() => newItem.save())
		.then((item) => {
			console.log(`Successfully added item: ${item}`);
			res.json(item);
		})
		.catch((err) => {
			console.log('Error: ' + err);
			res.status(400).json(err);
		});
});

/**
 * ------------------------- DELETE (remove objects) ------------------------
 */

/**
 * Delete item specified by item id
 */
router.delete('/', (req, res) => {
	const itemId = req.body.id;

	if (!itemId) {
		res.status(400).json('Required itemId not provided in requets body.');
	}

	Item.findById(itemId)
		.then(async (item) => {
			const { img, _id } = item;
			await Item.findByIdAndDelete(_id);
			await removeOneImage(img);

			console.log(`Successfully deleted item: ${item}`);
			res.json(`Sucessfully removed item ${itemId}`);
		})
		.catch((err) => {
			console.log('Error: ' + err);
			res.status(400).json(err);
		});
});

module.exports = router;

/**
 * ---------------------------- Helper functions ----------------------------
 */

/**
 * Remove an image with name filename from database
 *
 * @param {string} fileName Name of the image file to be deleted
 */
async function removeOneImage(fileName) {
	const imgs = await gfs.find({ fileName }).toArray();
	if (!imgs || !imgs.length) {
		console.log(
			`Error: Could not delete image file with with name ${fileName}.`
		);
	} else {
		console.log(`Successfully deleted image file ${fileName}.`);
		gfs.delete(imgs[0]._id);
	}
}
