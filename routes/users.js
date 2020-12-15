const express = require('express');

const router = express.Router();

let { User } = require('../models/user.model');

/**
 * ----------------- GET (return information about objects) ----------------
 */

router.route('/').get((req, res) => {
	User.find()
		.then((users) => res.json(users))
		.catch((err) => res.status(400).json(err));
});

/**
 * ------------------------- POST (add new objects) -------------------------
 */

router.route('/add').post((req, res) => {
	const username = req.body.username;
	const firebase_id = req.body.firebase_id;

	const newUser = new User({
		firebase_id: firebase_id,
		username: username,
	});

	newUser
		.save()
		.then(() => res.json(newUser))
		.catch((err) => res.status(400).json(err));
});

// TODO: make PUT
router.route('/makeOrganizer').post((req, res) => {
	User.findOne({ firebase_id: req.body.firebase_id })
		.then((user) => {
			user.isOrganizer = true;
			user.save();
		})
		.then(() =>
			res.json('User ' + req.body.firebase_id + ' was made organizer!')
		)
		.catch((err) => res.status(400).json(err));
});

// TODO: delete and combine with above
router.route('/removeOrganizer').post((req, res) => {
	User.findOne({ firebase_id: req.body.firebase_id })
		.then((user) => {
			user.isOrganizer = false;
			user.save();
		})
		.then(() =>
			res.json('User ' + req.body.firebase_id + ' was made not an organizer!')
		)
		.catch((err) => res.status(400).json(err));
});

/**
 * ------------------------- DELETE (remove objects) ------------------------
 */

router.route('/').delete((req, res) => {
	User.findOneAndDelete({ firebase_id: req.body.firebase_id })
		.then(() => res.json('User ' + req.body.firebase_id + ' was deleted!'))
		.catch((err) => res.status(400).json(err));
});

module.exports = router;
