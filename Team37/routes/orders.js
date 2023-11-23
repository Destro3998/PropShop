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
        // create order 
        let order = await models.Order.create([{
            user: userId,
        }], {session: session}); // set the session for this operation so that it remains isolated to this transaction


        // get all the props referenced in the users cart
        let user = await models.User.findById(userId).populate('cart.itemId').session(session);

        //console.log(user)
        if (user.cart.length < 1) { // if cart is empty, abort transaction
            throw new Error("Attempting to reserve empty cart")
        }

        console.log(user.cart.length + " item(s) detected in cart")
        // go through items in user cart one by one,
        // checking if able to reserve, and then reserving
        // also verifying costs before processing payment
        totalPrice = 0
        for (const cartitem of user.cart) {
            console.log("reserving " + cartitem.itemId.name)
            
            // change status/quantity of prop in the store
            if (cartitem.itemId.numOfAvailable > 0){ // first check if prop is available
                console.log("is available" + cartitem.itemId.name)
                if (cartitem.itemId.numOfAvailable >= cartitem.quantity) { // if there is more than enough of this prop available
                    console.log("enough available " + cartitem.itemId.name)
                    await models.Prop.findByIdAndUpdate(cartitem.itemId.id, {
                        numOfReserved: cartitem.itemId.numOfReserved + cartitem.quantity // just lower the number of available props
                    }).session(session);
                }	
                else {
                    console.log("not enough" + cartitem.itemId.name)
                    throw new Error("not enough of this item available")
                }
            } else { // if not available don't reserve it
                throw new Error("item is not available to reserve")
            }

            console.log("reserved " + cartitem.itemId.name)

            // add prop to the order
            await models.Order.findByIdAndUpdate({_id: order[0].id }, {$push: {items: cartitem}}).session(session);
            console.log("added to order " + cartitem.itemId.name)

            // remove prop from the user's cart
            await models.User.findByIdAndUpdate({_id: userId}, {$pull: {cart: {_id: cartitem.id}}}).session(session);
            console.log("removed from cart " + cartitem.itemId.name)

            // add cost of the prop to the total price for the order
            totalPrice += (cartitem.itemId.price * cartitem.quantity)
        }
        
        //** TODO: add payment processing step here */
        depositAmount = totalPrice * 0.10; //TODO: replace 0.10 with reservation fee set by config page
        depositAmount = parseInt(depositAmount*100) // convert $ to cents and parse as integer for stripe
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

        Order.findByIdAndUpdate(order[0].id, {paymentIntentId: paymentIntent.id}).session(session);



        // if every step completed successfully, finalize the transaction
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
                populate: {path: 'itemId'}
            })
            .exec();

        if (!order) {
            return res.status(404).send('Order not found');
        }

        let reservedItems = [];
        let checkedItems = []
        order.items.forEach((item) => {
            if (item.status === "checked out") {
                checkedItems.push(item.toObject());
                console.log(item.toObject());
            } else {
                reservedItems.push(item.toObject());
                console.log(item.toObject());
            }
        });

        // Converting Mongoose document to a plain object
        let orderObj = order.toObject();

        res.render("order.handlebars", {
            order: orderObj,
            authenticated: authenticated,
            userId: userId,
            reservedItems: reservedItems,
            checkedItems: checkedItems
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }

});

router.get("/:userId/orders", async (req, res) => {
    try {
        let authenticated = req.isAuthenticated();
        let userId = req.params.userId;
        let orders = await getUserOrders(userId);
        let ordersLength = orders.length;
        res.render("orders.handlebars", {orders: orders, ordersLength: ordersLength, authenticated: authenticated})
    } catch (error) {
        res.render("error.handlebars", {error: error})
    }
});

module.exports = router;