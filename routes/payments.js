const express = require('express');

const router = express.Router();
// TODO: set up API keys
const stripe = require('stripe')(process.env.STRIPE_API_KEY);

router.route('/createPaymentIntent').post(async (req, res) => {
	const { items } = req.body;

	// Create a PaymentIntent with the order amount and currency
	const paymentIntent = await stripe.paymentIntents.create({
		amount: items.length,
		currency: 'usd',
		automatic_payment_methods: {
			enabled: true,
		},
	});

	res.send({
		clientSecret: paymentIntent.client_secret,
	});
});
