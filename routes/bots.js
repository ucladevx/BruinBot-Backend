const express = require("express");

const botsRouter = express.Router();

let FleetManager = require("../models/fleetmanager.model");
let BruinBot = require("../models/bruinbot.model");
let Map = require("../models/map.model");
let util = require("./utils")

// If a FleetManger document exists, update that one. If it doesn't,
// make a new one.
let Fleet = undefined;
FleetManager.findOne({}, (err, fleet) => {
    if (err) {
        res.status(400).json("Error: " + err);
    }
    if (fleet) {
        Fleet = fleet;
    } else {
        Fleet = new FleetManager();
        Fleet.save();
    }
});

/**
 * Return all BruinBot objects.
 */
botsRouter.route("/").get((req, res) => {
    FleetManager.find()
        .then((bots) => res.json(bots))
        .catch((err) => res.status(400).json("Error: " + err));
});

/**
 * Search through all BruinBot objects and return the closest BruinBot object
 * to the coordinates in the request's body.
 */
botsRouter.route("/closest").get((req, res) => {
    res.json(findBotCoords(req.body.latitude, req.body.longitude));
});

/**
 * Returns Location of the BruinBot with the provided id.
 */
botsRouter.route("/location").get((req, res) => {
    const id = req.body.id;
    
    for (var bot of Fleet.bots) {
        if (bot._id == id) {
            res.json(bot.location);
            return;
        }
    }
    res.json(null);
});

/**
 * Adds a new BruinBot object to the FleetManager's bot array with a Location
 * and name as provided in the request's body.
 */
botsRouter.route("/add").post((req, res) => {
    const lat = req.body.latitude;
    const lon = req.body.longitude;
    const name = req.body.name;

    const newLocation = new Map.Location({
        latitude: lat,
        longitude: lon,
    });

    const newBot = new BruinBot({
        location: newLocation,
        status: "Idle",
        name: name,
    });

    Fleet.bots.push(newBot);
    res.json("New bot " + name + " (" + newBot._id + ") was added!");
    Fleet.save();
});

/**
 * Deletes BruinBot in the FleetManager with the id provided in the
 * request's body.
 */
botsRouter.route("/").delete((req, res) => {
    const id = req.body.id;

    oldLength = Fleet.bots.length;

    // Delete bot with a matching id to the one provided
    Fleet.bots = Fleet.bots.filter((bot) => bot._id != id);
    if (oldLength - Fleet.bots.length == 0) {
        res.json("No bot with the id " + id + " exists!");
    } else {
        Fleet.save();
        res.json("Bot with the id " + id + " deleted!");
    }
});

module.exports = botsRouter;

/**
 * ---------------------------- Helper functions ----------------------------
 */

/**
 * Returns the bot object that's closest to the provided coordinate. Returns
 * null if there are no bots in the fleet.
 *
 * @param {number} lat Latitude of the coordinate that we want to find the closest bot to
 * @param {number} lon Longitude of the coordinate that we want to find the closest bot to
 */
function findBotCoords(lat, lon) {
    if (Fleet.bots.length < 1) {
        return null;
    }

    closestBot = undefined;
    smallestDistance = Infinity;
    currentDistance = undefined;

    // For all bots, first find their distance from the provided coordinates
    for (var bot of Fleet.bots) {
        currentDistance = util.coordDistanceKM(
            lat,
            lon,
            bot.location.latitude,
            bot.location.longitude
        );
        // If this distance is the smallest yet found, save this distance and
        // the bot it's associated with
        if (currentDistance < smallestDistance) {
            closestBot = bot;
            smallestDistance = currentDistance;
        }
    }

    return closestBot;
}
