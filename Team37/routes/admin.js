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
    try {
        // Prop Logic from both branches
        let props = await models.Prop.find();
        props = props.map(prop => prop.toObject()); // Convert each Mongoose document to a plain object
        let totalPropsCount = await models.Prop.countDocuments(); // Fetch total prop count from sam branch

        // Users Logic from main branch
        let users = await getUsers();

        // Authentication and userId logic from main branch
        const authenticated = req.isAuthenticated();
        const userId = req.user && req.user._id ? req.user._id : undefined;

        res.render("dashboard.handlebars", {
            name: "Dashboard Page",
            props: props,
            users: users,  // from main branch
            totalPropsCount: totalPropsCount, // from sam branch
            authenticated: authenticated,  // from main branch
            userId: userId    // from main branch
        });
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
			quantity: req.body.quantity
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

// This allows other files to import the router
module.exports = router;