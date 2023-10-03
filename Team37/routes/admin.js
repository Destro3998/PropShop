const express = require("express")
const router = express.Router();
const path = require("path");

router.get("/dashboard", (req, res) => {
	let props = ["first", "second", "third", "fourth", "prop1", "prop2", "prop2", "second last", "last"]
	let clients = ["Dylan", "Clint", "Sukhman", "Shubham", "Noah", "Theo"]
	res.render("dashboard.handlebars", { name: "Dashboard Page", props: props, clients: clients });
});

router.get("/add-prop", (req, res) => {
	res.render("addProp.handlebars");
})

router.post("/add-prop", (req, res) => {
	console.log(req.body);
	res.status(200)
	res.redirect("/admin/dashboard");
});

router.get("/add-client", (req, res) => {
	res.render("addClient.handlebars");
})

router.post("/add-client", (req, res) => {
	console.log(req.body);
	res.status(200)
	res.redirect("/admin/dashboard");
});


module.exports = router;