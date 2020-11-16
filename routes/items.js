const express = require('express');
const mongoose = require('mongoose');
var multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');

const router = express.Router();
let Item = require('../models/item.model');

const uri = process.env.ATLAS_URI;
const connection = mongoose.connection;

let gfs;
connection.once('open', () => {
	gfs = new mongoose.mongo.GridFSBucket(connection.db, {
		bucketName: 'itemimages',
	});
});

const storage = new GridFsStorage({
	url: uri,
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

const upload = multer({ storage });

/*
 * Remove an image with name filename from database
 */
const removeOneImage = async (filename) => {
	const imgs = await gfs.find({ filename }).toArray();
	if (!imgs || !imgs.length) {
		return;
	}
	gfs.delete(imgs[0]._id);
};

/**
 * Get a list of all items
 */
router.get('/', (req, res) => {
	Item.find()
		.then((items) => res.json(items))
		.catch((err) => res.status(400).json('Error: ' + err));
});

/**
 * Delete 1 item specified by item name
 */
router.delete('/', (req, res) => {
	const { name } = req.query;
	if (!name) {
		return res.status(404).json({
			err: 'Please provide a name to delete',
		});
	}

	Item.findOne({ name })
		.then(async (item) => {
			const { img, _id } = item;
			await Item.deleteOne({ _id });
			await removeOneImage(img);
			return res.send(`${name} is removed!`);
		})
		.catch((err) => {
			return res.status(400).json(err);
		});
});

/**
 * Get image of item by the image's filename
 */
router.get('/img', (req, res) => {
	const { img } = req.query;
	if (!img) {
		return res.status(404).json({
			err: 'Please provide an image filename.',
		});
	}
	const downloadStream = gfs.openDownloadStreamByName(img);
	downloadStream.on('data', (chunk) => {
		res.write(chunk);
	});
	downloadStream.on('error', () => {
		res.status(404).json({
			err: 'Something went wrong when retrieving the image...',
		});
	});
	downloadStream.on('end', () => {
		res.end();
	});
});

/**
 * Add an item
 * The POST request should be multi-part/form-data
 *
 * See how GridFS works in Notion Wiki
 */
router.post('/add', upload.single('img'), (req, res) => {
	if (!req.file) {
		return res.status(404).json({
			err: 'Please provide an image.',
		});
	}
	const { name, price } = req.body;
	if (!name || !price) {
		removeOneImage(req.file.originalname);
		return res.status(404).json({
			err: 'Please provide name and price.',
		});
	}

	const newItem = new Item({
		name: name,
		price: price,
		img: req.file.originalname,
	});

	newItem
		.save()
		.then(() => res.json('Item ' + name + ' was added!'))
		.catch((err) => {
			removeOneImage(req.file.originalname);
			return res.status(400).json(err);
		});
});

module.exports = router;
