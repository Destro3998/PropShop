const express = require("express")
const router = express.Router();
const path = require("path")
const utilities = require("../utilities/utilities.js");
const getProps = utilities.getProps;


router.get("/", (req, res) => {
	res.render("index.handlebars", {name: "Index Page", homeActive:true});
});

router.get("/about", (req, res) => {
	res.render("about.handlebars", {name: "About Page", aboutActive:true});
});

router.get("/contact", (req, res) => {
	res.render("contact.handlebars", {name: "Contact Page", contactActive:true});
});

router.get("/store", async (req, res) => {
	let props = await getProps();
	res.render("store.handlebars", {name: "Catalogue", props:props, storeActive:true});
});

// This allows other files to import the router
module.exports = router;