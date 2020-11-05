const express = require("express");

const botsRouter = express.Router();
let FleetManager = require("../models/fleetmanager.model");
let BruinBot = require("../models/bruinbot.model");
let Map = require("../models/map.model");

// If a FleetManger document exists, update that one. If it doesn't,
// make a new one.
let Fleet = null;
FleetManager.findOne({}, (err, fleet) => {
    if (err) {
        res.status(400).json("Error: " + err);
    }
    if (!fleet) {
        Fleet = new FleetManager();
        Fleet.save();
    }
}).then((f) => {
    Fleet = f;
});

botsRouter.route("/").get((req, res) => {
    FleetManager.find()
        .then((bots) => res.json(bots))
        .catch((err) => res.status(400).json("Error: " + err));
});

// Creates a location with the provided coordinates and add it to a new
// bot object. Adds this bot object to the FleetManager's bot array.
botsRouter.route("/add").post((req, res) => {
    const id = req.body.id;
    const lat = req.body.lat;
    const lon = req.body.lon;

    const newLocation = new Map.Location({
        latitude: lat,
        longitude: lon,
    });

    const newBot = new BruinBot({
        id: id,
        location: newLocation,
        status: "Idle",
    });

    Fleet.bots.push(newBot);
    res.json("New bot " + id + " was added!");
    Fleet.save();
});

module.exports = botsRouter;
