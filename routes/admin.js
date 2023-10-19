const express = require("express")
const router = express.Router();
const path = require("path");
const models = require("../utilities/models.js");
const utilities = require("../utilities/utilities.js");
const getProps = utilities.getProps;


router.get("/dashboard", async (req, res) => {
    try {
        let props = await models.Prop.find(); 
		props = props.map(prop => prop.toObject()); // Convert each Mongoose document to a plain object
        let totalPropsCount = await models.Prop.countDocuments(); // Fetch total prop count

        let clients = [
            // ... your dummy client objects ...
			{name: "Client1", email: "email@email.com", hasOrders: true},
			{name: "Client2", email: "email@email.ca", hasOrders: false},
			{name: "Client3", email: "email@email.za", hasOrders: false},
			{name: "Client4", email: "email@email.us", hasOrders: false},
			{name: "Client5", email: "email@email.au", hasOrders: false},
			{name: "Client6", email: "email@email.onion", hasOrders: false},

        ];

        res.render("dashboard.handlebars", {
            name: "Dashboard Page", 
            props: props, 
            clients: clients,
            totalPropsCount: totalPropsCount  // Pass the count to the view
        });
    } catch (error) {
        console.error(error);
    }
});



// rendering the page
router.get("/add-prop", (req, res) => {
	res.render("addProp.handlebars");
});


// this is used by the form submission
router.post("/add-prop", (req, res) => {
	try {
		models.Prop.create({ // this creates entries in the database
			name: req.body.name,
			description: req.body.description,
			quantity: req.body.quantity
		});
	} catch (error) {
		console.log(error)
	}
	res.status(200);
	res.redirect("/admin/dashboard"); // send the user back to the dashboard -- this assumes that adding props can only be done by admins.
});

// This allows other files to import the router
module.exports = router;