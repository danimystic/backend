const express = require('express');
const router = express.Router();

router.get('/', function(req, res){
    if(req.session.username){
        req.session.destroy();
        res.redirect('http://localhost:3000');
    }
    else{
        res.redirect('http://localhost:3000/login');
    }
})

module.exports = router;