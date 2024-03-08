const express = require('express');
const router = express.Router();
const db = require('../config/db');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const storage = multer.memoryStorage();
const parser = multer({ storage: storage });

const FRONTEND_URL = process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL_PROD : process.env.FRONTEND_URL_DEV;

// Menampilkan semua order yang sedang terjadi atau sudah selesai
router.get('/all', async (req, res) => {
    if(req.session.role == "client"){
        try {
            const response = await db.query(
                'SELECT * FROM orders WHERE "userId" = $1 AND "orderStatus" <> $2',
                [req.session.userId, 0]
            );
            const data = response.rows;
            res.status(200).send(data);
        } 
        catch(error){
            console.error(error);
            res.status(500).send({message: "Internal Error"});
        }
    }
    else if(req.session.role === "admin"){
        try {
            const response = await db.query(
                'SELECT * FROM orders WHERE "orderStatus" <> $1',
                [req.session.userId, 0]
            );
            const data = response.rows;
            res.status(200).send(data);
        } 
        catch(error){
            console.error(error);
            res.status(500).send({message: "Internal Error"});
        }
    }
});

// Menampilkan informasi tentang order yang sedang terjadi
router.get('/', async (req, res) => {
    if(req.session.role === "client"){
        try {
            const response = await db.query(
                'SELECT * FROM orders WHERE "userId" = $1 AND "orderStatus" = $2',
                [req.session.userId, 0]
            );
            const data = response.rows[0];
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
                'SELECT * FROM orders WHERE "orderId" = $1',
                [orderId]
            );
            const data = response.rows[0];
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
                'SELECT "orderId" FROM orders WHERE "orderId" = $1 AND "userId" = $2',
                [orderId, req.session.userId]
            );
            const checkUser = getCheckUser.rows[0].orderId;

            if(!checkUser || checkUser.length <= 0 || checkUser === ""){
                res.status(401).send({message: "Unauthorized Access"});
                return;
            }

            const response = await db.query(
                'SELECT * FROM orders WHERE "orderId" = $1',
                [orderId]
            );
            const data = response.rows[0];
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
            // db.query(
            //     'UPDATE orders set "recipientName" = $1, "address" = $2, "orderStatus" = $3, "orderDate" = NOW() WHERE "orderStatus" = $4 AND "userId" = $5',
            //     [recipientName, address, 1, 0, req.session.userId],
            //     async(err, results) => {
            //         if(err){
            //             console.error(err);
            //             res.status(500);
            //         }
            //         else{
            //             db.query(
            //                 'SELECT "orderId" FROM orders WHERE "userId" = $1 AND "orderStatus" = $2 ORDER BY "orderId" DESC LIMIT 1',
            //                 [req.session.userId, 1],
            //                 (selectErr, selectResults) => {
            //                     if (selectErr) {
            //                         console.error(selectErr);
            //                         res.status(500).send({ message: "Internal Server Error" });
            //                     } else {
            //                         const orderId = selectResults[0].orderId;
            //                         res.status(200).send({message: "Success Create Order", redirecTo: `${FRONTEND_URL}/orders/${orderId}`});
            //                     }
            //                 }
            //             );
            //         }
            //     }
            // );
            const results = await db.query(
                'UPDATE orders set "recipientName" = $1, "address" = $2, "orderStatus" = $3, "orderDate" = NOW() WHERE "orderStatus" = $4 AND "userId" = $5 RETURNING "orderId"',
                [recipientName, address, 1, 0, req.session.userId]
            );
            const orderId = results.rows[0]?.orderId;
            if(orderId){
                res.status(200).send({message: "Success Create Order", redirecTo: `${FRONTEND_URL}/orders/${orderId}`});
            }
            else{
                res.status(500).send({message: "Failed to create order"});
            }
        } 
        catch(error){
            console.error(error);
            res.status(500).send({message: "Internal Error"});
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

            // db.query(
            //     'UPDATE orders SET "proofPayment" = $1 WHERE "orderId" = $2',
            //     [imageUrl, orderId],
            //     async (err, results) => {
            //         if(err){
            //             console.error(err);
            //             res.status(500).send({message: "Error"});
            //         }
            //         else{
            //             res.status(200).send({ message: 'Proof Payment Upload Success', proofPayment: imageUrl });
            //         }
            //     }
            // );

            const results = await db.query(
                'UPDATE orders SET "proofPayment" = $1 WHERE "orderId" = $2 RETURNING "orderId"',
                [imageUrl, orderId]
            );
            if(results.rows.length > 0){
                res.status(200).send({ message: 'Proof Payment Upload Success', proofPayment: imageUrl });
            }
            else{
                res.status(500).send({message: "Failed to upload proof of payment"});
            }
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
            // db.query(
            //     'UPDATE orders SET "orderStatus" = $1 WHERE "orderId" = $2',
            //     [2, orderId],
            //     async(err, results) => {
            //         if(err){
            //             console.error(err);
            //             res.status(500).send({message: "Error"});
            //         }
            //         else{
            //             db.query(
            //                 'INSERT INTO orders ("userId", "total", "orderStatus") VALUES ($1, $2, $3)',
            //                 [userId, 0, 0],
            //                 async(error, results) => {
            //                     if(error){
            //                         console.error(error);
            //                         res.status(500).send({message: "Error"});
            //                     }
            //                     else{
            //                         res.status(200).send({message: "Success Accepting Payment"});
            //                     }
            //                 }
            //             );
            //         }
            //     }
            // );

            const results = await db.query(
                'UPDATE orders SET "orderStatus" = $1 WHERE "orderId" = $2 RETURNING "orderId"',
                [2, orderId]
            );
            if(results.rows.length > 0){
                await db.query(
                    'INSERT INTO orders ("userId", "total", "orderStatus") VALUES ($1, $2, $3)',
                    [userId, 0, 0]
                );
                res.status(200).send({message: "Success Accepting Payment"});
            }
            else{
                res.status(500).send({message: "Failed to accept payment"});
            }
        } 
        catch(error){
            console.error(error);
            res.status(500).send({message: "Internal Error"});
        }
    }
});

module.exports = router;