<<<<<<< HEAD
const mongoose = require("mongoose");
const map = require("./map.model.js");
=======
const mongoose = require('mongoose');
>>>>>>> origin/main

const schema = mongoose.Schema;

const userSchema = new schema(
<<<<<<< HEAD
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 5,
        },
        isOrganizer: {
            type: Boolean,
            required: true,
            default: false,
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
=======
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
>>>>>>> origin/main
);

const User = mongoose.model('User', userSchema);

module.exports = User;
