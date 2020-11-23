const mongoose = require('mongoose');

const schema = mongoose.Schema;

const itemSchema = new schema(
	{
		name: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		price: {
			type: Number,
			required: true,
		},
		img: {
			type: String,
			required: true,
		},
		weight: {
			type: Number,
			required: true,
		},
	},
	{
		timestampes: true,
	}
);

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
