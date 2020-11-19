const mongoose = require('mongoose');

const schema = mongoose.Schema;

const locationSchema = new schema({
	latitude: {
		type: Number,
		required: true,
	},
	longitude: {
		type: Number,
		required: true,
	},
});

/**
 * Represents a terminal node of one of the paths on the map. If this node
 * corresponds to an actual landmark, such as Powell Library, it can have a
 * name. Otherwise, if it is just a intermediary terminal node, keep the name
 * empty.
 */
const mapNodeSchema = new schema({
	location: {
		type: locationSchema,
		required: true,
	},
	name: {
		type: String,
	},
});

/**
 * NodeA and NodeB represent the two terminal nodes. 'points' will be all the
 * nodes between and excluding NodeA and NodeB.
 */
const pathSchema = new schema({
	points: {
		type: [locationSchema],
		required: true,
	},
	nodeA: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'MapNode',
		required: true,
	},
	nodeB: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'MapNode',
		required: true,
	},
});

const Location = mongoose.model('Location', locationSchema);
const MapNode = mongoose.model('MapNode', mapNodeSchema);
const Path = mongoose.model('Path', pathSchema);

module.exports = { Location, MapNode, Path };
