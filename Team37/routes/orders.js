const express = require("express");
const router = express.Router();
const models = require("../utilities/models.js");
const utilities = require("../utilities/dbUtilities.js");
const {isAdmin, isAuth} = require("../utilities/authMiddleware.js");
const getProps = utilities.getProps;
const getOrders = utilities.getOrder;
const DisplayProp = utilities.DisplayProp;
const DisplayOrder = utilities.DisplayOrder;


/**
 *  proposed file for handling/tracking orders/reservations
 *  
 *  not routed yet.
 * 
 * 
 */


/** get all orders in the database, for admin dashboard */
router.get('/admin/all', isAdmin, async function (req, res) {
    let all_orders = await getOrders(skip, limit);

    /* code below assumes an implementation of a separate page for all orders on the dashboard,
    so this code would not apply if the order list is integrated into the main dashboard page */
    /*
    res.render("orders.handlebars", {
		name: "Orders",
		orders: all_orders,
		authenticated: authenticated,
		userId: userId,
	});*/
})


/** 
 * creates new order on checkout
 */
router.post('/new-order/:userId', async function (req, res) {

	authenticated = req.isAuthenticated();

    let user = await models.User.findById(req.params.userId); // get the user placing the order
    try {
        models.Order.create({
            price: req.body.price,
	        datePlaced: req.body.date,
	        status: req.body.status,
	        user: user,
	        items: user.cart // might be better to go through the cart items one by one, calling reserve and then adding to the order
        })                      // (incase one or more items have become unavailable since adding to cart)
                                    // this would be done in this route method, but after already constructing the order
    } catch (error) {
        console.log(error)
}   
    res.status(200);
    res.redirect("/store"); // TODO: change this to route to the order page? or some success screen
})


/** gets a specific order from the database */
router.get('/:orderId', async function (req, res) {
    let order_model = await models.Order.findById(req.params.orderId)

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
})