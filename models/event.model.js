const mongoose = require('mongoose');
const bruinbot = require('./bruinbot.model.js');
const user = require('./user.model.js');
const item = require('./item.model.js');

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
		type: [item.schema],
		required: true,
		unique: false,
		sparse: true,
	},
	bots: {
		type: [bruinbot.schema],
		required: true,
		unique: false,
		sparse: true,
	},
	admins: {
		type: [user.schema],
		required: true,
		unique: false,
		sparse: true,
	},
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
