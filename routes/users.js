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

router.route('/user').get(async (req, res) => {
	const firebaseIdToken = req.query.firebaseIdToken;
	if (!firebaseIdToken)
		return res
			.status(400)
			.json(`'firebaseIdToken' not provided in request params`);

	try {
		const decodedToken = await admin.auth().verifyIdToken(firebaseIdToken);
		let data = await User.findOne({ firebaseId: decodedToken.uid }).exec();
		if (data) res.json(data);
		else res.status(404).json('Cannot find user');
	} catch (err) {
		console.log('Error: ' + err);
		res.status(400).json(err);
		return;
	}
});

/**
 * ------------------------- POST (add new objects) -------------------------
 */

/**
 * Adds a new User object with the username and firebaseIdToken provided in the
 * request body
 */
router.route('/add').post(async (req, res) => {
	const { username, firebaseIdToken } = req.body;

	if (!firebaseIdToken || !username) {
		return res
			.status(400)
			.json(
				'Required username / firebaseIdToken not provided in request body.'
			);
	}

	let uid;
	try {
		const decodedToken = await admin.auth().verifyIdToken(firebaseIdToken);
		uid = decodedToken.uid;
	} catch (err) {
		console.log('Error: ' + err);
		res.status(400).json(err);
		return;
	}

	const newUser = new User({
		firebaseId: uid,
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
	const { firebaseIdToken, isOrganizer } = req.body;

	if (!firebaseIdToken || isOrganizer === undefined) {
		return res
			.status(400)
			.json(
				'Required firebaseIdToken / isOrganizer not provided in request body.'
			);
	}

	let uid;
	try {
		const decodedToken = await admin.auth().verifyIdToken(firebaseIdToken);
		uid = decodedToken.uid;
	} catch (err) {
		console.log('Error ' + err);
		res.status(400).json(err);
		return;
	}

	try {
		let user = await User.findOne({ firebaseId: uid });

		if (!user)
			return res
				.status(404)
				.json('Could not find user specified by firebaseIdToken.');

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
	const { firebaseIdToken } = req.body;

	if (!firebaseIdToken) {
		return res
			.status(400)
			.json('Required firebaseIdToken not provided in request body.');
	}

	let uid;
	try {
		const decodedToken = await admin.auth().verifyIdToken(firebaseIdToken);
		uid = decodedToken.uid;
	} catch (err) {
		console.log('Error ' + err);
		res.status(400).json(err);
		return;
	}

	try {
		let user = await User.findOne({ firebaseId: uid });

		if (!user)
			return res
				.status(404)
				.json('Could not find user specified by firebaseIdToken.');

		await user.deleteOne();
		res.json('User ' + uid + ' was deleted!');
	} catch (err) {
		console.log('Error: ' + err);
		res.status(400).json(err);
	}
});

module.exports = router;
