const { coordDistanceM } = require('./utils');
const { Location, MapNode, Path } = require('../models/map.model');

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

	return closestNode;
}

/**
 * @param {MapNode} node The id of the MapNode from which to get all neighbors
 *
 * @returns {Array<MapNode>} An array of neighboring MapNodes
 */
async function getNeighbors(node) {
	let nodes = [];
	const pathsA = await Path.find({ nodeA: node }).populate('nodeB');

	for (let path of pathsA) {
		nodes.push(path.nodeB);
	}

	const pathsB = await Path.find({ nodeB: node }).populate('nodeA');
	for (let path of pathsB) {
		nodes.push(path.nodeA);
	}

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

	if (path === null) {
		path = await Path.findOne({
			nodeA: node2,
			nodeB: node1,
		});
		points = path.points.reverse();
	} else {
		points = path.points;
	}

	return points;
}

/**
 * @param {MapNode} node MapNode to check if its in a map
 * @param {Map<MapNode, any>} map Map to check if MapNode is a key
 *
 * @returns {boolean} If map contains node as a key
 */
function alreadyHas(node, map) {
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
			if (fScore.get(node) < smallestF) {
				curNode = node;
				smallestF = fScore.get(node);
			}
		}
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

	return [];
}

module.exports = {
	heuristic,
	getClosestMapNode,
	getNeighbors,
	reconstructPath,
	getPoints,
	alreadyHas,
	getPathBetween,
};
