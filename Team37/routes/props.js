const express = require("express");
const router = express.Router();
const models = require("../utilities/models.js");
const DisplayProp = require("../utilities/utilities");


// "/:propId" this syntax allows for any value that follows the "/" to be read as the propId
router.get("/:propId", async (req, res) => {
	let propId = req.params.propId; // getting the propId from the url
	let prop_model = await models.Prop.findById(propId);
	let prop = new DisplayProp(prop_model.id, prop_model.name, prop_model.description, prop_model.quantity);
	res.render("prop.handlebars", {prop: prop});
});

// This route is a combination of the get and post requests.
// async because it interacts with the database
router.route("/:propId/edit")
	.get(async (req, res) => { // rendering the page
		let redirectUrl = req.header('referer') || '/';
		let propId = req.params.propId;
		let prop_model = await models.Prop.findById(propId);
		let prop = new DisplayProp(prop_model.id, prop_model.name, prop_model.description, prop_model.quantity);
		res.render("editProp.handlebars", {prop: prop, propId: propId});
	})
	.post(async (req, res) => { // this is used by the form submission
		let propId = req.params.propId;
		const redirectUrl = req.redirectUrl || "/admin/dashboard"; // redirect url is either the url that the user has come from or "/admin/dashboard" url
		try {
			let thisProp = await models.Prop.findById(propId);
			await models.Prop.findByIdAndUpdate(thisProp.id, {
				name: req.body.name,
				description: req.body.description,
				quantity: req.body.quantity
			});
		} catch (error) {
			console.error(error);
			res.status(500);
		}
		res.status(200); // everything went well
		res.redirect(redirectUrl);
	});

router.get("/:propId/delete", async (req, res) => {
	let propId = req.params.propId;
	let redirectUrl = req.header('referer') || '/'; // redirect url is either the url that the user has come from or the root url
	try {
		await models.Prop.findByIdAndDelete(propId);
		res.redirect(redirectUrl);
	} catch (error) {
		console.error(error);
		res.status(500);
	}
});

// This allows other files to import the router
module.exports = router;