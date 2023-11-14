const express = require("express");
const router = express.Router();
const models = require("../utilities/models.js");
const utilities = require("../utilities/dbUtilities.js");
const {isAdmin} = require("../utilities/authMiddleware.js");
const getProps = utilities.getProps;
const DisplayProp = utilities.DisplayProp;
const qrCode = require('qrcode');


// load-more functionality
router.get('/loadmore', async (req, res) => {
    let limit = parseInt(req.query.limit) || 6;  // Default to 6 if not provided
    let skip = parseInt(req.query.skip) || 0;     // Default to 0 if not provided

    try {
        let props = await models.Prop.find().skip(skip).limit(limit);
        
        let displayProps = [];  // Convert the mongoose documents to Display Prop objects
        props.forEach(prop => {
            displayProps.push(new DisplayProp(prop._id, prop.name, prop.description, prop.quantity, prop.price));
        });

        res.json(displayProps);
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
});


// search functionality from database query
router.get('/search', async (req, res) => {
	let authenticated = req.isAuthenticated();
    const searchQuery = req.query.q; //extract query
    try {
        let props = await models.Prop.find({  // Database search
            $or: [
                { name: new RegExp(searchQuery, 'i') },
                { description: new RegExp(searchQuery, 'i') }
            ]
        });

        let displayProps = [];  // Convert the mongoose documents to Display Prop objects
        props.forEach(prop => {
            displayProps.push(new DisplayProp(prop._id, prop.name, prop.description, prop.quantity));
        });

        res.render('store', { props: displayProps, authenticated: authenticated});  // Render the store template with the search results
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
});


// "/:propId" this syntax allows for any value that follows the "/" to be read as the propId
router.get("/:propId", async (req, res) => {
	let authenticated = req.isAuthenticated();
	let propId = req.params.propId; // getting the propId from the url
	let prop_model = await models.Prop.findById(propId);
	let prop = new DisplayProp(prop_model.id, prop_model.name, prop_model.description, prop_model.quantity, prop_model.price, prop_model.status);
	let userId;
	if (req.user && req.user._id) {
		userId = req.user._id;
	} else {
		userId = undefined;
	}
	console.log(prop)
	res.render("prop.handlebars", {prop: prop, authenticated: authenticated, userId: userId});
});

// This route is a combination of the get and post requests.
// async because it interacts with the database
router.route("/:propId/edit")
	.get(isAdmin, async (req, res) => { // rendering the page
		let authenticated = req.isAuthenticated();
		let redirectUrl = req.header('referer') || '/';
		let propId = req.params.propId;
		let prop_model = await models.Prop.findById(propId);
		let prop = new DisplayProp(prop_model.id, prop_model.name, prop_model.description, prop_model.quantity, prop_model.price);
		let userId;
		let admin = req.user && req.user.admin ? req.user.admin : false;
		if (req.user && req.user._id) {
			userId = req.user._id;
		} else {
			userId = undefined;
		}
		res.render("editProp.handlebars", {prop: prop, propId: propId, authenticated: authenticated, userId: userId, admin: admin});
	})
	.post(isAdmin, async (req, res) => { // this is used by the form submission
		let propId = req.params.propId;
		const redirectUrl = req.redirectUrl || "/admin/dashboard"; // redirect url is either the url that the user has come from or "/admin/dashboard" url
		try {
			let thisProp = await models.Prop.findById(propId);
			await models.Prop.findByIdAndUpdate(thisProp.id, {
				name: req.body.name,
				description: req.body.description,
				quantity: req.body.quantity, 
				price:req.body.price
			});
		} catch (error) {
			console.error(error);
			res.status(500);
		}
		res.status(200); // everything went well
		res.redirect(redirectUrl);
	});

router.route("/:propId/qrcode")
	.get(isAdmin, async (req, res) => {
		let propId = req.params.propId;

		// URL the QR code image will link when scanned
		const propUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}/${propId}/edit`;

		// generate a data URL for the QR code image corresponding to the propUrl
		qrCode.toDataURL(propUrl, function (error, url) {
			if (error) {
				console.log("Error Occured");
				return;
			}
			// specifies to the client an html file is being sent
			res.set('Content-Type', 'text/html');
			// sends a html response to the client consisting of the QR code image and nothing else
			res.send(`<html><body><img src="${url}" alt="QR Code" style="max-width: 100%; max-height: 100%;" /></body></html>`);
		})
	});

router.get("/:propId/delete", isAdmin, async (req, res) => {
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

/**
 * for reserving an individual prop
 * 
 * could be moved to orders.js if implemented
 */
router.get("/:propId/reserve", async (req, res) => {
	console.log('reserve attempted');
	let propId = req.params.propId;
	// edit database entry to show as reserved
	try {
		let thisProp = await models.Prop.findById(propId);
		console.log(thisProp.status)
		
		if (thisProp.status === "available"){ // first check if prop is available
			if (thisProp.quantity > 1) { // if there is more than 1 of this prop available
				await models.Prop.findByIdAndUpdate(thisProp.id, {
					quantity: thisProp.quantity-1 // just lower the number of available props
				});
				console.log("reserved one instance, more available");
				res.status(205);
			} else { // if there is only 1 instance of this prop available
				await models.Prop.findByIdAndUpdate(thisProp.id, { // set to reserved status
					quantity: 0,
					status: "reserved"
				});
				console.log("reserved only instance in stock");
				res.status(205);
			}	
		}	else { // if not available don't reserve it
			console.log("item is not available to reserve");
			res.status(500);
		}
	} catch (error) {
		console.error(error);
		res.status(500);
	}
} )

router.get("/:propId/pickup", isAdmin, async (req, res) => {
	let authenticated = req.isAuthenticated();
	let propId = req.params.propId; // getting the propId from the url
	let prop_model = await models.Prop.findById(propId);
	let prop = new DisplayProp(prop_model.id, prop_model.name, prop_model.description, prop_model.quantity, prop_model.price, prop_model.status);
	let userId;
	if (req.user && req.user._id) {
		userId = req.user._id;
	} else {
		userId = undefined;
	}
	console.log(prop)
	res.render("pickup.handlebars", {prop: prop, authenticated: authenticated, userId: userId});
});



// This allows other files to import the router
module.exports = router;