const express = require('express');

const router = express.Router();

let { User } = require('../models/user.model');
let admin = require('firebase-admin');

let jsonKey = process.env.FIREBASE_KEY;

admin.initializeApp({
	credential: admin.credential.cert(JSON.parse(jsonKey)),
	databaseURL: process.env.FIREBASE_URL,
});

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
 * Adds a new User object with the username and firebase_id_token provided in the
 * request body
 */
router.route('/add').post(async (req, res) => {
	const { username, firebase_id_token } = req.body;

	if (!firebase_id_token || !username) {
		return res
			.status(400)
			.json(
				'Required username / firebase_id_token not provided in request body.'
			);
	}

	let uid;
	try {
		const decodedToken = await admin.auth().verifyIdToken(firebase_id_token);
		uid = decodedToken.uid;
	} catch (err) {
		console.log('Error ' + err);
		res.status(400).json(err);
		return;
	}

	const newUser = new User({
		firebase_id: uid,
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
 * Adds/removes user given by firebase id token as organizer based
 * on the boolean passed in as isOrganizer
 */
router.route('/organizer').put(async (req, res) => {
	const { firebase_id_token, isOrganizer } = req.body;

	if (!firebase_id_token || isOrganizer === undefined) {
		return res
			.status(400)
			.json(
				'Required firebase_id_token / isOrganizer not provided in request body.'
			);
	}

	let uid;
	try {
		const decodedToken = await admin.auth().verifyIdToken(firebase_id_token);
		uid = decodedToken.uid;
	} catch (err) {
		console.log('Error ' + err);
		res.status(400).json(err);
		return;
	}

	try {
		let user = await User.findOne({ firebase_id: uid });

		if (!user)
			return res
				.status(404)
				.json('Could not find user specified by firebase_id_token.');

		user.isOrganizer = isOrganizer;
		user.save();
		if (isOrganizer) res.json('User ' + uid + ' was made organizer!');
		else res.json('User ' + uid + ' was removed as an organizer!');
	} catch (err) {
		console.log('Error: ' + err);
		res.status(400).json(err);
	}
});

/**
 * ------------------------- DELETE (remove objects) ------------------------
 */

/**
 * Deletes a user by firebase id token
 */
router.route('/').delete(async (req, res) => {
	const { firebase_id_token } = req.body;

	if (!firebase_id_token) {
		return res
			.status(400)
			.json('Required firebase_id_token not provided in request body.');
	}

	let uid;
	try {
		const decodedToken = await admin.auth().verifyIdToken(firebase_id_token);
		uid = decodedToken.uid;
	} catch (err) {
		console.log('Error ' + err);
		res.status(400).json(err);
		return;
	}

	try {
		let user = await User.findOne({ firebase_id: uid });

		if (!user)
			return res
				.status(404)
				.json('Could not find user specified by firebase_id_token.');

		await user.deleteOne();
		res.json('User ' + uid + ' was deleted!');
	} catch (err) {
		console.log('Error: ' + err);
		res.status(400).json(err);
	}
});

module.exports = router;
