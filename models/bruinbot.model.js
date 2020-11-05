const mongoose = require("mongoose");
const map = require("./map.model.js");

const schema = mongoose.Schema;

const bruinBotSchema = new schema({
    location: {
        type: map.Location.schema,
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ["Idle", "InTransit"],
        default: "Idle",
    },
    path: {
        type: map.Path.schema,
        required: false,
    },
    nickname: {
        type: String,
        required: false,
        trim: true,
    },
});

const BruinBot = mongoose.model("BruinBot", bruinBotSchema);

module.exports = BruinBot;