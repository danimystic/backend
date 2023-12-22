const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    try{
        if(req.session.username){
            res.status(200).send({userId: req.session.userId, username: req.session.username, role: req.session.role});
        }
        else{
            res.status(404).send({message: "belum login"});
        }
    } 
    catch(err){
        console.error("Error: " + err);
        res.status(500);
    }
    
});

module.exports = router;