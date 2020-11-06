/**
 * Converts degrees to radians.

 * @param {number} degrees Number of degrees to convert to radians
 */
function degToRad(degrees) {
    return (degrees * Math.PI) / 180;
}

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

exports.degToRad = degToRad;
exports.coordDistanceKM = coordDistanceKM;