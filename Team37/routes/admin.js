const express = require("express")
const router = express.Router();
const models = require("../utilities/models.js");
const {isAdmin, isAuth} = require("../utilities/authMiddleware.js");
const {getProps, getUsers} = require("../utilities/dbUtilities.js")

const imagedir = './public/3dmodels'; // file location to store/retrieve 3d models and images from
const fs = require("fs"); // for editing filenames
const multer = require("multer"); // for file upload
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

router.get("/dashboard", isAdmin, async (req, res) => {
	let authenticated = req.isAuthenticated();
	try {
		let props = await getProps(); // this has to be asynchronous because it is a database operation. (the function returns a promise)
		let users = await getUsers(); // this has to be asynchronous because it is a database operation. (the function returns a promise)
		// let props = await models.Prop.find();
        // props = props.map(prop => prop.toObject()); // Convert each Mongoose document to a plain object
		
		const userId = req.user && req.user._id ? req.user._id : undefined;
		res.render("dashboard.handlebars", {
			props: props,
			users: users,
			authenticated: authenticated,
			userId: userId
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
		models.Prop.create({ // this creates entries in the database
			name: req.body.name,
			description: req.body.description,
			quantity: req.body.quantity,
			price:req.body.price,
		}).then((prop, req, res) => {
			// this renames the files to match the id just created for the prop
			// (it would probably make more sense to just intially name it after the prop id
			// on upload, but i could only get the upload function to work before prop creation.
			// this could maybe be solved better by using serparate html forms for uploading the files
			// but i am keeping all prop creation within one form submission for now)

			if (filenameimg !== null) {
				extension1 = filenameimg.slice(filenameimg.lastIndexOf(".")) // get file extensions (will be useful if/when mutliple file types are accepted)
				fs.rename(imagedir + '/' + filenameimg, imagedir + '/' + prop._id + extension1, (err) => {
					if (err) throw err
				})
			}
			if (filename3d !== null) {
				extension2 = filename3d.slice(filename3d.lastIndexOf("."))
				fs.rename(imagedir + '/' + filename3d, imagedir + '/' + prop._id + extension2, (err) => {
					if (err) throw err
				})
			}
		});
	} catch (error) {
		console.log(error)
	}
	res.status(200);
	res.redirect("/admin/dashboard"); // send the user back to the dashboard -- this assumes that adding props can only be done by admins.
});

router.get("/dashboard/config", isAdmin, (req, res) => {
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
    res.render("config.handlebars", {
        authenticated:authenticated,
        userId:userId,
		admin: admin
        });
});

router.post("/dashboard/config", isAdmin, (req, res) => {
    req.flash("success", "Setting successfully updated");
    res.redirect("/admin/dashboard/config");
});

// This allows other files to import the router
module.exports = router;
