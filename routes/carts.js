const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
    if(req.session.role === "client"){
        try{
            const response = await db.query(
                'SELECT products.name, products.gender, products.category, sizes.size, carts.cartId, carts.orderId, carts.sizeId, carts.quantity, carts.price, products.imageUrl FROM carts JOIN orders ON carts.orderId = orders.orderId JOIN sizes ON carts.sizeId = sizes.sizeId JOIN products ON sizes.productId = products.productId WHERE orders.userId = ? AND orders.orderStatus = ?', 
                [req.session.userId, 0]
            );
            const results = response[0];
            res.status(200).send(results);
        }
        catch(error){
            console.error(error);
            res.status(500).send({message: "Internal Error"});
        }
    }
    else{
        res.status(404).send({message: "Not Found"});
    }
});

router.get('/:orderId', async (req, res) => {
    const orderId = req.params.orderId;
    
    if(req.session.role === "admin"){
        try{
            const response = await db.query(
                'SELECT products.name, products.gender, products.category, sizes.size, carts.cartId, carts.orderId, carts.sizeId, carts.quantity, carts.price, products.imageUrl FROM carts JOIN orders ON carts.orderId = orders.orderId JOIN sizes ON carts.sizeId = sizes.sizeId JOIN products ON sizes.productId = products.productId WHERE carts.orderId = ?', 
                [orderId]
            );
            const results = response[0];
            if(results.length > 0){
                console.log(results);
                res.status(200).send(results);
            }
            else{
                res.status(404).send({message: "Not Found"});
            }
        }
        catch(error){
            console.error(error);
            res.status(500).send({message: "Internal Error"});
        }
    }
    else if(req.session.role === "client"){
        try {
            const response = await db.query(
                'SELECT products.name, products.gender, products.category, sizes.size, carts.cartId, carts.orderId, carts.sizeId, carts.quantity, carts.price, products.imageUrl FROM carts JOIN orders ON carts.orderId = orders.orderId JOIN sizes ON carts.sizeId = sizes.sizeId JOIN products ON sizes.productId = products.productId WHERE carts.orderId = ? AND orders.orderId = ?', 
                [orderId, req.session.userId]
            );
            const results = response[0];
            if(results.length > 0){
                console.log(results);
                res.status(200).send(results);
            }
            else{
                res.status(401).send({message: "Unauthorized Access"});
            }   
        }
        catch (error){
            console.error(error);
            res.status(500).send({message: "Internal Error"});
        }
    }
    else{
        res.status(401).send({message: "Unauthorized Access"});
    }
})

router.post('/', async (req, res) => {
    const {productId, size} = req.body;

    if(req.session.role === "client"){
        try {

            const getCheckStock = await db.query(
                'SELECT stock FROM sizes WHERE productId = ? AND size = ?',
                [productId, size]
            );
            const checkStock = getCheckStock[0].stock;

            if(checkStock <= 0){
                res.status(409).send({message: "Empty Stock"});
                return;
            }

            const response = await db.query(
                'SELECT carts.cartId FROM carts JOIN orders ON carts.orderId = orders.orderId JOIN sizes ON carts.sizeId = sizes.sizeId WHERE sizes.productId = ? AND sizes.size = ? AND orders.userId = ? AND orders.orderStatus = ?', 
                [productId, size, req.session.userId, 0]
            );
            const results = response[0];

            if(results.length > 0){
                res.status(409).send({message: 'Product Already in Cart'});
                return;
            }
            else{
                const getOrderId = await db.query(
                    'SELECT orderId FROM orders WHERE userId = ? AND orderStatus = ?',
                    [req.session.userId, 0]    
                );
                // console.log(getOrderId);
                const orderId = getOrderId[0][0].orderId;
                // console.log(orderId);
                
                const getPrice = await db.query(
                    'SELECT price FROM products WHERE productId = ?',
                    [productId]
                );
                // console.log(getPrice);
                const price = getPrice[0][0].price;
                // console.log(price);

                const getSizeId = await db.query(
                    'SELECT sizeId FROM sizes WHERE productId = ? AND size = ?',
                    [productId, size]
                );
                // console.log(getSizeId);
                const sizeId = getSizeId[0][0].sizeId;
                // console.log(sizeId);

                await db.query(
                    'INSERT INTO carts(orderId, price, quantity, sizeId) VALUES (?, ?, ?, ?)',
                    [orderId, price, 1, sizeId]
                );
                
                await db.query(
                    'UPDATE orders SET total = total + ? WHERE orderId = ?',
                    [price, orderId]
                );

                res.status(201).send({message: "Product Added to Cart"});
            }
        } 
        catch(error){
            console.error(error);
            res.status(500).send({message: "Internal Error"});
        }
    }
    else{
        res.status(401).send({message: "Unauthorized Access"});
    }
});

