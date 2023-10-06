const express = require("express")
const router = express.Router();


/**
 * This is a route for registering users
 */
router.get("/register", (req, res) => {
	res.render("register.handlebars", {name: "Register Page"});
});

/**
 * This is a route for logging users in
 */
router.get("/login", (req, res) => {
	res.render("login.handlebars", {name: "Login Page"});
});

// This allows other files to import the router
module.exports = router;