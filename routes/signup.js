const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');

router.post('/', async (req, res) => {
    try{
        const {username, email, password} = req.body;

        db.query(
            'SELECT username, email FROM users WHERE username = ? OR email = ?',
            [username, email],
            async (err, results) => {
                if(err){
                    console.error('Database error:', err);
                    res.status(500).json({ success: false, message: 'Internal Server Error' });
                } 
                else if(results.length > 0) {
                    res.status(400).json({ success: false, message: 'Username or email already exists' });
                } 
                else{
                    try{
                        const hashedPassword = await bcrypt.hash(password, 10);
                        db.query(
                            'INSERT INTO users (username, email, password, isAdmin) VALUES (?, ?, ?, ?)',
                            [username, email, hashedPassword, 0],
                            (err, results) => {
                                if(err){
                                    console.error('Database error:', err);
                                    res.status(500).json({ success: false, message: 'Internal Server Error' });
                                } 
                                else{
                                    const userId = results.insertId;
                                    req.session.userId = userId;
                                    req.session.username = username;
                                    req.session.role = 'client';
                                    res.status(201).json({ success: true, message: 'User registered successfully' });
                                }
                            }
                        );
                    }
                    catch(error){
                        console.error("Error: " + error);
                        res.status(500).json({ success: false, message: 'Internal Server Error' });
                    }
                }
            }
        );
    }
    catch(error){
        console.error("Error: " + error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }

});

module.exports = router;