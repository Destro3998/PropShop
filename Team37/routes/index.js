const express = require("express");
const router = express.Router();
const utilities = require("../utilities/dbUtilities.js");
const { CartItem, Configuration, User } = require("../utilities/models.js");
const { isAuth, isBlacklisted } = require("../utilities/authMiddleware.js");
const getProps = utilities.getProps;
const propExists = utilities.propExists;
const getProp = utilities.getProp;
const { sendCustomerMessageEmail } = require("../utilities/emails");
const sgMail = require('@sendgrid/mail');


require('dotenv').config();



router.get("/", (req, res) => {
	// Redirects to the store page
	res.redirect("/store")
});


router.get("/contact", async (req, res) => {
	class Company {
		constructor(address, email, phone, message) {
			this.address = address;
			this.email = email;
			this.phone = phone;
			this.message = message;
		}
	}

	try {
		let authenticated = req.isAuthenticated();
		let userId;
		let admin;

		if (req.user && req.user._id) {
			userId = req.user._id;
			admin = req.user.admin;
		} else {
			userId = undefined;
			admin = false;
		}

		let config = await Configuration.findOne();

		if (!config) {
			console.error("No configuration found in the database");
			res.render("error.handlebars", { error: true, message: "No configuration found in the database" });
			// return res.status(404).send("Configuration not found");
		}

		let company = new Company(config.companyAddress, config.companyEmail, config.companyPhone, config.siteMessage);
		console.log(company);

		res.render("contact.handlebars", {
			name: "Contact Page",
			contactActive: true,
			authenticated: authenticated,
			userId: userId,
			admin: admin,
			config: company
		});
	} catch (error) {
		console.log(error);
		// res.status(500).json({ message: "Internal server error" });
		res.render("error.handlebars", { error: true, message: "Internal Server Error" });
	}
});

/**
 * This route is for when the user submits the "Message Us" form on the contact page
 */
router.post("/contact", isBlacklisted, (req, res) => {

	// Send email to company with the user's message
	sendCustomerMessageEmail(req.body.name, req.body.email, req.body.business, req.body.message)
		.then(() => {
			console.log('Email sent successfully!');
			req.flash("success", "Message sent");
			res.redirect("/contact");
		})
		.catch((error) => {
			console.error('Error sending email:', error);
			req.flash("error", "Error: failed to send message")
			res.redirect("/contact");
		})
});


/**
 * This route is for the store page.
 * It is async because it has an await statement.
 * This await gets the props from the database and displays them
 */
router.get("/store", async (req, res) => {
	// Pagination logic from sam branch
	let skip = parseInt(req.query.skip) || 0;
	let limit = parseInt(req.query.limit) || 10;

	// Retrieve props using pagination
	let props = await getProps(skip, limit);

	// Authentication and userId logic from main branch
	let authenticated = req.isAuthenticated();
	let userId;
	let admin;
	if (req.user && req.user._id) {
		userId = req.user._id;
		admin = req.user.admin;
	} else {
		userId = undefined;
		admin = false;
	}

	// Merged render from both branches
	res.render("store.handlebars", {
		name: "Catalogue",
		props: props,
		storeActive: true,
		authenticated: authenticated,
		userId: userId,
		admin: admin
	});
});

// add to cart
router.post("/cart/add/:propId", isAuth, isBlacklisted, async (req, res) => {
	let propId = req.params.propId;
	let quantity = 1;
	let authenticated = req.isAuthenticated();
	try {
		let exists = await propExists(propId);
		if (exists) {
			let prop = await getProp(propId);

			const cartItem = new CartItem({
				itemId: prop._id,
				quantity: quantity
			});



			if (authenticated) {
				if (!(alreadyInCart(req.user, propId))) {
					req.user.cart.push(cartItem);
					await req.user.save();
				}
				// add prop to user cart.
			} else {
				// if the user is unauthenticated their cart should be stored in local storage.
				// This should happen on the client-side
			}
			req.flash("success", `${prop.name}, quantity: ${quantity}`);
		} else {
			res.flash("error", "You attempted to add a non-existent item to your cart");
		}
		const newCartCount = req.user.cart.reduce((acc, item) => acc + item.quantity, 0);
		res.json({ success: true, newCartCount: newCartCount });

	} catch (error) {
		console.error(error);
		res.status(500).send("internal Server Error");
	}
});



