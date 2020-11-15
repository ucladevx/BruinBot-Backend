const mongoose = require('mongoose');
const map = require('./map.model.js');

const schema = mongoose.Schema;

const bruinBotSchema = new schema({
	location: {
		type: map.Location.schema,
		required: true,
	},
	status: {
		type: String,
		required: true,
		enum: ['Idle', 'InTransit'],
		default: 'Idle',
	},
	name: {
		type: String,
		required: true,
		unique: true,
		trim: true,
	},
	event_id: {
		type: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
		required: false,
	},
});

const BruinBot = mongoose.model('BruinBot', bruinBotSchema);

module.exports = BruinBot;
