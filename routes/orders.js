const express = require('express');
const router = express.Router();
const db = require('../config/db');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const storage = multer.memoryStorage();
const parser = multer({ storage: storage });

router.get('/all', async (req, res) => {
    if(req.session.role == "client"){
        try {
            const response = await db.query(
                'SELECT * FROM orders WHERE userId = ? AND orderStatus <> ?',
                [req.session.userId, 0]
            );
            const data = response[0];
            res.status(200).send(data);
        } 
        catch(error){
            console.error(error);
            res.status(500).send({message: "Internal Error"});
        }
    }
});

router.get('/', async (req, res) => {
    if(req.session.role === "client"){
        try {
            const response = await db.query(
                'SELECT * FROM orders WHERE userId = ? AND orderStatus = ?',
                [req.session.userId, 0]
            );
            const data = response[0];
            res.status(200).send(data);
        } 
        catch(error){
            console.error(error);
            res.status(500).send({message: "Internal Error"});
        }
    }
});

router.get('/:orderId', async (req, res) => {
    const orderId = req.params.orderId;

    if(req.session.role === "admin"){
        try {
            const response = await db.query(
                'SELECT * FROM orders WHERE orderId = ?',
                [orderId]
            );
            const data = response[0];
            res.status(200).send(data);
        } 
        catch(error){
            console.error(error);
            res.status(500).send({message: "Internal Error"});
        }
    }
    else if(req.session.role === "client"){
        try {
            const getCheckUser = await db.query(
                'SELECT orderId FROM orders WHERE orderId = ? AND userId = ?',
                [orderId, req.session.userId]
            );
            const checkUser = getCheckUser[0].orderId;

            if(!checkUser || checkUser.length <= 0 || checkUser === ""){
                res.status(401).send({message: "Unauthorized Access"});
                return;
            }

            const response = await db.query(
                'SELECT * FROM orders WHERE orderId = ?',
                [orderId]
            );
            const data = response[0];
            res.status(200).send(data);
        }
        catch(error){
            console.error(error);
            res.status(500).send({message: "Internal Error"});
        }
    }
});

router.put('/', async (req, res) => {
    const {recipientName, address} = req.body;

    if(req.session.role === "client"){
        try {
            db.query(
                'UPDATE orders set recipientName = ?, address = ?, orderStatus = ?, orderDate = NOW() WHERE orderStatus = ? AND userId = ?',
                [recipientName, address, 1, 0, req.session.userId],
                async(err, results) => {
                    if(err){
                        console.error(err);
                        res.status(500);
                    }
                    else{
                        db.query(
                            'SELECT orderId FROM orders WHERE userId = ? AND orderStatus = ? ORDER BY orderId DESC LIMIT 1',
                            [req.session.userId, 1],
                            (selectErr, selectResults) => {
                                if (selectErr) {
                                    console.error(selectErr);
                                    res.status(500).send({ message: "Internal Server Error" });
                                } else {
                                    const orderId = selectResults[0].orderId;
                                    res.status(200).send({message: "Success Create Order", redirecTo: `http://localhost:3000/orders/${orderId}`});
                                }
                            }
                        );
                    }
                }
            );
        } 
        catch(error){
            console.error(error);
            res.status(500);
        }
    }
});

router.post('/:orderId', parser.single('image'), async (req, res) => {
    if(req.session.role === "client"){
        const imageBuffer = req.file.buffer;
        const orderId = req.params.orderId;

        const uploadToCloudinary = (imageBuffer) => {
            return new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    { resource_type: 'image' },
                    (error, result) => {
                        if (error) {
                            console.error(error);
                            reject('Failed to upload image to Cloudinary');
                        } 
                        else {
                            console.log(result.secure_url);
                            resolve(result.secure_url);
                        }
                    }
                ).end(imageBuffer);
            });
        };

        try{
            const imageUrl = await uploadToCloudinary(imageBuffer);

            db.query(
                'UPDATE orders SET proofPayment = ? WHERE orderId = ?',
                [imageUrl, orderId],
                async (err, results) => {
                    if(err){
                        console.error(err);
                        res.status(500).send({message: "Error"});
                    }
                    else{
                        res.status(200).send({ message: 'Proof Payment Upload Success', proofPayment: imageUrl });
                    }
                }
            );
        }
        catch(error){
            console.error(error);
            res.status(500).send({message: "Error"});
        }
    }
});

router.put('/:orderId', async (req, res) => {
    const orderId = req.params.orderId;
    const {userId} = req.body;
    
    if(req.session.role === "admin"){ 
        try {
            db.query(
                'UPDATE orders SET orderStatus = ? WHERE orderId = ?',
                [2, orderId],
                async(err, results) => {
                    if(err){
                        console.error(err);
                        res.status(500).send({message: "Error"});
                    }
                    else{
                        db.query(
                            'INSERT INTO orders (userId, total, orderStatus) VALUES (?, ?, ?)',
                            [userId, 0, 0],
                            async(error, results) => {
                                if(error){
                                    console.error(error);
                                    res.status(500).send({message: "Error"});
                                }
                                else{
                                    res.status(200).send({message: "Success Accepting Payment"});
                                }
                            }
                        );
                    }
                }
            );
        } 
        catch(error){
            console.error(error);
            res.status(500).send({message: "Error"});
        }
    }
});

module.exports = router;