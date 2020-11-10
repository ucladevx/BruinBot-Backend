const mongoose = require('mongoose');

const schema = mongoose.Schema;

const userSchema = new schema(
	{
		username: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			minlength: 5,
		},
		firebase_id: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
	},
	{
		timestamps: true,
	}
);

const User = mongoose.model('User', userSchema);

module.exports = User;
