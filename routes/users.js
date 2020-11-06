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
    const id = req.body.id;


    const newUser = new User({
        id: id,
        username: username,
    });

    newUser
        .save()
        .then(() => res.json("User " + username + " was added!"))
        .catch((err) => res.status(400).json("Error: " + err));
});

router.route('/delete').post((req, res) => {
    //deletes by id
    User.findOne({id: req.body.id})
        .then(user => user.remove())
        .then(() => res.json("User " + req.body.id + " was deleted!"))
        .catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router;
