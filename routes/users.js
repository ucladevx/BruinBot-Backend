const express = require("express");

const router = express.Router();
let User = require("../models/user.model");

router.route("/").get((req, res) => {
    User.find()
        .then((users) => res.json(users))
        .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/add").post((req, res) => {
    const username = req.body.username;
    const firebase_id = req.body.firebase_id;


    const newUser = new User({
        firebase_id: firebase_id,
        username: username,
    });

    newUser
        .save()
        .then(() => res.json("User " + username + " was added!"))
        .catch((err) => res.status(400).json("Error: " + err));
});

router.route('/').delete((req, res) => {
    //deletes by id
    User.findOne({firebase_id: req.body.firebase_id})
        .then(user => user.remove())
        .then(() => res.json("User " + req.body.firebase_id + " was deleted!"))
        .catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router;
