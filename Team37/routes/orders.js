const express = require("express");
const router = express.Router();
const models = require("../utilities/models.js");
const utilities = require("../utilities/dbUtilities.js");
const {isAdmin, isAuth} = require("../utilities/authMiddleware.js");
const getProps = utilities.getProps;
const DisplayProp = utilities.DisplayProp;


/**
 *  proposed file for handling/tracking orders/reservations
 *  
 *  not routed yet.
 * 
 * 
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

router.get('/:orderId', async function (req, res) {
    let order = await models.Order.findById(req.params.orderId)

    // TODO: code for constructing a DisplayOrder object should go here, once created in dbUtilities.js
})