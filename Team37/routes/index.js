const express = require("express");
const router = express.Router();
const utilities = require("../utilities/dbUtilities.js");
const {CartItem} = require("../utilities/models.js");
const {isAuth} = require("../utilities/authMiddleware.js");
const getProps = utilities.getProps;
const propExists = utilities.propExists;
const getProp = utilities.getProp;


router.get("/", (req, res) => {
	let authenticated = req.isAuthenticated();

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
	let authenticated = req.isAuthenticated();
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
	let authenticated = req.isAuthenticated();
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
	// Pagination logic from sam branch
	let skip = parseInt(req.query.skip) || 0;
	let limit = parseInt(req.query.limit) || 6;

	// Retrieve props using pagination
	let props = await getProps(skip, limit);

	// Authentication and userId logic from main branch
	let authenticated = req.isAuthenticated();
	let userId;
	if (req.user && req.user._id) {
		userId = req.user._id;
	} else {
		userId = undefined;
	}

	// Merged render from both branches
	res.render("store.handlebars", {
		name: "Catalogue",
		props: props,
		storeActive: true,
		authenticated: authenticated,  // from main branch
		userId: userId  // from main branch
	});
});


router.post("/cart/add/:propId", isAuth, async (req, res) => {
	let propId = req.params.propId;
	let quantity = 1;
	let authenticated = req.isAuthenticated();
	let exists = await propExists(propId);
	try {
		if (exists) {
			let prop = await getProp(propId);

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


router.get("/api/authenticated", (req, res) => {
	if (req.isAuthenticated()) {
		res.json({authenticated: true});
	} else {
		res.json({authenticated: false});
	}
});

router.get("/api/get-userId", isAuth, (req, res) =>{
	res.json({id:req.user._id});
})

// This allows other files to import the router
module.exports = router;