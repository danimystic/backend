const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
    res.status(200).send({message: "Home"});
});

module.exports = router;