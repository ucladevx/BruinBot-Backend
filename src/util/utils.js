/**
 * Converts degrees to radians.
 *
 * @param {number} degrees Number of degrees to convert to radians
 *
 * @returns {number} Degree in radians
 */
function degToRad(degrees) {
	return (degrees * Math.PI) / 180;
}

/**
 * Returns the distance between two coordinates in meters.
 * Uses the haversine formula.
 *
 * @param {number} lat1 Latitude of the first coordinate
 * @param {number} lon1 Longitude of the first coordinate
 * @param {number} lat2 Latitude of the second coordinate
 * @param {number} lon2 Longitude of the second coordinate
 *
 * @returns {number} Distance between two points on a globe
 */
function coordDistanceM(lat1, lon1, lat2, lon2) {
	let radiusM = 6371e3;
	let lat1rad = degToRad(lat1);
	let lon1rad = degToRad(lon1);
	let lat2rad = degToRad(lat2);
	let lon2rad = degToRad(lon2);
	let u = Math.sin((lat2rad - lat1rad) / 2);
	let v = Math.sin((lon2rad - lon1rad) / 2);
	let x = Math.sqrt(u * u + Math.cos(lat1rad) * Math.cos(lat2rad) * v * v);
	return 2.0 * radiusM * Math.asin(x);
}

module.exports.degToRad = degToRad;
module.exports.coordDistanceM = coordDistanceM;
