const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
        try{
                const response = await db.query('SELECT * FROM products');
                if(response.status === 200){
                        const data = await response.json();
                        res.status(200).send(data);
                }
        }
        catch(err){
                console.error(err);
                res.status(500).send({message: "Error"});
        }
});

router.get('/:productId', async (req, res) => {
    const productId = req.params.productId;
    try{
        db.query(
            'SELECT * FROM products WHERE productId = ?',
            [productId],
            async(err, results) => {
                if(err){
                    console.error(err);
                    res.status(500).send();
                }
                else{
                    res.status(200).send(results);
                }
            }
        );    
    }
    catch(error){
        console.error(error);
        res.status(500).send();
    }
});

router.get('/stock/:productId', async (req, res) => {
    const productId = req.params.productId;
    try {
        db.query(
            'SELECT size, stock FROM sizes WHERE productId = ?',
            [productId],
            async (error, results) => {
                if(error){
                    console.error(error);
                    res.status(500).send();
                }
                else{
                    res.status(200).send(results);
                }
            }
        );    
    } 
    catch (error) {
        console.error(error);
        res.status(500).send();
    }
});

router.put('/stock/:productId', async (req, res) => {
    
    const productId = req.params.productId;
    const { sizes } = req.body;
    
    if(req.session.role === "admin"){
        try {
            for(const size in sizes){
                const stock = sizes[size];
                db.query(
                    'UPDATE sizes SET stock = ? WHERE productId = ? AND size = ?',
                    [stock, productId, size],
                    async (err, results) => {
                        if(err){
                            console.error('Database error:', err);
                            res.status(500).send();
                        }
                    }
                );
            }
            res.status(200).send({message: "Stock Modified"});
        }
        catch(error){
            console.error(error);
            res.status(500).send({message: "Error"});
        }
    }
});

module.exports = router;
