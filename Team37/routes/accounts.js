const express = require("express")
const router = express.Router();
const path = require("path")

router.get("/register", (req, res) => {
	res.render("register.handlebars", {name:"Register Page"});
});

router.get("/login", (req, res) => {
	res.render("login.handlebars", {name:"Login Page"});
});

module.exports = router;