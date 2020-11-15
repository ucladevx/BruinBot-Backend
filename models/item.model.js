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
		event_id: {
			type: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
		},
	},
	{
		timestampes: true,
	}
);

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
