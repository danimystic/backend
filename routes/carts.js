const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
    if(req.session.role === "client"){
        try{
            const response = await db.query(
                'SELECT products."name", products."gender", products."category", sizes."size", carts."cartId", carts."orderId", carts."sizeId", carts."quantity", carts."price", products."imageUrl" FROM carts JOIN orders ON carts."orderId" = orders."orderId" JOIN sizes ON carts."sizeId" = sizes."sizeId" JOIN products ON sizes."productId" = products."productId" WHERE orders."userId" = $1 AND orders."orderStatus" = $2', 
                [req.session.userId, 0]
            );
            const results = response.rows;
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
                'SELECT products."name", products."gender", products."category", sizes."size", carts."cartId", carts."orderId", carts."sizeId", carts."quantity", carts."price", products."imageUrl" FROM carts JOIN orders ON carts."orderId" = orders."orderId" JOIN sizes ON carts."sizeId" = sizes."sizeId" JOIN products ON sizes."productId" = products."productId" WHERE carts."orderId" = $1', 
                [orderId]
            );
            const results = response.rows;
            if(response.rows.length > 0){
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
                'SELECT products."name", products."gender", products."category", sizes."size", carts."cartId", carts."orderId", carts."sizeId", carts."quantity", carts."price", products."imageUrl" FROM carts JOIN orders ON carts."orderId" = orders."orderId" JOIN sizes ON carts."sizeId" = sizes."sizeId" JOIN products ON sizes."productId" = products."productId" WHERE carts."orderId" = $1 AND orders."orderId" = $2', 
                [orderId, req.session.userId]
            );
            const results = response.rows;
            if(response.rows.length > 0){
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
                'SELECT "stock" FROM sizes WHERE "productId" = $1 AND "size" = $2',
                [productId, size]
            );
            const checkStock = getCheckStock.rows[0].stock;

            if(checkStock <= 0){
                res.status(409).send({message: "Empty Stock"});
                return;
            }

            const response = await db.query(
                'SELECT carts."cartId" FROM carts JOIN orders ON carts."orderId" = orders."orderId" JOIN sizes ON carts."sizeId" = sizes."sizeId" WHERE sizes."productId" = $1 AND sizes."size" = $2 AND orders."userId" = $3 AND orders."orderStatus" = $4', 
                [productId, size, req.session.userId, 0]
            );

            if(response.rows.length > 0){
                res.status(409).send({message: 'Product Already in Cart'});
                return;
            }
            else{
                const getOrderId = await db.query(
                    'SELECT "orderId" FROM orders WHERE "userId" = $1 AND "orderStatus" = $2',
                    [req.session.userId, 0]    
                );
                // console.log(getOrderId);
                const orderId = getOrderId.rows[0].orderId;
                // console.log(orderId);
                
                const getPrice = await db.query(
                    'SELECT "price" FROM products WHERE "productId" = $1',
                    [productId]
                );
                // console.log(getPrice);
                const price = getPrice.rows[0].price;
                // console.log(price);

                const getSizeId = await db.query(
                    'SELECT "sizeId" FROM sizes WHERE "productId" = $1 AND "size" = $2',
                    [productId, size]
                );
                // console.log(getSizeId);
                const sizeId = getSizeId.rows[0].sizeId;
                // console.log(sizeId);

                await db.query(
                    'INSERT INTO carts("orderId", "price", "quantity", "sizeId") VALUES ($1, $2, $3, $4)',
                    [orderId, price, 1, sizeId]
                );
                
                await db.query(
                    'UPDATE orders SET "total" = "total" + $1 WHERE "orderId" = $2',
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
                'SELECT carts."cartId" FROM carts JOIN orders ON carts."orderId" = orders."orderId" WHERE orders."userId" = $1 AND carts."cartId" = $2',
                [req.session.userId, cartId]
            );
            const checkUser = getCheckUser.rows[0].cartId;

            if(!checkUser || checkUser.length <= 0 || checkUser === ""){
                res.status(401).send({message: "Unauthorized Access"});
                return;
            }

            const getOrderId = await db.query(
                'SELECT "orderId" FROM orders WHERE "userId" = $1 AND "orderStatus" = $2',
                [req.session.userId, 0]    
            );
            const orderId = getOrderId.rows[0].orderId;

            const getOldQuantityAndPrice = await db.query(
                'SElECT "quantity", "price" FROM carts WHERE "cartId" = $1',
                [cartId]
            );
            const oldQuantity = getOldQuantityAndPrice.rows[0].quantity;
            const price = getOldQuantityAndPrice.rows[0].price;
            
            await db.query(
                'UPDATE carts SET "quantity" = $1 WHERE "cartId" = $2',
                [quantity, cartId],
            );

            await db.query(
                'UPDATE orders SET "total" = "total" - $1 + $2 WHERE "orderId" = $3',
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
                'SELECT carts."cartId" FROM carts JOIN orders ON carts."orderId" = orders."orderId" WHERE orders."userId" = $1 AND carts."cartId" = $2',
                [req.session.userId, cartId]
            );
            const checkUser = getCheckUser.rows[0].cartId;

            if(!checkUser || checkUser.length <= 0 || checkUser === ""){
                res.status(401).send({message: "Unathorized Access"});
                return;
            }

            const getOrderId = await db.query(
                'SELECT "orderId" FROM orders WHERE "userId" = $1 AND "orderStatus" = $2',
                [req.session.userId, 0]    
            );
            const orderId = getOrderId.rows[0].orderId;
            
            const getOldQuantityAndPrice = await db.query(
                'SElECT "quantity", "price" FROM carts WHERE "cartId" = $1',
                [cartId]
            );
            const oldQuantity = getOldQuantityAndPrice.rows[0].quantity;
            const price = getOldQuantityAndPrice.rows[0].price;

            await db.query(
                'DELETE FROM carts WHERE "cartId" = $1',
                [cartId]
            );

            await db.query(
                'UPDATE orders SET "total" = "total" - $1 WHERE "orderId" = $2',
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