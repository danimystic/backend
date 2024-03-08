const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const data = await db.query('SELECT * FROM products');
        res.status(200).send(data.rows);
    } catch (error) {
        console.error(error);
        res.status(500).send({message: "Internal Error"});
    }
});

router.get('/:productId', async (req, res) => {
    const productId = req.params.productId;
    try{
        const data = await db.query('SELECT * FROM products WHERE "productId" = $1', [productId]);
        res.status(200).send(data.rows[0]);
    }
    catch(error){
        console.error(error);
        res.status(500).send({message: "Internal Error"});
    }
});

router.get('/stock/:productId', async (req, res) => {
    const productId = req.params.productId;
    try {
        const data = await db.query('SELECT "size", "stock" FROM sizes WHERE "productId" = $1', [productId]);
        res.status(200).send(data.rows);
    } 
    catch (error) {
        console.error(error);
        res.status(500).send({message: "Internal Error"});
    }
});

router.put('/stock/:productId', async (req, res) => {
    
    const productId = req.params.productId;
    const { sizes } = req.body;
    
    if(req.session.role === "admin"){
        try {
            for(const size in sizes){
                const stock = sizes[size];
                await db.query('UPDATE sizes SET "stock" = $1 WHERE "productId" = $2 AND "size" = $3', [stock, productId, size]);
            }
            res.status(200).send({message: "Stock Modified"});
        }
        catch(error){
            console.error(error);
            res.status(500).send({message: "Internal Error"});
        }
    }
});

module.exports = router;
