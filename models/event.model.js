const mongoose = require('mongoose');

const schema = mongoose.Schema;

const eventSchema = new schema({
	name: {
		type: String,
		required: true,
		trim: true,
		unique: false,
		sparse: true,
	},
	items: {
		type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
		required: true,
		unique: true,
		sparse: true,
	},
	bots: {
		type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BruinBot' }],
		required: true,
		unique: false,
		sparse: true,
	},
});

const Event = mongoose.model('Event', eventSchema);

module.exports.Event = Event;
