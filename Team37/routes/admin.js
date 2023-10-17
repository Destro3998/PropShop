const express = require("express")
const router = express.Router();
const models = require("../utilities/models.js");
const {isAdmin, isAuth} = require("../utilities/authMiddleware.js");
const {getProps, getUsers} = require("../utilities/dbUtilities.js")


/**
 * isAdmin: This checks whether the user trying to access this route is an admin. if they are not their access is denied
 * This function is async because we have await statements within in
 */
router.get("/dashboard", isAdmin, async (req, res) => {
	authenticated = req.isAuthenticated();
	try {
		let props = await getProps(); // this has to be asynchronous because it is a database operation. (the function returns a promise)
		let users = await getUsers(); // this has to be asynchronous because it is a database operation. (the function returns a promise)
		const userId = req.user && req.user._id ? req.user._id : undefined;
		res.render("dashboard.handlebars", {
			name: "Dashboard Page",
			props: props,
			users: users,
			authenticated: authenticated
			, userId: userId
		}); // The options are variables that we are passing to our rendering engine (handlebars)
	} catch (error) {
		console.error(error);
	}

});


// rendering the page
router.get("/add-prop", isAdmin, (req, res) => {
	authenticated = req.isAuthenticated();
	const userId = req.user && req.user._id ? req.user._id : undefined;
	res.render("addProp.handlebars", {authenticated: authenticated, userId: userId});
});


// this is used by the form submission
router.post("/add-prop", isAdmin, (req, res) => {
	authenticated = req.isAuthenticated();
	try {
		models.Prop.create({ // this creates entries in the database
			name: req.body.name,
			description: req.body.description,
			quantity: req.body.quantity
		});
	} catch (error) {
		console.log(error)
	}
	res.status(200);
	res.redirect("/admin/dashboard"); // send the user back to the dashboard -- this assumes that adding props can only be done by admins.
});

// This allows other files to import the router
module.exports = router;