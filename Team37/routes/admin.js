const express = require("express")
const router = express.Router();
const models = require("../utilities/models.js");
const {isAdmin, isAuth, isBlacklisted} = require("../utilities/authMiddleware.js");
const {getProps, getUsers, getOrders, searchProps, getDisplayUsers} = require("../utilities/dbUtilities.js")
const { Configuration, User } = require('../utilities/models'); 
const fs = require("fs"); // for editing filenames
const multer = require("multer"); // for file upload


const imagedir = './public/3dmodels'; // file location to store/retrieve 3d models and images from
var storage = multer.diskStorage({ // setting up file uploads
	destination: function (req, file, cb) {
		cb(null, imagedir)
	},
	filename: function (req, file, cb) {
		cb(null, Date.now() + file.originalname) // add date.now() to make uploaded props have unique file names and to not risk getting mixed up in the folder
	}
})
var upload = multer({storage: storage})

/**
 * isAdmin: This checks whether the user trying to access this route is an admin. if they are not their access is denied
 * This function is async because we have await statements within in
 */

router.get("/dashboard", isAdmin, isBlacklisted, async (req, res) => {
	let authenticated = req.isAuthenticated();
	try {
		let props = await getProps(); // this has to be asynchronous because it is a database operation. (the function returns a promise)
		let users = await getUsers(); // this has to be asynchronous because it is a database operation. (the function returns a promise)
		let orders = await getOrders();
		let displayUsers = await getDisplayUsers();
		// let props = await models.Prop.find();
        // props = props.map(prop => prop.toObject()); // Convert each Mongoose document to a plain object
		
		const userId = req.user && req.user._id ? req.user._id : undefined;
		res.render("dashboard.handlebars", {
			props: props,
			users: users,
			authenticated: authenticated,
			userId: userId, 
			ordersLength: orders.length, 
			displayUsers: displayUsers
		}); // The options are variables that we are passing to our rendering engine (handlebars)
	} catch (error) {
		console.error(error);
	}

});

// rendering the page
router.get("/add-prop", isAdmin, (req, res) => {
	let authenticated = req.isAuthenticated();
	let userId;
	if (req.user && req.user._id) {
		userId = req.user._id;
	} else {
		userId = undefined;
	}
	let admin;
	if (req.user && req.user.admin) {
		admin = req.user.admin;
	} else {
		admin = false;
	}
	res.render("addProp.handlebars", {authenticated: authenticated, userId: userId, admin: admin});
});

// rendering the page
router.get("/add-user", isAdmin, (req, res) => {
	let authenticated = req.isAuthenticated();
	let userId;
	if (req.user && req.user._id) {
		userId = req.user._id;
	} else {
		userId = undefined;
	}
	let admin;
	if (req.user && req.user.admin) {
		admin = req.user.admin;
	} else {
		admin = false;
	}
	res.render("addUser.handlebars", {authenticated: authenticated, userId: userId, admin:admin});
});


// this is used by the form submission
router.post("/add-prop", isAdmin, upload.fields([{name: 'image', maxCount: 1}, {
	name: 'model3d',
	maxCount: 1
}]), function (req, res) {
	authenticated = req.isAuthenticated();

	// req.files holds the image(s)
	// req.body will hold the text fields

	// CHECK IF IMAGES/3D MODELS WERE UPLOADED FIRST
	if (req.files.model3d !== undefined) {
		filename3d = req.files.model3d[0].filename
	} else {
		filename3d = null
	}
	if (req.files.image !== undefined) {
		filenameimg = req.files.image[0].filename

	} else {
		// it would be a good idea later to have a default image to assign to this variable 
		// like a jpg that says "no image available" stored in the same folder
		// like this:
		// filenameimg = "default.jpg"
		filenameimg = null
	}
	try {

		instances = []
		for (let i = 0; i < req.body.quantity; i++){
			let newInstance = {
				status: "available",
				rentHistory: [],
			};
			instances.push(newInstance)
		}

		models.Prop.create({ // this creates entries in the database
			name: req.body.name,
			description: req.body.description,
			quantity: req.body.quantity,
			status: "available", // TESTING -- REMOVE THIS LATER
			image: filenameimg,
			model3d: filename3d,
			price: req.body.price,
			instance: instances
		});
	} catch (error) {
		console.log(error)
	}
	res.status(200);
	res.redirect("/admin/dashboard"); // send the user back to the dashboard -- this assumes that adding props can only be done by admins.
});

// Render Configuration page
router.get("/config", isAdmin, async (req, res) => {

    let config = await Configuration.findOne();
    res.render("config.handlebars", { config });
});

// Handle Configuration form submission
router.post("/config", isAdmin, async (req, res) => {
    try {
        let config = await Configuration.findOne();
        
        config.siteMessage = req.body['site-message'];
        config.companyAddress = req.body['company-address'];
        config.companyEmail = req.body['company-email'];
        config.companyPhone = req.body['company-phone'];
        await config.save();
		req.flash("success", "Setting successfully updated");
        res.redirect("/admin/config"); 
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
		}
});


// Dashboard User Search

router.get("/search-users", isAdmin, async (req, res) => {
    const searchTerm_1 = req.query.q;
    try {
        let users = await getUsers(searchTerm_1);
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json([]);
    }
});

// Dashboard Prop Search

router.get('/search-props', async (req, res) => {
    try {
        const searchTerm = req.query.q;
        const results = await searchProps(searchTerm);
        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post("/dashboard/:userId/blacklist", isAdmin, async (req, res) =>{
	let userId = req.params.userId;
	try {
		let user = await User.findById(userId);
		// console.log("user: ", user);
		// console.log("User blacklisted", user.blacklisted);

		user.blacklisted = !user.blacklisted;
		await user.save();

		if (user.blacklisted === true) {
			req.flash("success", "User Blacklisted");
			res.status(200).json({message:"User Un-Blacklisted"});
		}
		else if (user.blacklisted === false) {
			req.flash("success", "User Un-Blacklisted");
			res.status(200).json({message:"User Blacklisted"});
		}
		else{
			req.flash("error", "Blacklist operation failed");
			res.status(500).json({message:"Internal Server Error"});
		}
	}catch (error){
		console.log(error);
		req.flash("error", "Blacklist operation failed");
		res.status(500).json({message:"Internal Server Error"})
	}
});



// This allows other files to import the router
module.exports = router;
