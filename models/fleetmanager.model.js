const mongoose = require("mongoose");
const bruinbot = require("./bruinbot.model.js");

const schema = mongoose.Schema;

const fleetManagerSchema = new schema({
    bots: {
        type: [bruinbot.schema],
        required: true,
    },
});

const FleetManager = mongoose.model("FleetManager", fleetManagerSchema);

module.exports = FleetManager;
