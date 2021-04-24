const express = require('express');

const { Email } = require('../models/email.model');

const router = express.Router();

router.post('/', async (req, res) => {
	const { email } = req.body;

	if (!email) return res.status(404).json('Please provide an email address.');

	try {
		const newEmail = new Email({
			email,
		});
		const savedEmail = await newEmail.save();
		return res.json(savedEmail);
	} catch (err) {
		console.log('Error: ' + err);
		res.status(400).json(err);
	}
});

module.exports = router;
