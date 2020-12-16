const express = require('express');

const mapRouter = express.Router();

const { Location, MapNode, Path } = require('../models/map.model');
const { botSpeed } = require('../constants');
const { coordDistanceM } = require('./utils');

/**
 * @param {MapNode} node The node from which to calculate the heuristic
 * @param {MapNode} endpoint The endpoint of the requested path
 *
 * @returns {number} The heuristic (currently the distance between the coords)
 */
function heuristic(node, endpoint) {
	return coordDistanceM(
		node.location.latitude,
		node.location.longitude,
		endpoint.location.longitude,
		endpoint.location.latitude
	);
}

/**
 * @param {number} latitude Latitude of cooordinate to get closest MapNode from
 * @param {number} longitude Longiture of coordinate to get closest MapNode from
 *
 * @returns {MapNode} The closest MapNode to the coordinate
 */
async function getClosestMapNode(latitude, longitude) {
	//Might be slow
	const curLocation = new MapNode({
		location: {
			latitude: latitude,
			longitude: longitude,
		},
	});
	const mapNodes = await MapNode.find();
	let closestNode = mapNodes[0];
	let closestDist = coordDistanceM(
		mapNodes[0].location.latitude,
		mapNodes[0].location.longitude,
		curLocation.location.latitude,
		curLocation.location.longitude
	);
	for (let node of mapNodes) {
		const coordDist = coordDistanceM(
			node.location.latitude,
			node.location.longitude,
			curLocation.location.latitude,
			curLocation.location.longitude
		);
		if (coordDist < closestDist) {
			closestDist = coordDist;
			closestNode = node;
		}
	}
	//console.log(closestNode);
	return closestNode;
}

/**
 * @param {MapNode} node The MapNode from which to get all its neighbors
 *
 * @returns {Array<MapNode>} An array of neighboring MapNodes
 */
async function getNeighbors(node) {
	let nodes = [];
	const pathsA = await Path.find({ nodeA: node });
	for (let path of pathsA) {
		const nodeB = await MapNode.findById(path.nodeB);
		nodes.push(nodeB);
	}
	const pathsB = await Path.find({ nodeB: node });
	for (let path of pathsB) {
		const nodeA = await MapNode.findById(path.nodeA);
		nodes.push(nodeA);
	}
	//console.log(nodes);
	return nodes;
}

/**
 * @param {Map<MapNode, MapNode>} cameFrom A map that maps a MapNode to the MapNode that comes before it
 * @param {MapNode} curNode The node to reconstruct the path from (normally the ending MapNode)
 *
 * @returns {Array<Location>} A list of locations from the starting MapNode to curNode
 */
async function reconstructPath(cameFrom, curNode) {
	let locations = [curNode.location];
	while (cameFrom.has(curNode)) {
		let nextNode = cameFrom.get(curNode);
		let points = await getPoints(curNode, nextNode);
		for (let p of points) {
			locations.unshift(p);
		}
		locations.unshift(nextNode.location);
		curNode = nextNode;
	}
	return locations;
}

/**
 * @param {MapNode} node1 The first MapNode
 * @param {MapNode} node2 The second MapNode
 *
 * @returns {Array<Location>} A list of Locations from node1 to node2
 */
async function getPoints(node1, node2) {
	let path = await Path.findOne({
		nodeA: node1,
		nodeB: node2,
	});
	let points = [];
	//console.log(path);
	if (path === null) {
		path = await Path.findOne({
			nodeA: node2,
			nodeB: node1,
		});
		points = path.points.reverse();
	} else {
		points = path.points;
	}
	//console.log(path);
	return points;
}

/**
 * @param {MapNode} node MapNode to check if its in a map
 * @param {Map<MapNode, any>} map Map to check if MapNode is a key
 *
 * @returns {boolean} If map contains node as a key
 */
function alreadyHas(node, map) {
	//console.log(node)
	//console.log(set);
	for (let n of map.keys()) {
		if (
			node.location.latitude === n.location.latitude &&
			node.location.longitude === n.location.longitude
		) {
			return true;
		}
	}
	return false;
}

/**
 * @param {MapNode} start MapNode that path should start at
 * @param {MapNode} end Map Node that the path should end at
 *
 * @returns {Array<Location>} Array of locations leading from start to end (including start and end)
 */
async function getPathBetween(start, end) {
	let gScore = new Map();
	let fScore = new Map();
	let cameFrom = new Map();
	let queue = new Set();

	gScore.set(start, 0);
	fScore.set(start, heuristic(start, end));
	queue.add(start);

	while (queue.size !== 0) {
		let curNode;
		let smallestF = Number.MAX_SAFE_INTEGER;

		for (let node of queue) {
			//console.log(fScore.get(node));
			if (fScore.get(node) < smallestF) {
				curNode = node;
				smallestF = fScore.get(node);
			}
		}
		//console.log(curNode);
		queue.delete(curNode);
		if (
			curNode.location.latitude === end.location.latitude &&
			curNode.location.longitude === end.location.longitude
		) {
			return await reconstructPath(cameFrom, curNode);
		}
		let neighbors = await getNeighbors(curNode);
		for (let neighbor of neighbors) {
			const points = await getPoints(curNode, neighbor);
			let dist = points.length + 1;
			//console.log(dist)
			const tempG = dist + gScore.get(curNode);
			const beenVisited = alreadyHas(neighbor, gScore);
			if (!beenVisited || tempG < gScore.get(neighbor)) {
				if (!beenVisited) {
					queue.add(neighbor);
				}
				gScore.set(neighbor, tempG);
				fScore.set(neighbor, tempG + heuristic(neighbor, end));
				cameFrom.set(neighbor, curNode);
			}
		}
	}
	return 'No Path Found';
}

/**
 * ----------------- GET (return information about objects) ----------------
 */

/**
 * Get list of locations betweeen two specified coordinates
 */
mapRouter.route('/pathBetween').get(async (req, res) => {
	let startNode = await MapNode.findOne({
		'location.latitude': req.body.startLat,
		'location.longitude': req.body.startLon,
	});
	if (startNode === null) {
		startNode = await getClosestMapNode(req.body.startLat, req.body.startLon);
	}
	let endNode = await MapNode.findOne({
		'location.latitude': req.body.endLat,
		'location.longitude': req.body.endLon,
	});
	if (endNode === null) {
		endNode = await getClosestMapNode(req.body.endLat, req.body.endLon);
	}
	const nodes = await getPathBetween(startNode, endNode);
	//console.log(nodes);
	res.json(nodes);
});

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

			let eta = distance / botSpeed / 60;
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

		if (i === 0 || i === path.length - 1) {
			// If a map node already exists for a location,
			// use it instead of creating a new one.
			const existingNode = await MapNode.findOne({
				'location.latitude': lat,
				'location.longitude': lon,
			});
			endPoints.push(
				existingNode ||
					new MapNode({ location: { latitude: lat, longitude: lon } })
			);
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
