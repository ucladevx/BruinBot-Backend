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
<<<<<<< HEAD
    const id = req.body.id;

=======
    const firebase_id = req.body.firebase_id;
>>>>>>> 96041c76982e4488b2633a4d298a70ef9972c5b6

    const newUser = new User({
        firebase_id: firebase_id,
        username: username,
    });

    newUser
        .save()
        .then(() => res.json(newUser))
        .catch((err) => res.status(400).json("Error: " + err));
});

router.route('/').delete((req, res) => {
    //deletes by id
    User.findOne({firebase_id: req.body.firebase_id})
        .then(user => user.remove())
        .then(() => res.json("User " + req.body.firebase_id + " was deleted!"))
        .catch(err => res.status(400).json('Error: ' + err));
});

<<<<<<< HEAD
router.route('/delete').post((req, res) => {
    //deletes by id
    User.findOne({id: req.body.id})
        .then(user => user.remove())
        .then(() => res.json("User " + req.body.id + " was deleted!"))
        .catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router;
=======
module.exports = router;
>>>>>>> 96041c76982e4488b2633a4d298a70ef9972c5b6
