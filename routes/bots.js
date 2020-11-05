const express = require("express");

const botsRouter = express.Router();
let FleetManager = require("../models/fleetmanager.model");
let BruinBot = require("../models/bruinbot.model");
let Map = require("../models/map.model");

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
 * Creates a location with the provided coordinates and adds it to a new
 * bot object. Adds this bot object to the FleetManager's bot array.
 */
botsRouter.route("/add").post((req, res) => {
    const lat = req.body.latitude;
    const lon = req.body.longitude;

    const newLocation = new Map.Location({
        latitude: lat,
        longitude: lon,
    });

    const newBot = new BruinBot({
        location: newLocation,
        status: "Idle",
    });

    Fleet.bots.push(newBot);
    Fleet.numOfBots++;
    res.json("New bot " + newBot._id + " was added!");
    Fleet.save();
});

/**
 * Deletes BruinBot in the FleetManager with the id provided in the
 * request's body.
 */
botsRouter.route("/").delete((req, res) => {
    id = req.body.id;
    oldLength = Fleet.bots.length;

    // Delete bot with a matching id to the one provided
    Fleet.bots = Fleet.bots.filter((bot) => bot._id != id);
    if (oldLength - Fleet.bots.length == 0) {
        res.json("No bot with the id " + id + " exists!");
    } else {
        Fleet.numOfBots--;
        Fleet.save();
        res.json("Bot with the id " + id + " deleted!");
    }
});

module.exports = botsRouter;

// Helper functions

/**
 * Returns the distance between two coordinates in kilometers.
 * Uses the haversine formula.
 *
 * @param {number} lat1 Latitude of the first coordinate
 * @param {number} lon1 Longitude of the first coordinate
 * @param {number} lat2 Latitude of the second coordinate
 * @param {number} lon2 Longitude of the second coordinate
 */
function coordDistanceKM(lat1, lon1, lat2, lon2) {
    radiusKM = 6371;
    lat1rad = degToRad(lat1);
    lon1rad = degToRad(lon1);
    lat2rad = degToRad(lat2);
    lon2rad = degToRad(lon2);
    u = Math.sin((lat2rad - lat1rad) / 2);
    v = Math.sin((lon2rad - lon1rad) / 2);
    x = Math.sqrt(u * u + Math.cos(lat1rad) * Math.cos(lat2rad) * v * v);
    return 2.0 * radiusKM * Math.asin(x);
}

/**
 * Converts degrees to radians.
 * @param {number} degrees Number of degrees to convert to radians
 */
function degToRad(degrees) {
    return (degrees * Math.PI) / 180;
}

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
        currentDistance = coordDistanceKM(
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
