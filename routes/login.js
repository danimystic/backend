const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');

router.options('/login', (req, res) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:9000');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(204).next();
  });
  
router.post('/', async (req, res) => {
    
    const {email, password} = req.body;

    try{
        db.query(
            'SELECT * FROM users WHERE email = ?', 
            [email],
            async (err, rows, fields) => {
                if(err){
                    console.error('Error:', err);
                    return res.status(500).json({ success: false, message: 'Internal Server Error' });
                }
                if(rows.length > 0){
                    const user = rows[0];
                    const checkPassword = await bcrypt.compare(password, user.password);
                    if(checkPassword){
                        req.session.userId = user.userId;
                        req.session.username = user.username;
                        req.session.role = (user.isAdmin == 1) ? 'admin' : 'client';
                        console.log(req.session);
                        res.status(200).json({ success: true, message: 'Login successful', redirectTo: 'http://localhost:3000/home' });
                    } 
                    else {
                        res.status(401).json({ success: false, message: 'Invalid username or password', failed: 1});
                    }
                } 
                else{
                    return res.status(401).json({ success: false, message: 'Invalid username or password', failed: 2});
                }
            }
        );
    }
    catch(err){
        console.error("Error: " + err);
        res.status(500);
    }
});

module.exports = router;