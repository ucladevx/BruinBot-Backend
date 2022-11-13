const { MapNode, Path } = require('../../models/map.model');

/**
 * Creates mapNode in memory and saves it to the test database
 *
 * @param {string} name Name of new mapNode
 * @param {object} loc Location of new mapNode
 *
 * @returns {object} Saved mapNode in database
 */
async function createAndSaveMapNode(name, loc) {
	let newMapNode = new MapNode({
		name: name,
		location: {
			latitude: loc.latitude,
			longitude: loc.longitude,
		},
	});

	return await newMapNode.save();
}

/**
 * Creates a mapNode in memory and saves it to the test database
 *
 * @param {string} idA Id of terminal mapNode
 * @param {string} idB Id of terminal mapNode
 *
 * @returns {object} Saved path in database
 */
async function createAndSavePath(idA, idB) {
	let newPath = new Path({
		nodeA: idA,
		nodeB: idB,
		points: [
			{
				latitude: 420,
				longitude: 420,
			},
		],
	});

	return await newPath.save();
}

/**
 * Creates a sample path network.
 *
 * A - D
 *  \
 *   B
 *    \
 *     C
 *
 * @returns {object} Object containg thenodes and paths in the sample topology
 */
async function createTestPathTopology() {
	const nodeA = await createAndSaveMapNode('Node A', {
		latitude: 100,
		longitude: 100,
	});
	const nodeB = await createAndSaveMapNode('Node B', {
		latitude: 200,
		longitude: 200,
	});
	const nodeC = await createAndSaveMapNode('Node C', {
		latitude: 300,
		longitude: 300,
	});
	const nodeD = await createAndSaveMapNode('Node D', {
		latitude: 100,
		longitude: 200,
	});

	const pathAB = await createAndSavePath(nodeA._id, nodeB._id);
	const pathBC = await createAndSavePath(nodeB._id, nodeC._id);
	const pathAD = await createAndSavePath(nodeA._id, nodeD._id);

	return {
		nodeA,
		nodeB,
		nodeC,
		nodeD,
		pathAB,
		pathBC,
		pathAD,
	};
}

module.exports = {
	createAndSaveMapNode,
	createAndSavePath,
	createTestPathTopology,
};
