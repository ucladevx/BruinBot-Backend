const chai = require('chai');
const chaiHttp = require('chai-http');
const suppressLogs = require('mocha-suppress-logs');
const { assert } = require('chai');
let { app } = require('../../app');

const { MapNode, Path } = require('../../models/map.model');
const pathFinding = require('../../util/pathfinding');
const testUtils = require('./utils');

const testPort = 8888;
chai.use(chaiHttp);

// Doesn't exist statement until server is set up
before((done) => {
	app.on('Mongoose ready', () => {
		app = app.listen(testPort, async () => {
			console.log(`This server is running on port ${testPort}!\n`);

			// Start from a fresh db collection
			await MapNode.deleteMany({});
			await Path.deleteMany({});
			done();
		});
	});
});

describe('Pathfinding', () => {
	suppressLogs();

	describe('getNeighbors', () => {
		it('Should return all neighbors of a map node', async () => {
			const topology = await testUtils.createTestPathTopology();
			const neighborsA = (await pathFinding.getNeighbors(topology.nodeA)).map(
				(neighbor) => {
					return JSON.stringify(neighbor);
				}
			);

			assert.strictEqual(neighborsA.length, 2);
			assert.include(neighborsA, JSON.stringify(topology.nodeB));
			assert.include(neighborsA, JSON.stringify(topology.nodeD));

			const neighborsB = (await pathFinding.getNeighbors(topology.nodeB)).map(
				(neighbor) => {
					return JSON.stringify(neighbor);
				}
			);

			assert.strictEqual(neighborsB.length, 2);
			assert.include(neighborsB, JSON.stringify(topology.nodeA));
			assert.include(neighborsB, JSON.stringify(topology.nodeC));

			const neighborsC = (await pathFinding.getNeighbors(topology.nodeC)).map(
				(neighbor) => {
					return JSON.stringify(neighbor);
				}
			);

			assert.strictEqual(neighborsC.length, 1);
			assert.include(neighborsC, JSON.stringify(topology.nodeB));

			const neighborsD = (await pathFinding.getNeighbors(topology.nodeD)).map(
				(neighbor) => {
					return JSON.stringify(neighbor);
				}
			);

			assert.strictEqual(neighborsD.length, 1);
			assert.include(neighborsD, JSON.stringify(topology.nodeA));
		});
	});

	describe('getPathBetween', () => {
		it('Should return the shortest path between two mapNodes', async () => {
			const topology = await testUtils.createTestPathTopology();
			const actualPath = (
				await pathFinding.getPathBetween(topology.nodeD, topology.nodeC)
			).map((loc) => {
				return JSON.stringify(loc);
			});

			const expectedPath = [
				topology.nodeD.location,
				...topology.pathAD.points.reverse(),
				topology.nodeA.location,
				...topology.pathAB.points,
				topology.nodeB.location,
				...topology.pathBC.points,
				topology.nodeC.location,
			].map((loc) => {
				return JSON.stringify(loc);
			});

			assert.deepEqual(actualPath, expectedPath);
		});
	});
});
