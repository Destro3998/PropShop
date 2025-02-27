const express = require("express");
const router = express.Router();
const models = require("../utilities/models.js");
const { isAdmin, isAuth } = require("../utilities/authMiddleware.js");
const { getOrders, getOrder, DisplayOrder, getUser } = require("../utilities/dbUtilities.js");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const mongoose = require("mongoose");
const { Order } = require("../utilities/models");
const { getUserOrders } = require("../utilities/dbUtilities");
const { sendOrderConfirmationEmails } = require("../utilities/emails");


/** get all orders in the database, for admin dashboard */
router.get('/all', isAdmin, async function (req, res) {
    let ordersNonObject = await Order.find({}).populate("user").populate('items.itemId');//await getOrders()
    //console.log(allOrders)
    authenticated = req.isAuthenticated();

    let orders = [];
    ordersNonObject.forEach((order) => {
        let uniqueItems = [];
        // combine all quantities of the same prop
        for (const item of order.items) {
            unique = true
            for (const uniqueItem of uniqueItems) {
                if (item.itemId === uniqueItem.itemId) {
                    uniqueItem.quantity += 1
                    unique = false
                }
            }
            if (unique) {
                uniqueItems.push(item)
            }
        }

        numItems = order.items.length // count the number of items (including mutliple quantities)
        order.items = uniqueItems // replace order items with unique items
        order = order.toObject() // convert to object before next line or it won't save it (not part of original schema)
        order.numItems = numItems
        orders.push(order)
    });

    res.render("ordersAll.handlebars", {
        name: "All Orders",
        orders: orders,
        ordersLength: orders.length,
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
        await sendOrderConfirmationEmails(orderId, req.headers.host)
            .then(() => {
                console.log('Confirmation emails sent successfully.');
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
        config = await models.Configuration.findOne()
        // create order 
        order = await models.Order.create([{
            user: userId,
        }], { session: session }); // set the session for this operation so that it remains isolated to this transaction
        //console.log('Created order object', order);

        // get all the props referenced in the users cart
        let user = await models.User.findById(userId).populate('cart.itemId').session(session);

        //console.log(user)
        if (user.cart.length < 1) { // if cart is empty, abort transaction
            throw new Error("Attempting to reserve empty cart.")
        }

        //console.log(user.cart.length + " item(s) detected in cart")
        // go through items in user cart one by one,
        // checking if able to reserve, and then reserving
        // also verifying costs before processing payment
        totalPrice = 0
        for (const cartitem of user.cart) {
            //console.log("reserving " + cartitem.itemId.name)

            // change status/quantity of prop in the store
            if (cartitem.itemId.numOfAvailable - cartitem.itemId.numOfReserved > 0) { // first check if prop is available
                //console.log("is available" + cartitem.itemId.name)
                if (cartitem.itemId.numOfAvailable - cartitem.itemId.numOfReserved >= cartitem.quantity) { // if there is more than enough of this prop available
                    //console.log("enough available " + cartitem.itemId.name)
                    await models.Prop.findByIdAndUpdate(cartitem.itemId.id, {
                        numOfReserved: cartitem.itemId.numOfReserved + cartitem.quantity // just lower the number of available props
                    }).session(session);
                }
                else {
                    //console.log("not enough" + cartitem.itemId.name)
                    throw new Error(`Requested ${cartitem.itemId.quantity} ${cartitem.itemId.name},
                     but only ${cartitem.itemId.numOfAvailable - cartitem.itemId.numOfReserved} available to reserve.`)
                }
            } else { // if not available don't reserve it
                throw new Error(`${cartitem.itemId.name} is not available to reserve.`)
            }

            //console.log("reserved " + cartitem.itemId.name)

            // add prop to the order
            await Order.findByIdAndUpdate({ _id: order[0].id }, { $push: { items: cartitem } }).session(session);
            //console.log("added to order " + cartitem.itemId.name)

            // remove prop from the user's cart
            await models.User.findByIdAndUpdate({ _id: userId }, { $pull: { cart: { _id: cartitem.id } } }).session(session);
            //console.log("removed from cart " + cartitem.itemId.name)

            // add cost of the prop to the total price for the order
            totalPrice += (cartitem.itemId.price * cartitem.quantity)
        }

        // Update the order price and depositAmount
        await Order.findByIdAndUpdate({ _id: order[0].id }, { price: totalPrice }).session(session);

        depositAmount = totalPrice * (config.depositPercentage / 100.0);
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

        Order.findByIdAndUpdate(order[0].id, { paymentIntentId: paymentIntent.id, price: depositAmount }).session(session);



        // if every step completed successfully, finalize the transaction
        await session.commitTransaction();
        //console.log("transaction committed")
        result = { success: true, orderId: order[0]._id }
    } catch (error) {
        await session.abortTransaction();
        //console.log("transaction failed")
        result = { success: false, error: error }
    } finally {
        session.endSession();
        //console.log("session ended")
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

    if (admin){
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
                // check to see if this item has already been scanned
                scanned = 0
                if (item.instanceId) {
                    for (const inst of item.itemId.instance) {
                        if (inst.order) {
                            if (inst.order.toString() === req.params.orderId) {
                                if (item.instanceId.toString() === inst.id.toString()) {
                                    scanned += 1
                                }
                            }
                        }
                    }
                }
                if (scanned > 0) { // integer instead of a bool for when multiple quantites are being scanned
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
    } else {
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
            let uniqueItems = [];
            // combine all quantities of the same prop
            for (const item of order.items) {
                unique = true
                for (const uniqueItem of uniqueItems) {
                    //console.log(item)
                    //console.log(uniqueItem)
                    if (item.itemId === uniqueItem.itemId) {
                        uniqueItem.quantity += 1
                        unique = false
                    }
                }
                if (unique) {
                    uniqueItems.push(item)
                }
            }

            numItems = order.items.length // count the number of items (including mutliple quantities)
            order.items = uniqueItems // replace order items with unique items
            order = order.toObject() // convert to object before next line or it won't save it (not part of original schema)
            order.numItems = numItems

            res.render("order.handlebars", {
                order: order,
                authenticated: authenticated,
                userId: userId,
                user: user,
                admin: admin
            });

        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    }
});

/** display all orders for a specific user */
router.get("/:userId/orders", isAdmin, async (req, res) => {
    try {
        let authenticated = req.isAuthenticated();
        let user = req.user.toObject();
        let userId = req.params.userId;
        let ordersNonObject = await Order.find({ user: userId }).populate("user").populate("items.itemId");

        let orders = [];
        ordersNonObject.forEach((order) => {
            let uniqueItems = [];
            // combine all quantities of the same prop
            for (const item of order.items) {
                unique = true
                for (const uniqueItem of uniqueItems) {
                    if (item.itemId === uniqueItem.itemId) {
                        uniqueItem.quantity += 1
                        unique = false
                    }
                }
                if (unique) {
                    uniqueItems.push(item)
                }
            }

            numItems = order.items.length // count the number of items (including mutliple quantities)
            order.items = uniqueItems // replace order items with unique items
            order = order.toObject() // convert to object before next line or it won't save it (not part of original schema)
            order.numItems = numItems
            orders.push(order)
        });
        res.render("orders.handlebars", {
            orders: orders,
            ordersLength: orders.length,
            authenticated:
                authenticated, user: user
        })
    } catch (error) {
        console.error(error);
        res.render("error.handlebars", { error: true, message: "Failed to get the order page for that user.", admin_user: true })
    }
});

/** admins setting an order status to in progress */
router.post("/:orderId/inProgress", isAdmin, async (req, res) => {
    let orderId = req.params.orderId;
    try {
        let order = await getOrder(orderId);
        order.status = "in progress";
        await order.save();
        req.flash("success", "state successfully changed");
        res.status(200).json({ message: "State changed successfully" });
    } catch (e) {
        res.render("error.handlebars", { error: true, message: "Failed to update the order status to 'in progress'", admin_user: true });
    }
});

/** admins setting an order status to complete */
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

/** admins setting an order status to pending */
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