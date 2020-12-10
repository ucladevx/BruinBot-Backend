const express = require('express');

const router = express.Router();

let { User } = require('../models/user.model');

/**
 * ----------------- GET (return information about objects) ----------------
 */

/**
 * Gets all the users
 */
router.route('/').get((req, res) => {
	User.find()
		.then((users) => res.json(users))
		.catch((err) => res.status(400).json(err));
});

/**
 * ------------------------- POST (add new objects) -------------------------
 */

/**
 * Adds a new User object with the username and firebase_id provided in the
 * request body
 */
router.route('/add').post((req, res) => {
	const { username, firebase_id } = req.body;

	if (!firebase_id || !username)
		return res
			.status(400)
			.json('Required username / firebase_id not provided in request body.');

	const newUser = new User({
		firebase_id: firebase_id,
		username: username,
	});

	newUser
		.save()
		.then(() => res.json(newUser))
		.catch((err) => res.status(400).json(err));
});

/**
 * --------------------- PUT (update existing objects) ----------------------
 */

/**
 * Sets user given by firebase id as an organizer
 */
router.route('/makeOrganizer').put(async (req, res) => {
	const { firebase_id } = req.body;

	if (!firebase_id)
		return res
			.status(400)
			.json('Required firebase_id not provided in request body.');

	try {
		let user = await User.findOne({ firebase_id: firebase_id });

		if (!user)
			return res
				.status(404)
				.json('Could not find user specified by firebase_id.');

		user.isOrganizer = true;
		user.save();
		res.json('User ' + req.body.firebase_id + ' was made organizer!');
	} catch (err) {
		console.log('Error: ' + err);
		res.status(400).json(err);
	}
});

/**
 * Removes user given by firebase id as an organizer
 */
router.route('/removeOrganizer').put(async (req, res) => {
	const { firebase_id } = req.body;

	if (!firebase_id)
		return res
			.status(400)
			.json('Required firebase_id not provided in request body.');

	try {
		let user = await User.findOne({ firebase_id: firebase_id });

		if (!user)
			return res
				.status(404)
				.json('Could not find user specified by firebase_id.');

		user.isOrganizer = false;
		user.save();
		res.json('User ' + req.body.firebase_id + ' was made not an organizer!');
	} catch (err) {
		console.log('Error: ' + err);
		res.status(400).json(err);
	}
});

/**
 * ------------------------- DELETE (remove objects) ------------------------
 */

/**
 * Deletes a user by firebase id
 *
 */
router.route('/').delete(async (req, res) => {
	const { firebase_id } = req.body;

	if (!firebase_id)
		return res
			.status(400)
			.json('Required firebase_id not provided in request body.');

	try {
		let user = await User.findOne({ firebase_id: firebase_id });

		if (!user)
			return res
				.status(404)
				.json('Could not find user specified by firebase_id.');

		user.deleteOne();
		res.json('User ' + firebase_id + ' was deleted!');
	} catch (err) {
		console.log('Error: ' + err);
		res.status(400).json(err);
	}
});

module.exports = router;
