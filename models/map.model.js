const mongoose = require("mongoose");

const schema = mongoose.Schema;

const locationSchema = new schema({
    longitude: {
        type: Number,
        required: true,
    },
    latitude: {
        type: Number,
        required: true,
    },
});

const mapNodeSchema = new schema({
    location: {
        type: locationSchema,
        required: true,
    },
    latitude: {
        type: String,
        required: true,
        default: "",
    },
});

const pathSchema = new schema({
    start: {
        type: mapNodeSchema,
        required: true,
    },
    end: {
        type: mapNodeSchema,
        required: true,
    },
    points: {
        type: [locationSchema],
        required: true,
    },
    currentPointIndex: {
        type: Number,
        required: true,
        default: 0,
    },
});

const Location = mongoose.model("Location", locationSchema);
const MapNode = mongoose.model("MapNode", mapNodeSchema);
const Path = mongoose.model("Path", pathSchema);

module.exports = { Location, MapNode, Path };
