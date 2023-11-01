const express = require('express');
const router = express.Router();
const { Configuration } = require('../utilities/models');



router.get("/contact", async (req, res) => {
    try {
        let config = await Configuration.findOne();
        if (!config) {
            console.error("No configuration found in the database");
            return res.status(404).send("Configuration not found");
        }
        res.render("contact.handlebars", { config });
    } catch (error) {
        console.error("Error fetching configuration:", error);
        res.status(500).send("Internal Server Error");
    }
});




module.exports = router;

