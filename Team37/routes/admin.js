const express = require("express")
const router = express.Router();
const path = require("path");
const models = require("../utilities/models.js");
const utilities = require("../utilities/utilities.js");
const getProps = utilities.getProps;

const imagedir = './public/3dmodels'; // file location to store/retrieve 3d models and images from
const fs = require("fs");
const multer = require("multer"); // for file upload
var storage = multer.diskStorage({ // setting location for file uploads
    destination: function (req, file, cb) {
      cb(null, imagedir)
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + file.originalname)
    }
})
var upload = multer({ storage: storage })
var getFields = multer()


router.get("/dashboard", async (req, res) => {
	try {
		let props = await getProps(); // this has to be asynchronous because it is a database operation. (the function returns a promise)
		let clients = [ // dummy client objects.
			{name: "Client1", email: "email@email.com", hasOrders: true},
			{name: "Client2", email: "email@email.ca", hasOrders: false},
			{name: "Client3", email: "email@email.za", hasOrders: false},
			{name: "Client4", email: "email@email.us", hasOrders: false},
			{name: "Client5", email: "email@email.au", hasOrders: false},
			{name: "Client6", email: "email@email.onion", hasOrders: false},
		]
		res.render("dashboard.handlebars", {name: "Dashboard Page", props: props, clients: clients}); // The options are variables that we are passing to our rendering engine (handlebars)
	} catch (error) {
		console.error(error);
	}

});


// rendering the page
router.get("/add-prop", (req, res) => {
	res.render("addProp.handlebars");
});


// this is used by the form submission
router.post("/add-prop", upload.single('image'), function (req, res) {
	// req.file holds the image(s)
	// req.body will hold the text fields
	filename = req.file.filename//console.log(JSON.stringify(req.file))
	try {
		prop = models.Prop.create({ // this creates entries in the database
			name: req.body.name,
			description: req.body.description,
			quantity: req.body.quantity
		}).then( (prop, req, res) => { 
			// this renames the file to match the id just created for the prop
			// (it would probably make more sense to just intially name it after the prop id
			// on upload, but i could only get the upload function to work before prop creation.
			// this could maybe be solved better by using serparate html forms for uploading the files
			// but i am keeping all prop creation within one form submission for now)
			extension = filename.slice(filename.lastIndexOf(".")) // get file extension of the image
			fs.rename(imagedir + '/' + filename, imagedir + '/' + prop._id + extension, (err) => {if (err) throw err})
		});
	} catch (error) {
		console.log(error)
	}
	res.status(200);
	res.redirect("/admin/dashboard"); // send the user back to the dashboard -- this assumes that adding props can only be done by admins.
  }) 


// This allows other files to import the router
module.exports = router;