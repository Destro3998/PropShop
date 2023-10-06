const express = require("express")
const router = express.Router();
const path = require("path")

router.get("/", (req, res) => {
	res.render("index.handlebars", {name: "Index Page"});
});

router.get("/about", (req, res) => {
	res.render("about.handlebars", {name: "About Page"});
});

router.get("/contact", (req, res) => {
	res.render("contact.handlebars", {name: "Contact Page"});
});

router.get("/store", (req, res) => {
	res.render("store.handlebars", {name: "store Page"});
});

// This allows other files to import the router
module.exports = router;