const express = require('express');
const router = express.Router();

const FRONTEND_URL = (process.env.NODE_ENV === 'development') ? process.env.FRONTEND_URL_DEV : process.env.FRONTEND_URL_PROD;

router.get('/', function(req, res){
    if(req.session.username){
        req.session.destroy();
        res.redirect(FRONTEND_URL);
    }
    else{
        res.redirect(FRONTEND_URL+'/login');
    }
});

module.exports = router;