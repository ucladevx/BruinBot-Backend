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
		firebaseId: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		eventId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Event',
			trim: true,
			default: null,
		},
	},
	{
		timestamps: true,
	}
);

const User = mongoose.model('User', userSchema);

module.exports.User = User;
