const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');
  
const REDIRECT_URL = (process.env.NODE_ENV === 'development') ? process.env.FRONTEND_URL_DEV : process.env.FRONTEND_URL_PROD;

router.post('/', async (req, res) => {
    
    const {email, password} = req.body;

    try{
        const checkUser = await db.query('SELECT userId, password, username, isAdmin FROM users WHERE email = ?', [email]);
        console.log(checkUser);
        if(checkUser[0].length > 0){
            const user = checkUser[0][0];
            const checkPassword = await bcrypt.compare(password, user.password);
            if(checkPassword){
                req.session.userId = user.userId;
                req.session.username = user.username;
                req.session.role = (user.isAdmin == 1) ? 'admin' : 'client';
                console.log(req.session);
                res.status(200).send({ success: true, message: 'Login successful', redirectTo: REDIRECT_URL });
            } 
            else {
                res.status(401).send({ success: false, message: 'Invalid username or password', failed: 1});
            }
        }
        else{
            return res.status(401).send({ success: false, message: 'Invalid username or password', failed: 2});
        }
    }
    catch(err){
        console.error("Error: " + err);
        res.status(500).send({message: "Internal Error"});
    }
});

module.exports = router;