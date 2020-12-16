const express = require('express');

const mapRouter = express.Router();

const { Location, MapNode, Path } = require('../models/map.model');
const { coordDistanceM } = require('./utils');

const heuristic = (node, endpoint) => {
	return coordDistanceM(
		node.location.latitude,
		node.location.longitude,
		endpoint.location.longitude,
		endpoint.location.latitude
	);
};

const getClosestMapNode = async (latitude, longitude) => {
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
};

const getNeighbors = async (node) => {
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
};

const reconstructPath = async (cameFrom, curNode) => {
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
};

const getPoints = async (node1, node2) => {
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
};

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

const alreadyHas = (node, map) => {
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
};

const getPathBetween = async (start, end) => {
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
};

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
