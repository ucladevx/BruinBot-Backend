const express = require('express');

const router = express.Router();
let User = require('../models/user.model');

router.route('/').get((req, res) => {
	User.find()
		.then((users) => res.json(users))
		.catch((err) => res.status(400).json('Error: ' + err));
});

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
		.catch((err) => res.status(400).json('Error: ' + err));
});

/**
 * Update User object with specified id to have new event.
 */
router.route('/updateEvent').put((req, res) => {
	const { id, event_id } = req.body;

	if (!id || !event_id) {
		return res.status(400).json({
			err: "Required id / event_id data not in request's body.",
		});
	}

	User.findOneAndUpdate({ _id: id }, { event_id: event_id }, (err) => {
		if (err) {
			console.log(err);
			res.status(400).send(err);
		} else {
			res.json('User ' + id + ' was updated.');
		}
	});
});

router.route('/').delete((req, res) => {
	//deletes by id
	User.findOne({ firebase_id: req.body.firebase_id })
		.then((user) => user.remove())
		.then(() => res.json('User ' + req.body.firebase_id + ' was deleted!'))
		.catch((err) => res.status(400).json('Error: ' + err));
});

module.exports = router;
