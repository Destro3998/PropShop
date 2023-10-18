const express = require("express");
const router = express.Router();
const utilities = require("../utilities/dbUtilities.js");
const getProps = utilities.getProps;


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

// This allows other files to import the router
module.exports = router;