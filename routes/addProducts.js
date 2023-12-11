const express = require('express');
const router = express.Router();
const cloudinary = require('../config/cloudinary');
const db = require('../config/db');
const multer = require('multer');
const storage = multer.memoryStorage();
const parser = multer({ storage: storage });

router.post('/', parser.single('image'), async (req, res) => {
    if(req.session.role === "admin"){
        const { name, category, description, gender, price, sizes } = req.body;
        const imageBuffer = req.file.buffer;

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
                'INSERT INTO products(name, category, description, gender, price, imageUrl) VALUES(?, ?, ?, ?, ?, ?)',
                [name, category, description, gender, price, imageUrl],
                async (err, results) => {
                    if(err){
                        console.error(err);
                        res.status(500);
                    }
                    else{
                        const productId = results.insertId;
                        const parsedSizes = JSON.parse(sizes);
                        for(const size in parsedSizes){
                            const stock = parsedSizes[size];
                            db.query(
                                'INSERT INTO sizes(productId, size, stock) VALUES(?, ?, ?)',
                                [productId, size, stock],
                                async (err, results) => {
                                    if(err){
                                        console.error('Database error:', err);
                                        res.status(500);
                                    } 
                                }
                            );
                        }
                    }
                    res.status(200).json({ message: 'Product Added Successfully' });
                }
            );
        }
        catch(error){
            console.error(error);
            res.status(500);
        }
    }
});


module.exports = router;