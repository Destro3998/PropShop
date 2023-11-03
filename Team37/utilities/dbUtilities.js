models = require("./models");


// This file should have database utility functions

class DisplayProp {  // This is a class used to display props on the site
	constructor(propId, name, description, quantity, price, status) {
		this.propId = propId;
		this.name = name;
		this.description = description;
		this.quantity = quantity;
		this.price = price;
		this.status = status;
	}
}

class DisplayUser { // This is a class used to display users on the site
	constructor(userId, email, fname, lname, phone) {
		this.userId = userId;
		this.email = email;
		this.fname = fname;
		this.lname = lname;
		this.phone = phone;
	}
}


/**
 * This method gets props from the database and turns them into objects of the DisplayProp class.
 * This class is asynchronous - all database operations are asynchronous.
 * @returns {Promise<[]|*[]>}
 */
async function getProps(skip = 0, limit = 0) {
	try {
		let props = await models.Prop.find().skip(skip).limit(limit);
		let displayProps = [];
		props.forEach(prop => {
			// for each prop in the database make it a displayProp object and add it to the list.
			displayProps.push(new DisplayProp(prop._id, prop.name, prop.description, prop.quantity, prop.price));
		});
		return displayProps;
	} catch (error) {
		console.log(error);
		return [];
	}
}


/**
 * This method gets users from the database and turns them into objects of the DisplayUser class.
 * This class is asynchronous - all database operations are asynchronous.
 * @returns {Promise<[]|*[]>}
 */
async function getUsers() {
	try {
		let users = await models.User.find({});
		let displayUsers = [];
		users.forEach(user => { // for each user in the database make it a displayUser object and add it to the list.
			displayUsers.push(new DisplayUser(user._id, user.email, user.fname, user.lname, user.phone));
		});
		return displayUsers;
	} catch (error) {
		console.log(error)
		return []
	}
}

/**
 * This functions checks whether a given propId is associated with a prop in the database
 * @param propId the propId that will be used to query the database.
 * @returns {Promise<boolean>} boolean - if prop exists then true, otherwise false
 */
async function propExists(propId) {
	try {
		let exists = await models.Prop.findById(propId);
		return exists !== null;
	} catch (error) {
		console.log(error)
		return false;
	}
}

/**
 * This function returns a prop given it exists in the database
 * @param propId the propId that will be used to query the database.
 * @returns {Promise<(Query<Document<unknown, {}, unknown> & unknown extends {_id?: infer U} ? IfAny<U, {_id: Types.ObjectId}, Required<{_id: U}>> : {_id: Types.ObjectId}, Document<unknown, {}, unknown> & unknown extends {_id?: infer U} ? IfAny<U, {_id: Types.ObjectId}, Required<{_id: U}>> : {_id: Types.ObjectId}, {}, unknown, "findOne"> & {})|boolean|null>}
 */
async function getProp(propId) {
	try {
		let exists = await propExists(propId);
		if (exists) {
			let prop = await models.Prop.findOne({_id: propId});
			return prop;
		} else {
			return null;
		}
	} catch (error) {
		console.error(error);
		return false;
	}
}








// Exporting the displayProp class
module.exports = {
	DisplayProp: DisplayProp,
	DisplayUser: DisplayUser,
	getProps: getProps,
	getUsers: getUsers,
	propExists: propExists,
	getProp: getProp,
	searchProps: searchProps
};