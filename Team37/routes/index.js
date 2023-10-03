const express = require("express")
const router = express.Router();
const path = require("path")

router.get("/", (req, res) => {
	res.render("index.handlebars", { name: "Index Page" });
});

router.get("/about", (req, res) => {
	res.render("about.handlebars", { name: "About Page" });
});

router.get("/contact", (req, res) => {
	res.render("contact.handlebars", { name: "Contact Page" });
});

router.get("/store", (req, res) => {
	let props = [{ name: "first", image: "image" },
	{ name: "second", image: "image" },
	{ name: "third", image: "image" },
	{ name: "fourth", image: "image" },
	{ name: "last", image: "image" }];
	res.render("store.handlebars", { name: "Store Page", props: props });
});

module.exports = router;