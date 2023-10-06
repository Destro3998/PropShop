// This file should have utility functions

class DisplayProp {  // This is a class used to display props on teh site
	constructor(propId, name, description, quantity) {
		this.propId = propId;
		this.name = name;
		this.description = description;
		this.quantity = quantity;
	}
}

// Exporting the displayProp class
module.exports = DisplayProp;