router.get("/api/authenticated", (req, res) => {
	if (req.isAuthenticated()) {
		res.json({ authenticated: true });
	} else {
		res.json({ authenticated: false });
	}
});

router.get("/api/get-userId", isAuth, (req, res) => {
	res.json({ id: req.user._id });
})


// get item stored in cart

router.get("/cart", isBlacklisted, async (req, res) => {
	let authenticated = req.isAuthenticated();
	let userId;
	let admin;

	let detailedCart = [];
	console.log(req.session);

	if (authenticated && req.user && req.user._id) {
		userId = req.user._id;
		admin = req.user.admin;

		// get the prop from the database if user is authenticated
		let userCart = req.user.cart;

		for (let item of userCart) {
			let prop = await getProp(item.itemId);
			detailedCart.push({
				item: prop,
				quantity: item.quantity
			});
		}
	} else {
		// check if prop stored in the local session if user not authenticated
		if (req.session.cart) {
			detailedCart = req.session.cart;
		}
	}

	try {
		const config = await Configuration.findOne({});
		const depositPercentage = config ? config.depositPercentage : 10;

		res.render("cart.handlebars", {
			name: "My Cart",
			cartItems: JSON.stringify(detailedCart),
			cartActive: true,
			authenticated: authenticated,
			userId: userId,
			admin: admin,
			depositPercentage: depositPercentage
		});
	} catch (error) {
		console.error("Error:", error);
		res.status(500).send("Internal Server Error");
	}
});


router.get("/api/getCartCount", async (req, res) => {
	let count = 0;

	if (req.isAuthenticated()) {
		const userCart = req.user.cart;
		count = userCart.reduce((acc, item) => acc + item.quantity, 0);
	} else {
		count = req.session.cart ? req.session.cart.length : 0;
	}

	res.json({ count });
});



router.get("/api/getProp/:propId", async (req, res) => {
	try {
		const propId = req.params.propId;
		const prop = await getProp(propId);
		if (prop) {
			res.json(prop);
		} else {
			res.status(404).send('Prop not found');
		}
	} catch (error) {
		console.error(error);
		res.status(500).send("Internal Server Error");
	}
});


router.post("/cart/clear", isAuth, async (req, res) => {
	if (req.isAuthenticated()) {
		try {
			await User.findOneAndUpdate({ _id: req.user._id }, { cart: [] });
			res.json({ message: "Cart successfully cleared" });
		} catch (error) {
			console.error(error);
			res.status(500).json({ message: "Internal Server Error" });
		}
	} else {
		res.status(401).json({ message: "User not authenticated" });
	}
});


router.post("/cart/remove/:propId", isAuth, async (req, res) => {
	let propId = req.params.propId;
	try {
		let user = req.user;
		for (let index = 0; index < user.cart.length; index++) {
			const element = user.cart[index];
			if (element.itemId.toString() === propId.toString()) {
				user.cart.splice(index, 1);
				await user.save();
			}
		}
		await user.save();
		res.status(200).json("success");
	} catch (error) {
		res.render("error.handlebars", { error: true, message: "Error attempting to delete item from cart" })
	}
});


// for updating deposit percentage
router.post('/update-deposit-percentage', async (req, res) => {
	const depositPercentage = req.body.depositPercentage;
	await Configuration.updateOne({}, { depositPercentage: depositPercentage });
	req.flash("success", "Setting successfully updated");
	res.redirect('/admin/config');
});


// This allows other files to import the router
module.exports = router;

function alreadyInCart(user, itemId) {
	for (let i = 0; i < user.cart.length; i++) {
		if (user.cart[i]._id === itemId) {
			user.cart[i].quantity += 1;
			return true;
		}
	}
	return false;
}