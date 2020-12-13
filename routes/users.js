const express = require('express');

const router = express.Router();

let { User } = require('../models/user.model');
let admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://bruinbot-8d68e.firebaseio.com"
});

router.route('/').get((req, res) => {
	User.find()
		.then((users) => res.json(users))
		.catch((err) => res.status(400).json(err));
});

router.route('/add').post(async (req, res) => {
	const username = req.body.username;
	const firebase_id_token = req.body.firebase_id_token;
	let uid;
	try {
		const decodedToken = await admin.auth().verifyIdToken(firebase_id_token)
		uid = decodedToken.uid;
	} catch (err){
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

router.route('/').delete(async (req, res) => {
	const firebase_id_token = req.body.firebase_id_token;
	let uid;
	try {
		const decodedToken = await admin.auth().verifyIdToken(firebase_id_token)
		uid = decodedToken.uid;
	} catch (err){
		console.log('Error ' + err);
		res.status(400).json(err);
		return;
	}
	User.findOneAndDelete({ firebase_id: uid })
		.then(() => res.json('User ' + uid + ' was deleted!'))
		.catch((err) => res.status(400).json(err));
});

router.route('/makeOrganizer').post(async (req, res) => {

	const firebase_id_token = req.body.firebase_id_token;
	let uid;
	try {
		const decodedToken = await admin.auth().verifyIdToken(firebase_id_token)
		uid = decodedToken.uid;
	} catch (err){
		console.log('Error ' + err);
		res.status(400).json(err);
		return;
	}

	User.findOne({ firebase_id: uid })
		.then((user) => {
			user.isOrganizer = true;
			user.save();
		})
		.then(() =>
			res.json('User ' + uid + ' was made organizer!')
		)
		.catch((err) => res.status(400).json(err));
});

router.route('/removeOrganizer').post(async (req, res) => {

	const firebase_id_token = req.body.firebase_id_token;
	let uid;
	try {
		const decodedToken = await admin.auth().verifyIdToken(firebase_id_token)
		uid = decodedToken.uid;
	} catch (err){
		console.log('Error ' + err);
		res.status(400).json(err);
		return;
	}

	User.findOne({ firebase_id: uid })
		.then((user) => {
			user.isOrganizer = false;
			user.save();
		})
		.then(() =>
			res.json('User ' + uid + ' was made not an organizer!')
		)
		.catch((err) => res.status(400).json(err));
});

module.exports = router;
