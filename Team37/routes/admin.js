const express = require("express")
const router = express.Router();
const path = require("path")

router.get("/dashboard", (req, res) => {
	res.render("dashboard.handlebars", {name:"Dashboard Page"});
});


module.exports = router;