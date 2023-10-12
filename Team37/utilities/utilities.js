models = require("./models");

// This file should have utility functions

class DisplayProp {  // This is a class used to display props on teh site
	constructor(propId, name, description, quantity, image) {
		this.propId = propId;
		this.name = name;
		this.description = description;
		this.quantity = quantity;
		this.image = image;
	}
}


/**
 * This method gets props from the database and turns them into objects of the DisplayProp class.
 * This class is asynchronous - all database operations are asynchronous.
 * @returns {Promise<[]|*[]>}
 */
async function getProps() {
	try {
		let props = await models.Prop.find({});
		displayProps = [];
		props.forEach(prop => { // for each prop in teh database make it a displayProp object and add it to the list.
			displayProps.push(new DisplayProp(prop._id, prop.name, prop.description, prop.quantity, prop.image));
		});
		return displayProps;
	} catch (error) {
		console.log(error)
		return []
	}
}


// Exporting the displayProp class
module.exports = {
	DisplayProp: DisplayProp,
	getProps: getProps
};