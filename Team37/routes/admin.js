const express = require("express")
const router = express.Router();
const models = require("../utilities/models.js");
const {isAdmin, isAuth, isBlacklisted} = require("../utilities/authMiddleware.js");
const {getProps, getUsers, getOrders, searchProps, getDisplayUsers} = require("../utilities/dbUtilities.js")
const { Configuration, User } = require('../utilities/models'); 
const fs = require("fs"); // for editing filenames
const multer = require("multer"); // for file upload


const imagedir = './public/images';
var storage = multer.diskStorage({ // setting up file uploads
	destination: function (req, file, cb) {
		cb(null, imagedir)
	},
	filename: function (req, file, cb) {
		cb(null, "logo.png") // this is being used to change the logo
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




// Render Configuration page
router.get("/config", isAdmin, async (req, res) => {

    let config = await Configuration.findOne();
    res.render("config.handlebars", { config });
});

router.post("/config/visual", isAdmin, upload.fields(
	[{name: 'logo', maxCount: 1}]),  //{name: 'landing', maxCount: 1 }]), 
	async (req, res) => {
	try {
		/*let config = await Configuration.findOne();
		if (req.files !== undefined){
			if (req.files.logo !== undefined) {
				config.logo = req.files.logo[0].filename 
			}
			if (req.files.landing !== undefined) {
				config.landing = req.files.landing[0].filename 
			}
		}
        await config.save();*/
		req.flash("success", "Logo successfully updated");
        res.redirect("/admin/config"); 
	} catch (error) {
	console.error(error);
	res.status(500).send("Internal Server Error");
	}
});

// Handle Configuration form submission
router.post("/config", isAdmin, async (req, res) => {
    try {
		console.log(req.body)
        let config = await Configuration.findOne();
        
        config.siteMessage = req.body['site-message'];
        config.companyAddress = req.body['company-address'];
        config.companyEmail = req.body['company-email'];
        config.companyPhone = req.body['company-phone'];

		/*console.log(req.files)
		if (req.files !== undefined){
			if (req.files.logo !== undefined) {
				config.logo = req.files.logo[0].filename 
			}
			if (req.files.landing !== undefined) {
				config.landing = req.files.landing[0].filename 
			}
		}*/
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
