const express = require("express");
const router = express.Router();
const utilities = require("../utilities/dbUtilities.js");
const {CartItem, Configuration} = require("../utilities/models.js");
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
	// res.render("index.handlebars", {
	// 	name: "Index Page",
	// 	homeActive: true,
	// 	authenticated: authenticated,
	// 	userId: userId
	// });

	res.redirect("/store")
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

router.get("/contact", async (req, res) => {
	class Company{

		constructor(address, email, phone, message) {
			this.address = address;
			this.email = email;
			this.phone = phone;
			this.message = message;
		}
	}

	try{
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
        console.log(config);
        let company = new Company(config.companyAddress, config.companyEmail, config.companyPhone, config.siteMessage);
        if (!config) {
            console.error("No configuration found in the database");
            return res.status(404).send("Configuration not found");
        }
		console.log(company);
		res.render("contact.handlebars", {
			name: "Contact Page",
			contactActive: true,
			authenticated: authenticated,
			userId: userId,
			admin:admin, 
			config:company
		});
	} catch (error){
		console.log(error);
		res.status(500).json({message:"Internal server error"});
		res.redirect("/")
	}

	
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


// get item stored in cart

router.get("/cart", isAuth, async (req, res) => {
    let authenticated = req.isAuthenticated();
    let userId;
    let admin;

    if (req.user && req.user._id) {
        userId = req.user._id;
        admin = req.user.admin;
    } else {
        // If there's no user object, the user isn't authenticated. Redirect them.
        return res.redirect("/login"); // Redirect to login or some other page as per your setup
    }

    try {
        let userCart = req.user.cart; // Assuming cart is an array in the user model
        
        // If you want detailed cart items instead of just references:
        let detailedCart = [];
        for (let item of userCart) {
            let prop = await getProp(item.itemId);
            detailedCart.push({
                item: prop,
                quantity: item.quantity
            });
        }

        res.render("cart.handlebars", {
            name: "My Cart",
            cartItems: detailedCart,
            cartActive: true, 
            authenticated: authenticated,
            userId: userId,
            admin: admin
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
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

// This allows other files to import the router
module.exports = router;
