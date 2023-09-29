const express = require("express")
const router = express.Router();
const path = require("path")

router.get("/:propId", (req, res) => {
	res.render("prop.handlebars", {name:"Prop Page"});
});


module.exports = router;