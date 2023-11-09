const express = require("express");
const router = express.Router();
const models = require("../utilities/models.js");
const {isAdmin, isAuth} = require("../utilities/authMiddleware.js");
const { getOrders, getOrder, DisplayOrder } = require("../utilities/dbUtilities.js");

const mongoose = require("mongoose");


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
router.post('/new-order/:userId', async function (req, res) {
    authenticated = req.isAuthenticated();

    try {
        orderId = await newOrderTransaction(req.params.userId)
    } catch (error) {
        console.log(error)
    }
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
    if (!orderId) { // if transaction failed
        res.status(500);
        res.send()
        res.redirect("/store");
    } else {
        res.status(200);
        res.redirect("/store"); // TODO: change this to route to the order page? or some success screen
        //res.redirect(`/orders/${orderId}`) // THIS DOES NOT WORK 
    }
})


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
async function newOrderTransaction(userId) {

    // start transaction session
    const session = await mongoose.startSession();
    session.startTransaction();

    var order;
    try { 
        // create order 
        let order = await models.Order.create([{
            //price: req.body.price, //TODO: handle other attributes
            // don't need to handle other attributes because the schema defaults suffice in this case
            user: userId,
        }], {session: session}); // set the session for this operation so that it remains isolated to this transaction

        //console.log(order[0])
        //console.log(order[0]._id)

        // get all the props referenced in the users cart
        let user = await models.User.findById(userId).populate('cart.itemId').session(session);

        //console.log(user)
        if (user.cart.length < 1) { // if cart is empty, abort transaction
            throw new Error("Attempting to reserve empty cart")
        }

        console.log(user.cart.length + " item(s) detected in cart")
        // go through items in user cart one by one,
        // checking if able to reserve, and then reserving
        for (const cartitem of user.cart) {
            console.log("reserving " + cartitem.itemId.name)
            
            // change status/quantity of prop in the store
            if (cartitem.itemId.status === "available"){ // first check if prop is available
                console.log("is available" + cartitem.itemId.name)
                if (cartitem.itemId.quantity > cartitem.quantity) { // if there is more than enough of this prop available
                    console.log("more than enough" + cartitem.itemId.name)
                    await models.Prop.findByIdAndUpdate(cartitem.itemId.id, {
                        quantity: cartitem.itemId.quantity-cartitem.quantity // just lower the number of available props
                    }).session(session);
                    
                } else if (cartitem.itemId.quantity === cartitem.quantity) { // if there is only the exact amount available
                    console.log("just enough" + cartitem.itemId.name)
                    await models.Prop.findByIdAndUpdate(cartitem.itemId.id, { // set to reserved status
                        quantity: 0,
                        status: "reserved"
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

        }

        //** TODO: add payment processing step here */

        // if every step completed successfully, finalize the transaction
        await session.commitTransaction();
        console.log("transaction committed")
    } catch {
        await session.abortTransaction();
        console.log("transaction failed")
        session.endSession();
        return null
    } finally {
        session.endSession();
        console.log("session ended")
        return 1
    }
}


/** gets a specific order from the database */
router.get('/:orderId', async function (req, res) {
    let orderId = req.params.orderId;
    let order_model = await getOrder(orderId);

    // TODO: code for constructing a DisplayOrder object should go here, once created in dbUtilities.js
    let order = new DisplayOrder(order_model);
	let userId;
	if (req.user && req.user._id) {
		userId = req.user._id;
	} else {
		userId = undefined;
	}
	console.log(order)
	res.render("order.handlebars", {order: order, authenticated: authenticated, userId: userId});
});

module.exports = router;
