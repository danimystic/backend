const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    try{
        res.status(200).send({message: "halo bang"});
    }
    catch(err){
        console.error(err);
    }
});

module.exports = router;