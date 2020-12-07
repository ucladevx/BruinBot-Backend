const AWS = require('aws-sdk');

const s3 = new AWS.S3({
	accessKeyId: process.env.S3_ACCESS_KEY_ID,
	secretAccessKey: process.env.S3_ACCESS_KEY_SECRET,
});

const Bucket = 'bruinbot-item-images';

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
 * Returns the distance between two coordinates in kilometers.
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

/**
 * Uploads a image to S3 and returns the response data
 *
 * @param {file} file Image file to be uploaded
 *
 * @returns {object} S3 response data
 */
function uploadImageToS3(file) {
	const { buffer, originalname, mimetype } = file;

	const params = {
		Bucket,
		Key: originalname,
		Body: buffer,
		ContentType: mimetype,
		ACL: 'public-read',
	};

	return s3.upload(params).promise();
}

/**
 * Deletes an image from S3 and returns the response data
 *
 * @param {string} imgKey S3 image URL of image to be deleted
 *
 * @returns {object} S3 response data
 */
function deleteImageFromS3(imgKey) {
	const params = {
		Bucket,
		Key: imgKey,
	};

	return s3.deleteObject(params).promise();
}

module.exports.degToRad = degToRad;
module.exports.coordDistanceM = coordDistanceM;
module.exports.uploadImageToS3 = uploadImageToS3;
module.exports.deleteImageFromS3 = deleteImageFromS3;
