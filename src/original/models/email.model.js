const mongoose = require('mongoose');

const schema = mongoose.Schema;

const emailSchema = new schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
	},
	{
		timestampes: true,
	}
);

const Email = mongoose.model('Email', emailSchema);

module.exports.Email = Email;
