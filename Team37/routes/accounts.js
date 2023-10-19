const express = require("express");
const passport = require("passport");
const {isAuth} = require("../utilities/authMiddleware");
const {DisplayUser} = require("../utilities/dbUtilities");
const generatePassword = require("../utilities/password").generatePassword;
const User = require("../utilities/models").User;

const router = express.Router();


/**
 * This is a route for registering users
 */
router.get("/register", (req, res, next) => {
	authenticated = req.isAuthenticated(); // This method checks if there is an authenticated user on the site at the moment
	if (authenticated) { // if the user is authenticated they should not be able to register.
		res.redirect("/");
	}
	res.render("register.handlebars", {name: "Register Page", registerActive: true, authenticated: authenticated});
});

router.post("/register", async (req, res, next) => {
	const password = req.body.password;
	const passwordReEnter = req.body.passwordReEnter;
	const email = req.body.email;
	try {
		const existingUser = await User.findOne({email}); // checking if a user with that email already exists
		if (existingUser) {
			req.flash("error", "That email is already in use");
			return res.redirect("/accounts/register"); // send them back to the register page to start the process again
		}


		if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[!@#$%^&*]/.test(password)) {
			// testing if the password conforms to the rules
			if (password === passwordReEnter) {
				const saltHash = generatePassword(req.body.password);

				const salt = saltHash.salt;
				const hash = saltHash.hash;


				const newUser = new User({
					email: req.body.email,
					fname: req.body.fname,
					lname: req.body.lname,
					phone: req.body.phone,
					hash: hash,
					salt: salt,
					admin: true
				});

				newUser.save() // saving the user to the database (using a promise)
					.then((user) => {
						console.log(user);
					});
				req.flash("success", "Registered Successfully");
				res.redirect("/accounts/login")

			} else {
				res.status(400).json({message: "The entered password does not match teh re-entered password"});
			}

		} else {
			req.flash("error", "This password does not meet standards.");
			res.status(400).json({message: "This password does not meet standards."});
		}

	} catch (error) {
		console.log("Error registering user: ", error);
		return res.status(500).json({message: 'Internal server error.'});
		// these error messages will need to be cleaned up at some point
	}
	// Most of these backend checks should not be initiated because there are frontend checks that do the same thing


});

/**
 * This is a route for logging users in
 */
router.get("/login", (req, res, next) => {
	authenticated = req.isAuthenticated();
	if (authenticated) { // If the user is already authenticated they should not be able to visit the login page
		res.redirect("/");
	}
	res.render("login.handlebars", {name: "Login Page", loginActive: true, authenticated: authenticated});
});

router.post("/login", passport.authenticate("local", { // this method passport.authenticate is used to check a user's entered credentials and log them in
	// this also creates a new session and attaches that sessionId to teh cookie
	failureRedirect: "/accounts/login",
	successRedirect: "/",
	failureFlash: "Failed to login.", // this is a message that is flashed to the user
	successFlash: "Successfully logged in." // this is a message that is flashed to teh user
}));

/**
 * This route logs a user out
 */
router.get("/logout", isAuth, (req, res, next) => {
	req.logout((err) => {
		if (err) {
			return next(err);
		}
		req.flash("success", "Logged out Successfully");
		res.redirect("/");
	});
});

/**
 * This method is used to get the user's account page based on their user id
 */
router.get("/:userId", isAuth, (req, res, next) => {
	authenticated = req.isAuthenticated();
	user = req.user;
	displayUser = new DisplayUser(user._id, user.email, user.fname, user.lname, user.phone); // using a class to display the user's information.
	// this class is used because handlebars is not allowed to access values from the request by default.
	// probably for safety reasons
	const userId = req.user && req.user._id ? req.user._id : undefined;
	res.render("account.handlebars", {
		accountActive: true,
		authenticated: authenticated,
		userId: userId,
		displayUser: displayUser
	});
});

// This allows other files to import the router
module.exports = router;