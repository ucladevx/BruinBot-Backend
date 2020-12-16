const mongoose = require('mongoose');
const map = require('./map.model.js');

const schema = mongoose.Schema;

// Represents an item and how many instances of it a bot holds
const inventoryArticle = new schema({
	item: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Item',
		required: true,
	},
	quantity: {
		type: Number,
		default: 0,
	},
});

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
	path: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Path',
		default: null,
	},
	name: {
		type: String,
		required: true,
		unique: true,
		trim: true,
	},
	inventory: {
		type: [inventoryArticle],
		required: true,
	},
});

const BruinBot = mongoose.model('BruinBot', bruinBotSchema);
const InventoryArticle = mongoose.model('InventoryArticle', inventoryArticle);

module.exports = { BruinBot, InventoryArticle };
