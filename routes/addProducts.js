const express = require('express');
const router = express.Router();
const cloudinary = require('../config/cloudinary');
const db = require('../config/db');
const multer = require('multer');
const storage = multer.memoryStorage();
const parser = multer({ storage: storage });

router.post('/', parser.single('image'), async (req, res) => {
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
    
    const imageUrl = await uploadToCloudinary(imageBuffer);
    
    if(req.session.role === "admin"){
        try{
            const response = await db.query(
                'INSERT INTO products("name", "category", "description", "gender", "price", "imageUrl") VALUES($1, $2, $3, $4, $5, $6) RETURNING "productId"', 
                [name, category, description, gender, price, imageUrl]
            );

            const productId = response.rows[0].productId;

            const parsedSizes = JSON.parse(sizes);
            for(const size in parsedSizes){
                const stock = parsedSizes[size];
                await db.query('INSERT INTO sizes("productId", "size", "stock") VALUES($1, $2, $3)', [productId, size, stock]);
            }
            
            res.status(200).json({ message: 'Product Added Successfully' });
        }
        catch(error){
            console.error(error);
            res.status(500).send({message: "Internal Error"});
        }
    }
});

module.exports = router;