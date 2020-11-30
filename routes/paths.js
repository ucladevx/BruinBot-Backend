const express = require('express');

const mapRouter = express.Router();

const { Location, MapNode, Path } = require('../models/map.model');

/**
 * Get all map nodes.
 */
mapRouter.route('/nodes').get(async (req, res) => {
	try {
		const nodes = await MapNode.find();
		res.json(nodes);
	} catch (err) {
		console.log('Error: ' + err);
		res.status(400).json(err);
	}
});

/**
 * Create path from array of coords.
 */
mapRouter.route('/').post(async (req, res) => {
	const path = req.body.path;

	if (!path || !Array.isArray(path) || path.length < 2) {
		return res.status(400).json({
			error: 'Required number of path coordinates not in request body.',
		});
	}

	const points = [];
	const endPoints = [];
	for (let i = 0; i < path.length; i++) {
		const [lat, lon] = path[i];
		if (
			path[i].length !== 2 ||
			typeof lat !== 'number' ||
			typeof lon !== 'number'
		) {
			return res.status(400).json({ error: 'Malformatted path coordinates.' });
		}

		const location = new Location({ latitude: lat, longitude: lon });
		if (i === 0 || i === path.length - 1) {
			// If a map node already exists for a location,
			// use it instead of creating a new one.
			const existingNode = await MapNode.findOne({
				'location.latitude': lat,
				'location.longitude': lon,
			});
			endPoints.push(existingNode || new MapNode({ location }));
		} else {
			points.push(location);
		}
	}

	const newPath = new Path({
		points,
		nodeA: endPoints[0],
		nodeB: endPoints[1],
	});

	try {
		// save new map nodes and path
		await endPoints[0].save();
		await endPoints[1].save();
		const savedPath = await newPath.save();
		res.json(savedPath);
	} catch (err) {
		console.log('Error: ' + err);
		res.status(400).json(err);
	}
});

/**
 * Delete path by id, while keeping terminal map nodes.
 */
mapRouter.route('/').delete(async (req, res) => {
	const id = req.body.id;

	if (!id) {
		return res.status(400).json({
			error: 'Required id data not in request body.',
		});
	}

	try {
		const deletedPath = await Path.findByIdAndDelete(id);
		res.json(deletedPath);
	} catch (err) {
		console.log('Error: ' + err);
		res.status(400).json(err);
	}
});

/**
 * Delete map node and all of its paths by id.
 */
mapRouter.route('/nodes').delete(async (req, res) => {
	const id = req.body.id;

	if (!id) {
		return res.status(400).json({
			error: 'Required id data not in request body.',
		});
	}

	try {
		// delete node and any of its paths
		const deletedNode = await MapNode.findByIdAndDelete(id);
		const pathsStarting = await Path.deleteMany({ nodeA: deletedNode });
		const pathsEnding = await Path.deleteMany({ nodeB: deletedNode });

		res.json({ node: deletedNode, numPaths: pathsStarting.n + pathsEnding.n });
	} catch (err) {
		console.log('Error: ' + err);
		res.status(400).json(err);
	}
});

module.exports = mapRouter;