router.put('/:cartId', async (req, res) => {
    const {quantity} = req.body;
    const cartId = req.params.cartId;

    if(req.session.role === "client"){
        try{
            const getCheckUser = await db.query(
                'SELECT carts.cartId FROM carts JOIN orders ON carts.orderId = orders.orderId WHERE orders.userId = ? AND carts.cartId = ?',
                [req.session.userId, cartId]
            );
            const checkUser = getCheckUser[0].cartId;

            if(!checkUser || checkUser.length <= 0 || checkUser === ""){
                res.status(401).send({message: "Unauthorized Access"});
                return;
            }

            const getOrderId = await db.query(
                'SELECT orderId FROM orders WHERE userId = ? AND orderStatus = ?',
                [req.session.userId, 0]    
            );
            const orderId = getOrderId[0].orderId;

            const getOldQuantityAndPrice = await db.query(
                'SElECT quantity, price FROM carts WHERE cartId = ?',
                [cartId]
            );
            const oldQuantity = getOldQuantityAndPrice[0].quantity;
            const price = getOldQuantityAndPrice[0].price;
            
            await db.query(
                'UPDATE carts SET quantity = ? WHERE cartId = ?',
                [quantity, cartId],
            );

            await db.query(
                'UPDATE orders SET total = total - ? + ? WHERE orderId = ?',
                [oldQuantity * price, quantity * price, orderId]
            );
        }
        catch(error){
            console.error(error);
            res.status(500).send({message: "Internal Error"});
        }
    }
    else{
        res.status(401).send({message: "Unauthorized Access"});
    }
});

router.delete('/:cartId', async (req, res) => {
    const cartId = req.params.cartId;

    if(req.session.role === "client"){
        try{
            
            const getCheckUser = await db.query(
                'SELECT carts.cartId FROM carts JOIN orders ON carts.orderId = orders.orderId WHERE orders.userId = ? AND carts.cartId = ?',
                [req.session.userId, cartId]
            );
            const checkUser = getCheckUser[0].cartId;

            if(!checkUser || checkUser.length <= 0 || checkUser === ""){
                res.status(401).send({message: "Unathorized Access"});
                return;
            }

            const getOrderId = await db.query(
                'SELECT orderId FROM orders WHERE userId = ? AND orderStatus = ?',
                [req.session.userId, 0]    
            );
            const orderId = getOrderId[0].orderId;
            
            const getOldQuantityAndPrice = await db.query(
                'SElECT quantity, price FROM carts WHERE cartId = ?',
                [cartId]
            );
            const oldQuantity = getOldQuantityAndPrice[0].quantity;
            const price = getOldQuantityAndPrice[0].price;

            await db.query(
                'DELETE FROM carts WHERE cartId = ?',
                [cartId]
            );

            await db.query(
                'UPDATE orders SET total = total - ? WHERE orderId = ?',
                [oldQuantity * price, orderId]
            );
        }
        catch(error){
            console.error(error);
            res.status(500).send({message: "Error"})
        }

    }
});

module.exports = router;