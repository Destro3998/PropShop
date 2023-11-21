const express = require("express");
const router = express.Router();
const models = require("../utilities/models.js");
const {isAdmin, isAuth} = require("../utilities/authMiddleware.js");
const {getOrders, getOrder, DisplayOrder} = require("../utilities/dbUtilities.js");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const mongoose = require("mongoose");
const {Order} = require("../utilities/models");
const {getUserOrders} = require("../utilities/dbUtilities");


/** get all orders in the database, for admin dashboard */
router.get('/all', isAdmin, async function (req, res) {
    let all_orders = await getOrders();
    authenticated = req.isAuthenticated();
    /* code below assumes an implementation of a separate page for all orders on the dashboard,
    so this code would not apply if the order list is integrated into the main dashboard page */

    res.render("orders.handlebars", {
        name: "All Orders",
        orders: all_orders,
        ordersLength: all_orders.length,
        authenticated: authenticated,
    });
})


/**
 * creates new order on checkout
 */
router.post('/new-order/:userId', isAuth, async function (req, res) {
    const authenticated = req.isAuthenticated();
    const {paymentMethodId, depositAmount} = req.body;

    if (!authenticated) {
        return res.status(401).send('User must be authenticated');
    }

    try {
        const orderId = await newOrderTransaction(req.params.userId, paymentMethodId, depositAmount);
        // if the orderId is not null or undefined
        if (!orderId) {
            throw new Error('Failed to create order.');
        }

        res.json({orderId: orderId, redirectIRL: "/store"}); // send order ID in the response
    } catch (error) {
        console.error('Order creation failed:', error);
        res.status(500).json({error: error.message});
    }
});
/*
let usermodel = await models.User.findById(req.params.userId); // get the user placing the order


try {
    models.Order.create({
        price: req.body.price,
        //datePlaced: new Date(),
        status: req.body.status,
        user: req.params.userId,
        items: usermodel.cart // might be better to go through the cart items one by one, calling reserve and then adding to the order
    })                      // (in case one or more items have become unavailable since adding to cart)
                                // this would be done in this route method, but after already constructing the order
} catch (error) {
    console.log(error)
}  */

/*if (!orderId) { // if transaction failed
    res.status(500);
    res.send()
    res.redirect("/store");
} else {
    res.status(200);
    res.redirect("/store"); // TODO: change this to route to the order page? or some success screen
    //res.redirect(`/orders/${orderId}`) // THIS DOES NOT WORK
}
})*/


/**
 * Creates a transaction session to handle:
 *  creating a new order
 *  changing the availability status of props in cart
 *  removing items from cart and adding them to the order
 *  TODO: implement payment processing within this transaction
 *
 * @param {*} userId the user placing the order
 * @returns the id of the newly created order
 */
async function newOrderTransaction(userId, paymentMethodId, depositAmount) {
    const session = await mongoose.startSession(); // Start a new session for transaction
    session.startTransaction(); // Start the transaction
    let order;

    try {
        let user = await models.User.findById(userId)
            .populate('cart.itemId')
            .session(session);

        if (user.cart.length < 1) {
            throw new Error("Attempting to reserve an empty cart");
        }

        depositAmount = parseInt(depositAmount, 10); // convert to an integer if it's in string format
        if (isNaN(depositAmount) || depositAmount <= 0) {
            throw new Error("Invalid deposit amount");
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: depositAmount,
            currency: 'cad',
            payment_method: paymentMethodId,
            confirmation_method: 'manual',
            confirm: true,
            return_url: 'http://localhost:3000/orders/all',

        });

        if (paymentIntent.status !== 'succeeded') {
            throw new Error("Payment failed with status: " + paymentIntent.status);
        }

        // create the order with the payment intent ID
        order = await models.Order.create([{
            user: userId,
            paymentIntentId: paymentIntent.id,
            items: user.cart.map(cartItem => ({
                itemId: cartItem.itemId,
                quantity: cartItem.quantity
            }))
        }], {session: session});


        // Update inventory and create order items
        for (const cartItem of user.cart) {
            if (cartItem.itemId.quantity >= 1) {
                // Logic to adjust inventory and handle reservations goes here
            } else {
                throw new Error(`Item ${cartItem.itemId.name} is not available to reserve`);
            }

            // Remove prop from the user's cart
            await models.User.findByIdAndUpdate(userId, {
                $pull: {cart: {_id: cartItem._id}}
            }, {session: session});
        }

        await session.commitTransaction();
        console.log("transaction committed")
    } catch (error) {
        await session.abortTransaction();
        console.log("transaction failed")
        throw error;
    } finally {
        session.endSession();
        console.log("session ended")
    }

    return order ? order[0]._id : null; // Return the ID of the created order
}


/** gets a specific order from the database */
router.get('/:orderId', isAuth, async function (req, res) {
    let orderId = req.params.orderId;
    let authenticated = req.isAuthenticated();
    let userId = req.user && req.user._id ? req.user._id : undefined;

    try {
        let order = await Order.findById(orderId)
            .populate({
                path: 'items',
                populate: { path: 'itemId' } 
            })
            .exec();

        if (!order) {
            return res.status(404).send('Order not found');
        }

        // Converting Mongoose document to a plain object
        let orderObj = order.toObject();

        res.render("order.handlebars", {order: orderObj, authenticated: authenticated, userId: userId});

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
    
});

router.get("/:userId/orders", async (req, res) =>{
   try{
       let authenticated = req.isAuthenticated();
       let userId = req.params.userId;
       let orders = await getUserOrders(userId);
       let ordersLength = orders.length;
       res.render("orders.handlebars", {orders:orders, ordersLength:ordersLength, authenticated:authenticated})
   } catch (error){
       res.render("error.handlebars", {error:error})
   }
});

module.exports = router;