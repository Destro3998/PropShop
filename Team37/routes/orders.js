const express = require("express");
const router = express.Router();
const models = require("../utilities/models.js");
const { isAdmin, isAuth } = require("../utilities/authMiddleware.js");
const { getOrders, getOrder, DisplayOrder, getUser } = require("../utilities/dbUtilities.js");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const mongoose = require("mongoose");
const { Order } = require("../utilities/models");
const { getUserOrders } = require("../utilities/dbUtilities");
const { sendOrderConfirmationEmail } = require("../utilities/emails");


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
    const { paymentMethodId, depositAmount } = req.body;

    if (!authenticated) {
        return res.status(401).send('User must be authenticated');
    }

    try {
        const result = await newOrderTransaction(req.params.userId, paymentMethodId, depositAmount);
        // if the order was created successfully
        if (!result.success) {
            throw result.error
        }

        orderId = result.orderId

        // If order is valid, send confirmation email
        await sendOrderConfirmationEmail(orderId, req.headers.host)
            .then(() => {
                console.log('Confirmation email sent successfully.');
            })
            .catch((error) => {
                console.error('Error sending email:', error);
            })

        res.json({ orderId: orderId, redirectIRL: "/store" }); // send order ID in the response
    } catch (error) {
        console.error('Order creation failed:', error);
        res.status(500).json({ error: error.message });
    }
});


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
    let result;
    try {
        // create order 
        order = await models.Order.create([{
            user: userId,
        }], { session: session }); // set the session for this operation so that it remains isolated to this transaction
        console.log('Created order object', order);

        // get all the props referenced in the users cart
        let user = await models.User.findById(userId).populate('cart.itemId').session(session);

        //console.log(user)
        if (user.cart.length < 1) { // if cart is empty, abort transaction
            throw new Error("Attempting to reserve empty cart.")
        }

        console.log(user.cart.length + " item(s) detected in cart")
        // go through items in user cart one by one,
        // checking if able to reserve, and then reserving
        // also verifying costs before processing payment
        totalPrice = 0
        for (const cartitem of user.cart) {
            console.log("reserving " + cartitem.itemId.name)

            // change status/quantity of prop in the store
            if (cartitem.itemId.numOfAvailable - cartitem.itemId.numOfReserved > 0) { // first check if prop is available
                console.log("is available" + cartitem.itemId.name)
                if (cartitem.itemId.numOfAvailable - cartitem.itemId.numOfReserved >= cartitem.quantity) { // if there is more than enough of this prop available
                    console.log("enough available " + cartitem.itemId.name)
                    await models.Prop.findByIdAndUpdate(cartitem.itemId.id, {
                        numOfReserved: cartitem.itemId.numOfReserved + cartitem.quantity // just lower the number of available props
                    }).session(session);
                }
                else {
                    console.log("not enough" + cartitem.itemId.name)
                    throw new Error(`Requested ${cartitem.itemId.quantity} ${cartitem.itemId.name},
                     but only ${cartitem.itemId.numOfAvailable - cartitem.itemId.numOfReserved} available to reserve.`)
                }
            } else { // if not available don't reserve it
                throw new Error(`${cartitem.itemId.name} is not available to reserve.`)
            }

            console.log("reserved " + cartitem.itemId.name)

            // add prop to the order
            await Order.findByIdAndUpdate({ _id: order[0].id }, { $push: { items: cartitem } }).session(session);
            console.log("added to order " + cartitem.itemId.name)

            // remove prop from the user's cart
            await models.User.findByIdAndUpdate({ _id: userId }, { $pull: { cart: { _id: cartitem.id } } }).session(session);
            console.log("removed from cart " + cartitem.itemId.name)

            // add cost of the prop to the total price for the order
            totalPrice += (cartitem.itemId.price * cartitem.quantity)
        }

        // Update the order price and depositAmount
        await Order.findByIdAndUpdate({ _id: order[0].id }, { price: totalPrice }).session(session);

        depositAmount = totalPrice * 0.10; //TODO: replace 0.10 with reservation fee set by config page
        await Order.findByIdAndUpdate({ _id: order[0].id }, { depositAmount: depositAmount }).session(session);

        depositAmount = parseInt(depositAmount * 100) // convert $ to cents and parse as integer for stripe
        if (isNaN(depositAmount) || depositAmount <= 0) {
            throw new Error("Invalid deposit amount.");
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

        Order.findByIdAndUpdate(order[0].id, { paymentIntentId: paymentIntent.id, price: depositAmount}).session(session);



        // if every step completed successfully, finalize the transaction
        await session.commitTransaction();
        console.log("transaction committed")
        result = {success: true, orderId: order[0]._id }
    } catch (error) {
        await session.abortTransaction();
        console.log("transaction failed")
        result = { success: false, error: error }
    } finally {
        session.endSession();
        console.log("session ended")
    }

    return result
}


/** gets a specific order from the database */
router.get('/:orderId', isAuth, async function (req, res) {
    let orderId = req.params.orderId;
    let authenticated = req.isAuthenticated();
    let admin = req.user.admin;
    let userId = req.user && req.user._id ? req.user._id : undefined;
    let pendingDisabled = false, completeDisabled = false, progressDisabled = false;

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
        let user = (await getUser(order.user)).toObject();
        let reservedItems = [];
        let checkedItems = []
        order.items.forEach((item) => {
            if (item.status === "checked out") {
                checkedItems.push(item.toObject());
            } else {
                reservedItems.push(item.toObject());
            }
        });
        // Converting Mongoose document to a plain object
        let orderObj = order.toObject();

        switch (order.status) {
            case ("pending"): {
                pendingDisabled = true;
                break;
            }
            case ("in progress"): {
                progressDisabled = true;
                break;
            }
            case ("complete"): {
                completeDisabled = true;
                break;
            }
        }
        res.render("order.handlebars", {
            order: orderObj,
            authenticated: authenticated,
            userId: userId,
            reservedItems: reservedItems,
            checkedItems: checkedItems,
            pendingDisabled: pendingDisabled,
            progressDisabled: progressDisabled,
            completeDisabled: completeDisabled,
            user: user,
            admin: admin
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
        res.render("orders.handlebars", { orders: orders, ordersLength: ordersLength, authenticated: authenticated })
    } catch (error) {
        res.render("error.handlebars", { error: true, message: "Failed to get the order page for that user." })
    }
});

router.post("/:orderId/inProgress", isAdmin, async (req, res) => {
    let orderId = req.params.orderId;
    try {
        let order = await getOrder(orderId);
        order.status = "in progress";
        await order.save();
        req.flash("success", "state successfully changed");
        res.status(200).json({ message: "State changed successfully" });
    } catch (e) {
        res.render("error.handlebars", { error: true, message: "Failed to update the order status to 'in progress'" });
    }
});

router.post("/:orderId/complete", isAdmin, async (req, res) => {
    let orderId = req.params.orderId;
    try {
        let order = await getOrder(orderId);
        order.status = "complete";
        await order.save();
        req.flash("success", "state successfully changed");
        res.status(200).json({ message: "State changed successfully" });
    } catch (e) {
        res.render("error.handlebars", { error: true, message: "Failed to update the order status to 'complete'" });
    }
});

router.post("/:orderId/pending", isAdmin, async (req, res) => {
    let orderId = req.params.orderId;
    try {
        let order = await getOrder(orderId);
        order.status = "pending";
        await order.save();
        req.flash("success", "state successfully changed");
        res.status(200).json({ message: "State changed successfully" });
    } catch (e) {
        res.render("error.handlebars", { error: true, message: "Failed to update the order status to 'pending'" });
    }
});

module.exports = router;