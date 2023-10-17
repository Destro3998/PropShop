models = require("./models");

// This file should have database utility functions

class DisplayProp {  // This is a class used to display props on the site
	constructor(propId, name, description, quantity) {
		this.propId = propId;
		this.name = name;
		this.description = description;
		this.quantity = quantity;
	}
}

class DisplayUser { // This is a class used to display users on the site
	constructor(userId, email, fname, lname, phone) {
		this.userId = userId;
		this.email = email;
		this.fname = fname,
			this.lname = lname,
			this.phone = phone
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
		props.forEach(prop => { // for each prop in the database make it a displayProp object and add it to the list.
			displayProps.push(new DisplayProp(prop._id, prop.name, prop.description, prop.quantity));
		});
		return displayProps;
	} catch (error) {
		console.log(error)
		return []
	}
}

async function getUsers() {
	try {
		let users = await models.User.find({});
		displayUsers = [];
		users.forEach(user => { // for each user in the database make it a displayUser object and add it to the list.
			displayUsers.push(new DisplayUser(user._id, user.email, user.fname, user.lname, user.phone));
		});
		return displayUsers;
	} catch (error) {
		console.log(error)
		return []
	}
}


// Exporting the displayProp class
module.exports = {
	DisplayProp: DisplayProp,
	DisplayUser: DisplayUser,
	getProps: getProps,
	getUsers: getUsers
};