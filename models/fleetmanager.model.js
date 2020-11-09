const mongoose = require("mongoose");
const bruinbot = require("./bruinbot.model.js");

const schema = mongoose.Schema;
const ObjectId = schema.ObjectId;

const fleetManagerSchema = new schema({
    bots: {
        type: [ObjectId],
    },
});

const FleetManager = mongoose.model("FleetManager", fleetManagerSchema);

module.exports = FleetManager;
