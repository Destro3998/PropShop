const express = require("express");
const passport = require("passport");
const {isAuth, isBlacklisted} = require("../utilities/authMiddleware");
const {DisplayUser} = require("../utilities/dbUtilities");
const generatePassword = require("../utilities/password").generatePassword;
const User = require("../utilities/models").User;

const router = express.Router();

router.use(express.json());


/**
 * This is a route for registering users
 */
router.get("/register", (req, res) => {
	let authenticated = req.isAuthenticated(); // This method checks if there is an authenticated user on the site at the moment
	if (authenticated) { // if the user is authenticated they should not be able to register.
		res.redirect("/");
	}
	res.render("register.handlebars", {name: "Register Page", registerActive: true, authenticated: authenticated});
});

router.post("/register", async (req, res) => {
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
					admin: false,
					blacklisted: false
				});

				await newUser.save(); // saving the user to the database (using a promise)
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
router.get("/login", (req, res) => {
	let authenticated = req.isAuthenticated();
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
router.get("/:userId", isAuth, isBlacklisted, (req, res) => {
	let authenticated = req.isAuthenticated();
	let user = req.user;
	let orders = req.user.orders ? req.user.orders : undefined;

	let displayUser = new DisplayUser(user._id, user.email, user.fname, user.lname, user.phone); // using a class to display the user's information.
	// this class is used because handlebars is not allowed to access values from the request by default.
	// probably for safety reasons
	const userId = req.user && req.user._id ? req.user._id : undefined;
	res.render("account.handlebars", {
		accountActive: true,
		authenticated: authenticated,
		userId: userId,
		displayUser: displayUser,
		orders: orders
	});
});

router.post("/:userId/update-password", isAuth, async (req, res) => {
	const password = req.body.newPassword;
	const passwordReEnter = req.body.newPasswordReEnter;

	// TODO: Make the user enter their current password. And only allow the user to change their password of they give their current password.

	try {
		if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[!@#$%^&*]/.test(password)) {
			if (password === passwordReEnter) {
				const saltHash = generatePassword(password);
				const salt = saltHash.salt;
				const hash = saltHash.hash;

				await User.findOneAndUpdate({_id: req.user._id}, {hash: hash, salt: salt});
				req.flash("success", "Password updated successfully");
				res.status(200).json({message: "Password updated successfully"});
			} else {
				res.status(400).json({message: "Failed to update password"});
			}
		} else {
			req.flash("error", "Password does not meet requirements");
			res.status(400).json({error: "Passwords do not match"});
		}

	} catch (error) {
		console.error("Error: ", error);
	}

	req.flash("success", "Password updated successfully.");
});

router.post("/:userId/update-fname", isAuth, async (req, res) => {
	let newFname = req.body.fname;
	try {
		if (newFname === "") throw new Error("Updated Name Cannot be empty");
		await User.findOneAndUpdate({_id: req.user._id}, {fname: newFname});
		req.flash("success", "First Name updated successfully");
		res.status(200).json({message: "First Name updated successfully"});
	} catch (error) {
		res.status(400).json({error: error.message});
	}
});

router.post("/:userId/update-lname", isAuth, async (req, res) => {
	let newLname = req.body.lname;
	try {
		if (newLname === "") throw new Error("Updated Name Cannot be empty");
		await User.findOneAndUpdate({_id: req.user._id}, {lname: newLname});
		req.flash("success", "Last Name updated successfully");
		res.status(200).json({message: "Last Name updated successfully"});
	} catch (error) {
		res.status(400).json({error: error.message});
	}
});

router.post("/:userId/update-email", isAuth, async (req, res) => {
	let newEmail = req.body.email;
	// TODO: Check if a user with the same email exists. If yes, do not allow the user to change their email.
	// TODO: Validate the new password.
	try {
		if (newEmail === "") throw new Error("Updated Name Cannot be empty");
		await User.findOneAndUpdate({_id: req.user._id}, {email: newEmail});
		req.flash("success", "Email updated successfully");
		res.status(200).json({message: "Email updated successfully"});
	} catch (error) {
		res.status(400).json({error: error.message});
	}
});

router.post("/:userId/update-phone", isAuth, async (req, res) => {
	let newPhone = req.body.phone;
	try {
		if (newPhone === "") throw new Error("Updated Name Cannot be empty");
		await User.findOneAndUpdate({_id: req.user._id}, {phone: newPhone});
		req.flash("success", "Phone Number updated successfully");
		res.status(200).json({message: "Phone Number updated successfully"});
	} catch (error) {
		res.status(400).json({error: error.message});
	}
});


// This allows other files to import the router
module.exports = router;