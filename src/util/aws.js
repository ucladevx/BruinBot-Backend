const AWS = require('aws-sdk');
const os = require('os');

const s3 = new AWS.S3({
	accessKeyId: process.env.S3_ACCESS_KEY_ID,
	secretAccessKey: process.env.S3_ACCESS_KEY_SECRET,
});

let Bucket = '';
switch (process.env.NODE_ENV) {
	case 'test':
		Bucket = 'bruinbot-test/item-images';
		break;
	case 'staging':
		Bucket = 'bruinbot-stage/item-images';
		break;
	case 'production':
		Bucket = 'bruinbot-prod/item-images';
		break;
	case 'development':
	default:
		Bucket = `bruinbot-dev/${os.userInfo().username}/item-images`;
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

module.exports.uploadImageToS3 = uploadImageToS3;
module.exports.deleteImageFromS3 = deleteImageFromS3;
