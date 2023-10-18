const express = require("express");
const router = express.Router();
const utilities = require("../utilities/dbUtilities.js");
const {CartItem} = require("../utilities/models.js");
const getProps = utilities.getProps;
const propExists = utilities.propExists;
const getProp = utilities.getProp;


router.get("/", (req, res) => {
	authenticated = req.isAuthenticated();

	let userId;
	if (req.user && req.user._id) {
		userId = req.user._id;
	} else {
		userId = undefined;
	}
	res.render("index.handlebars", {
		name: "Index Page",
		homeActive: true,
		authenticated: authenticated,
		userId: userId
	});
});


router.get("/about", (req, res) => {
	authenticated = req.isAuthenticated();
	let userId;
	if (req.user && req.user._id) {
		userId = req.user._id;
	} else {
		userId = undefined;
	}
	res.render("about.handlebars", {
		name: "About Page",
		aboutActive: true,
		authenticated: authenticated,
		userId: userId
	});
});

router.get("/contact", (req, res) => {
	authenticated = req.isAuthenticated();
	let userId;
	if (req.user && req.user._id) {
		userId = req.user._id;
	} else {
		userId = undefined;
	}
	res.render("contact.handlebars", {
		name: "Contact Page",
		contactActive: true,
		authenticated: authenticated,
		userId: userId
	});
});

/**
 * This route is for the store page.
 * It is async because it has an await statement.
 * This await gets the props from the database and displays them
 */
router.get("/store", async (req, res) => {
	authenticated = req.isAuthenticated();
	let props = await getProps();
	let userId;
	if (req.user && req.user._id) {
		userId = req.user._id;
	} else {
		userId = undefined;
	}
	res.render("store.handlebars", {
		name: "Catalogue",
		props: props,
		storeActive: true,
		authenticated: authenticated,
		userId: userId
	});
});

router.get("/cart/add/:propId/:quantity", async (req, res) => {
	propId = req.params.propId;
	quantity = req.params.quantity;
	authenticated = req.isAuthenticated();
	exists = await propExists(propId);
	try {
		if (exists) {
			prop = await getProp(propId);

			const cartItem = new CartItem({
				itemId: prop._id,
				quantity: quantity
			});

			if (authenticated) {
				req.user.cart.push(cartItem);
				await req.user.save();
				// add prop to user cart.
			} else {
				// if the user is unauthenticated their cart should be stored in local storage.
				// This should happen on the client-side
			}
			req.flash("success", `${prop.name}, quantity: ${quantity}`);
		} else {
			res.flash("error", "You attempted to add a non-existent item to your cart");
		}
		res.redirect("/store");
	} catch (error) {
		console.error(error);
		res.status(500).send("internal Server Error");
	}

});


// This allows other files to import the router
module.exports = router;