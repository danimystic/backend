const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
    if(req.session.role === "client"){
        try{
            db.query(
                'SELECT products.name, products.gender, products.category, sizes.size, carts.cartId, carts.orderId, carts.sizeId, carts.quantity, carts.price, products.imageUrl FROM carts JOIN orders ON carts.orderId = orders.orderId JOIN sizes ON carts.sizeId = sizes.sizeId JOIN products ON sizes.productId = products.productId WHERE orders.userId = ? AND orders.orderStatus = ?',
                [req.session.userId, 0],
                async (error, results) => {
                    if(error){
                        console.error(error);
                        res.status(500);
                    }
                    else{
                        res.status(200).send(results);
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

router.get('/:orderId', async (req, res) => {
    const orderId = req.params.orderId;
    
    if(req.session.username){
        try{
            db.query(
                'SELECT products.name, products.gender, products.category, sizes.size, carts.cartId, carts.orderId, carts.sizeId, carts.quantity, carts.price, products.imageUrl FROM carts JOIN orders ON carts.orderId = orders.orderId JOIN sizes ON carts.sizeId = sizes.sizeId JOIN products ON sizes.productId = products.productId WHERE carts.orderId = ?',
                [orderId],
                async (error, results) => {
                    if(error){
                        console.error(error);
                        res.status(500);
                    }
                    else{
                        console.log(results);
                        res.status(200).send(results);
                    }
                }
            );
        }
        catch(error){
            console.error(error);
            res.status(500);
        }
    }
})

router.post('/', async (req, res) => {
    const {productId, size} = req.body;

    if(req.session.role === "client"){
        try {
            db.query(
                'SELECT carts.cartId FROM carts JOIN orders ON carts.orderId = orders.orderId JOIN sizes ON carts.sizeId = sizes.sizeId WHERE sizes.productId = ? AND sizes.size = ?',
                [productId, size],
                async (error, results) => {
                    if(error){
                        console.error(error);
                        res.status(500).send({message: 'Error'});
                    }
                    else if(results.length > 0){
                        res.status(409).send({message: 'Product Already in Cart'});
                    }
                    else{
                        try {
                            db.query(
                                'CALL insertCarts(?, ?, ?)',
                                [productId, size, req.session.userId],
                                async (error, results) => {
                                    if(error){
                                        console.error(error);
                                        res.status(500).send({message: 'Error'});
                                    }
                                    else{
                                        res.status(201).send({ message: 'Resource created successfully' });
                                    }
                                }
                            );    
                        }
                        catch(error){
                            console.error(error);
                            res.status(500).send({message: 'Error'});
                        }
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

router.put('/:cartId', async (req, res) => {
    const {quantity} = req.body;
    const cartId = req.params.cartId;

    try{
        db.query(
            'UPDATE carts SET quantity = ? WHERE cartId = ?',
            [quantity, cartId],
            async (error, results) => {
                if(error){
                    console.error(error);
                    res.status(500).send({message: "Error edit carts"});
                }
                else{
                    res.status(200).send({message: "Success edit carts"});
                }
            }
        )
    }
    catch(error){
        console.error(error);
        res.status(500).send({message: "Error edit carts"});
    }

});

router.delete('/:cartId', async (req, res) => {
    const cartId = req.params.cartId;

    try{
        db.query(
            'DELETE FROM carts WHERE cartId = ?',
            [cartId],
            async(error, results) => {
                if(error){
                    console.error(error);
                    res.status(500).send({message: "Error"});
                }
                else{
                    res.status(200).send({message: "Cart Success deleted"});
                }
            }
        )
    }
    catch(error){
        console.error(error);
        res.status(500).send({message: "Error"})
    }
});


module.exports = router;