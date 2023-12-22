const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');

const REDIRECT_URL = (process.env.NODE_ENV === 'development') ? process.env.FRONTEND_URL_DEV : process.env.FRONTEND_URL_PROD;

router.post('/', async (req, res) => {
    const {username, email, password} = req.body;
    try{
        const checkUser = await db.query('SELECT username FROM users WHERE username = ? OR email = ?', [username, email]);
        if(checkUser[0].length > 0){
            res.status(400).send({ success: false, message: 'Username or email already exists' });
        }
        else{
            const hashedPassword = await bcrypt.hash(password, 10);

            const response = await db.query('INSERT INTO users (username, email, password, isAdmin) VALUES (?, ?, ?, ?)', [username, email, hashedPassword, 0]);

            const data = response[0];
            const userId = data.insertId;

            req.session.userId = userId;
            req.session.username = username;
            req.session.role = 'client';
            console.log(req.session);

            await db.query('INSERT INTO orders (userId, total, orderStatus) VALUES (?, ?, ?)', [userId, 0, 0]);
            
            res.status(201).send({ success: true, message: 'User registered successfully', redirectTo: REDIRECT_URL });
        }
    }
    catch(error){
        console.error("Error: " + error);
        res.status(500).send({ success: false, message: 'Internal Server Error' });
    }
});

module.exports = router;