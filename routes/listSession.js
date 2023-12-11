const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    try{
        if(req.session.username){
            res.status(200).send(req.session);
        }
        else{
            res.status(404).json({message: "belum login"});
        }
    } 
    catch(err){
        console.error("Error: " + err);
        res.status(500);
    }
    
});

module.exports = router;