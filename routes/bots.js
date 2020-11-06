const express = require("express");

const botsRouter = express.Router();

let FleetManager = require("../models/fleetmanager.model");
let BruinBot = require("../models/bruinbot.model");
let Map = require("../models/map.model");
let util = require("./utils");

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
 * ------------------------- POST (add new objects) -------------------------
 */

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
    res.json(newBot);
    Fleet.save();
});

/**
 * --------------------- PUT (update existing objects) ----------------------
 */

/**
 * Update BruinBot object with specified id to have new location.
 */
botsRouter.route("/updateLocation").put((req, res) => {
    const id = req.body.id;
    const lat = req.body.latitude;
    const lon = req.body.longitude;
    for (var bot of Fleet.bots) {
        if (bot._id == id) {
            bot.location.latitude = lat;
            bot.location.longitude = lon;
            res.json(
                "Bot with the id " +
                    id +
                    " updated with lat: " +
                    lat +
                    ", lon: " +
                    lon +
                    "!"
            );
            Fleet.save();
            return;
        }
    }
    res.json("No bot with the id " + id + " exists!");
});

/**
 * ----------------- GET (return information about objects) ----------------
 */

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
 * ------------------------- DELETE (remove objects) ------------------------
 */

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

// Exports module for use in server.js
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
