const express = require('express');

const mapRouter = express.Router();

const { MapNode, Path } = require('../models/map.model');
const { BOT_SPEED } = require('../constants');
const { coordDistanceM } = require('../util/utils');

/**
 * ----------------- GET (return information about objects) ----------------
 */

/**
 * Get all map nodes
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
 * Get all map nodes along with distance (m) and eta (minutes) to specified location
 *
 * @param {number} Latitude of specified location
 * @param {number} Longitude of specified location
 */
mapRouter.route('/nodes/location').get(async (req, res) => {
	const { latitude, longitude } = req.query;

	if (!latitude || !longitude)
		res.status(400).json('Latitude and/or longitude not provided.');

	try {
		let nodes = await MapNode.find();
		nodes = JSON.parse(JSON.stringify(nodes));

		for (let i = 0; i < nodes.length; i++) {
			let distance = coordDistanceM(
				nodes[i].location.latitude,
				nodes[i].location.longitude,
				latitude,
				longitude
			);

			let eta = distance / BOT_SPEED / 60;
			nodes[i].distance = distance;
			nodes[i].eta = eta;
		}
		res.json(nodes);
	} catch (err) {
		console.log('Error: ' + err);
		res.status(400).json(err);
	}
});

/**
 * ------------------------- POST (add new objects) -------------------------
 */

/**
 * Create path from array of coords. The first and last coordinates in the array
 * are terminal nodes. If either terminal node does not already exist (have the
 * exact same coordinates), then that node is created and persisted, along with
 * the name of the node, if given. Note that this path is meant to be
 * bi-directional - do not get confused by the naming of start and end.
 *
 * @param {Array<Array<number>>} path List of coordinates in path
 * @param {string=} start Name of first node (optional)
 * @param {string=} end Name of end node (optional)
 */
mapRouter.route('/').post(async (req, res) => {
	const path = req.body.path;
	const start = req.body.start;
	const end = req.body.end;

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

		if (i === 0 || i === path.length - 1) {
			/**
			 * If a map node already exists for a location, use it instead of
			 * creating a new one.
			 */
			const existingNode = await MapNode.findOne({
				'location.latitude': lat,
				'location.longitude': lon,
			});

			if (i == 0) {
				let newMapNode = start
					? new MapNode({
							name: start,
							location: { latitude: lat, longitude: lon },
					  })
					: new MapNode({
							location: { latitude: lat, longitude: lon },
					  });

				endPoints.push(existingNode || newMapNode);
			} else {
				let newMapNode = end
					? new MapNode({
							name: end,
							location: { latitude: lat, longitude: lon },
					  })
					: new MapNode({
							location: { latitude: lat, longitude: lon },
					  });

				endPoints.push(existingNode || newMapNode);
			}
		} else {
			points.push({ latitude: lat, longitude: lon });
		}
	}

	const newPath = new Path({
		points,
		nodeA: endPoints[0],
		nodeB: endPoints[1],
	});

	try {
		// Save new map nodes and path
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
 * ------------------------- DELETE (remove objects) ------------------------
 */

/**
 * Delete path by id, while keeping terminal map nodes.
 */
mapRouter.route('/').delete(async (req, res) => {
	const pathId = req.body.pathId;

	if (!pathId) {
		return res.status(400).json({
			error: 'Required pathId data not in request body.',
		});
	}

	try {
		let path = await Path.findById(pathId);

		if (!path)
			return res.status(404).json('Could not find path specified by pathId.');

		await path.deleteOne();
		res.json(`Successfully deleted path ${pathId}`);
	} catch (err) {
		console.log('Error: ' + err);
		res.status(400).json(err);
	}
});

/**
 * Delete map node and all of its paths by id.
 */
mapRouter.route('/nodes').delete(async (req, res) => {
	const pathId = req.body.pathId;

	if (!pathId) {
		return res.status(400).json({
			error: 'Required pathId data not in request body.',
		});
	}

	try {
		// delete node and any of its paths
		let node = await MapNode.findById(pathId);

		if (!node)
			return res
				.status(404)
				.json('Could not find map node specified by pathId.');

		await node.deleteOne();
		const pathsStarting = await Path.deleteMany({ nodeA: node });
		const pathsEnding = await Path.deleteMany({ nodeB: node });

		res.json({ node: node, numPaths: pathsStarting.n + pathsEnding.n });
	} catch (err) {
		console.log('Error: ' + err);
		res.status(400).json(err);
	}
});

module.exports = mapRouter;
