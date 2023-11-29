const express = require("express");
const router = express.Router();
const models = require("../utilities/models.js");
const {getProps, getProp, getDisplayProp, DisplayProp} = require("../utilities/dbUtilities.js");
const {isAdmin} = require("../utilities/authMiddleware.js");
const qrCode = require('qrcode');

const multer = require("multer"); // for file upload
const imagedir = './public/3dmodels'; // file location to store/retrieve 3d models and images from
var storage = multer.diskStorage({ // setting up file uploads
	destination: function (req, file, cb) {
		cb(null, imagedir)
	},
	filename: function (req, file, cb) {
		cb(null, Date.now() + file.originalname) // add date.now() to make uploaded props have unique file names and to not risk getting mixed up in the folder
	}
})
var upload = multer({storage: storage})


// load-more functionality
router.get('/loadmore', async (req, res) => {
    let limit = parseInt(req.query.limit) || 6;  // Default to 6 if not provided
    let skip = parseInt(req.query.skip) || 0;     // Default to 0 if not provided

    try {
        let props = await models.Prop.find().skip(skip).limit(limit);

        let displayProps = [];  // Convert the mongoose documents to Display Prop objects
        props.forEach(prop => {
            displayProps.push(new DisplayProp(prop));
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
    let userId, admin;
    if (req.user && req.user._id) {
		userId = req.user._id;
		admin = req.user.admin;
	} else {
		userId = undefined;
		admin = false;
	}
    try {
        let props = await models.Prop.find({  // Database search
            $or: [
                {name: new RegExp(searchQuery, 'i')},
                {description: new RegExp(searchQuery, 'i')}
            ]
        });

        let displayProps = [];  // Convert the mongoose documents to Display Prop objects
        props.forEach(prop => {
            displayProps.push(new DisplayProp(prop));
        });

        res.render("store.handlebars", {props: displayProps, authenticated: authenticated, storeActive:true, userId:userId, admin:admin});  // Render the store template with the search results
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
    let prop = new DisplayProp(prop_model);
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
		let prop = { //Adding all the columns from the database schema to the prop object
			...prop_model._doc, //Adding all the fields from the prop_model
			instance: prop_model.instance.map((item) => ({ ...item._doc })), //Adding the instance array
		};
		let userId;
		let admin = req.user && req.user.admin ? req.user.admin : false;
		if (req.user && req.user._id) {
			userId = req.user._id;
		} else {
			userId = undefined;
		}
		res.render("editProp.handlebars", {prop: prop, propId: propId, authenticated: authenticated, userId: userId, admin: admin});
	})
	.post(isAdmin, upload.fields([{name: 'image', maxCount: 1}, {
        name: 'model3d',
        maxCount: 1}]), async (req, res) => {
		let propId = req.params.propId;

        // CHECK IF IMAGES/3D MODELS WERE UPLOADED FIRST
	    if (req.files.model3d !== undefined) {
		    filename3d = req.files.model3d[0].filename
	    } else {
		    filename3d = null
	    }
	    if (req.files.image !== undefined) {
		    filenameimg = req.files.image[0].filename

	    } else {
		filenameimg = null
	    }

		// Get which form submitted this data
		let formType = req.body.formType;
		try {
		  	let thisProp = await models.Prop.findById(propId);
			if (formType === "general") {
				// Update basic prop information based on the form
				thisProp.name = req.body.name;
				thisProp.description = req.body.description;
				thisProp.category = req.body.category;
				thisProp.price = req.body.price;
                if (filenameimg != null){
                    thisProp.image = filenameimg
                }
                if (filename3d != null){
                    thisProp.model3d = filename3d
                }
		  	} else if (formType === "newInstance") {
				// Adding a new instance of this prop
				let newInstance = {
					status: req.body.status,
					location: req.body.location,
					rentHistory: [req.body.rentHistory],
				};
			  	thisProp.instance.push(newInstance);
		  	}
		  	await thisProp.save();
		} catch (error) {
		  console.error(error);
		  res.status(500).send("Error adding instance to prop.");
		}
		let redirectUrl = req.redirectUrl || `/prop/${propId}/edit`;
		res.status(200).redirect(redirectUrl);
	  });

router.route("/:propId/:instanceId/edit")
	.post(isAdmin, async (req, res) => {
		let propId = req.params.propId;
		// Get which form submitted this data
		let formType = req.body.formType;
		try {
			let thisProp = await models.Prop.findById(propId);
			if (formType === "instance") {
				// Get the instance that is being updated
				let instanceId = req.params.instanceId;
				let thisInstance = thisProp.instance.id(instanceId);
				// Update instance properties based on the form
				thisInstance.status = req.body.status;
				thisInstance.location = req.body.location;
				thisInstance.rentHistory = [req.body.rentHistory];
		  	}
			await thisProp.save();
	  	} catch (error) {
			console.error(error);
			res.status(500).send("Error adding instance to prop.");
	  	}
		let redirectUrl = req.redirectUrl || `/prop/${req.params.propId}/edit`;
		res.status(200).redirect(redirectUrl);
	});

router.route("/:propId/:instanceId/qrcode")
    .get(isAdmin, async (req, res) => {
        let propId = req.params.propId;
        let instanceId = req.params.instanceId;
        // URL the QR code image will link when scanned
        let propUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}/${propId}/${instanceId}/pickup`;
        // Generate a data URL for the QR code image corresponding to the propUrl
        qrCode.toDataURL(propUrl, function (error, url) {
            if (error) {
                console.log("Error Occured");
                return;
            }
            // Specifies to the client an html file is being sent
            res.set('Content-Type', 'text/html');
            // Sends a html response to the client consisting of the QR code image and nothing else
            res.send(`<html lang="en"><body><img src="${url}" alt="QR Code" style="max-width: 100%; max-height: 100%;" /></body></html>`);
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

        if (thisProp.status === "available") { // first check if prop is available
            if (thisProp.quantity > 1) { // if there is more than 1 of this prop available
                await models.Prop.findByIdAndUpdate(thisProp.id, {
                    quantity: thisProp.quantity - 1 // just lower the number of available props
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
        } else { // if not available don't reserve it
            console.log("item is not available to reserve");
            res.status(500);
        }
    } catch (error) {
        console.error(error);
        res.status(500);
    }
})

router.get("/:propId/:instanceId/pickup", isAdmin, async (req, res) => {
    let authenticated = req.isAuthenticated();
    let propId = req.params.propId; // getting the propId from the url
    let prop = await getDisplayProp(propId);
    let userId;
    userId = req.user && req.user._id ? req.user._id : undefined;
    console.log(prop);

    let orders = await models.Order.find();
    console.log(orders);
    orderIds = [];

    orders.forEach(element => {
        orderIds.push(element._id);
    });

    res.render("pickup.handlebars", {prop: prop, instanceId: req.params.instanceId, authenticated: authenticated, userId: userId, orderIds: orderIds});
});

router.post("/:propId/:instanceId/pickup", isAdmin, async (req, res) => {
    console.log("manamejeff")
    //console.log(req.body);
    let condition = req.body.condition;
    let status = "";
    let redirectUrl = req.header('referer') || '/admin/dashboard';
    try {
        let prop = await getProp(req.params.propId);
        let instance;
        console.log(prop)
        for (const inst of prop.instance) {
            console.log(inst)
            if (inst.id === req.params.instanceId){
                console.log("foundfoundofundoufndEAIJFWERIGFJNWERGJ")
                instance = inst
                break
            }
        }

        if (!instance) { // if instance wasn't found
            throw new Error(`Instance could not be found of ${prop.name}`)
        }

        if (req.body.inOut === "incoming") {
            // the item has been returned.
            instance.status = "available";
        } else if (req.body.inOut === "outgoing") {
            // The item is being taken out
            instance.status = "unavailable"
        } else {
            throw new Error("Form submission incomplete");
        }

        // update numOfReserved for the prop if it was reserved for this order
        // can just subtract without checking for now, but there must be checks added in the future if
        // allowing admins to check out additional props to an order that were not originally reserved
        if (req.body.inOut === "outgoing") {
            prop.numOfReserved -= 1
        }

        prop.status = status;
        await prop.save();
        res.redirect(`/orders/${req.body.orderSelect}`)
    } catch (error) {
        console.error(error.message);
        res.redirect(redirectUrl);
    }

});

// This allows other files to import the router
module.exports = router;