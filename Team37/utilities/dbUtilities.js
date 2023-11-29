const { Prop, Order, User} = require("./models");
models = require("./models");


// This file should have database utility functions

class DisplayProp {  // This is a class used to display props on the site
	constructor(prop) {
		this.propId = prop._id;
		this.name = prop.name;
		this.description = prop.description;
		this.quantity = prop.quantity;
		this.image = prop.image;
		this.model3d = prop.model3d;
		this.price = prop.price;
		this.status = prop.status;
	}
}

class DisplayUser { // This is a class used to display users on the site
	constructor(userId, email, fname, lname, phone, blacklisted, admin) {
		this.userId = userId;
		this.email = email;
		this.fname = fname;
		this.lname = lname;
		this.phone = phone;
		this.blacklisted = blacklisted;
		this.admin = admin;
	}
}

class DisplayOrder {
	constructor(order) {
		this.orderId = order._id
		//user = getUser(order.userId) // replaced user copy with reference to user ID, so get user to get info (this was necessary so that users can create multiple orders without crashing the server)
		this.userFname = order.user.fname
		this.userLname = order.user.lname
		this.userEmail = order.user.email
		this.datePlaced = order.datePlaced.toLocaleString()
		this.status = order.status
		;	}
}


class DisplayCartItem{
	constructor(cartItem){
		let item = getProp(cartItem.itemId);
		this.name = item.name;
		this.price = item.price;
		this.quantity = cartItem.quantity;
	}
}

function createDisplayCartItems(dbCartItems) {
	let items = [];
	dbCartItems.forEach(item => {
		items.push(new DisplayCartItem(item));
	});
	return items;
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
			displayProps.push(new DisplayProp(prop));
		});
		return displayProps;
	} catch (error) {
		console.log(error);
		return [];
	}
}

/**
 * This method gets orders from the database and turns them into objects of the DisplayOrder class.
 * This class is asynchronous - all database operations are asynchronous.
 * @returns {Promise<[]|*[]>}
 */
async function getOrders(skip = 0, limit = 0) {
	try {
		let displayOrders = [];
		let orders = await models.Order.find().skip(skip).limit(limit)
		.populate('user') // populate() replaces the id of the user with the user document
		//.populate('items.0.itemId').exec();
		orders.forEach(order => {

			//console.log(order.items)
			displayOrders.push(new DisplayOrder(order))// for each prop in the database make it a displayProp object and add it to the list.
		});

		///console.log(orders)
		return displayOrders;
	} catch (error) {
		console.log(error);
		return [];
	}
}

async function getUserOrders(userId) {
    try {
        let orders = await Order.find({ user: userId });
        return orders.map(order => new DisplayOrder(order));
    } catch (error) {
        console.error(error);
        return [];
    }
}


/**
 * This method gets users from the database and turns them into objects of the DisplayUser class.
 * This class is asynchronous - all database operations are asynchronous.
 * @returns {Promise<[]|*[]>}
 */
async function getDisplayUsers() {
	try {
		let users = await models.User.find({});
		let displayUsers = [];
		users.forEach(user => { // for each user in the database make it a displayUser object and add it to the list.
			displayUsers.push(new DisplayUser(user._id, user.email, user.fname, user.lname, user.phone, user.blacklisted, user.admin));
		});
		return displayUsers;
	} catch (error) {
		console.log(error)
		return []
	}
}

async function getDisplayUser(userId){
	try{
		let user = await User.findById(userId);
		return new DisplayUser(user._id, user.email, user.fname, user.lname, user.phone, user.blacklisted, user.admin);
	} catch (error){
		console.error(error);
		return null;
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
 * This functions checks whether a given userId is associated with a user in the database
 * @param userId the userId that will be used to query the database.
 * @returns {Promise<boolean>} boolean - if user exists then true, otherwise false
 */
async function userExists(userId) {
	try {
		let exists = await models.User.findById(userId);
		return exists !== null;
	} catch (error) {
		console.log(error)
		return false;
	}
}


// this function does not work
async function orderExists(orderId) {
	try {
		let exists = await models.Order.findById(orderId);
		return exists !== null;
	} catch (error) {
		console.log(error);
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

/**
 * This function returns a prop given it exists in the database
 * @param propId the propId that will be used to query the database.
 * @returns {Promise<(Query<Document<unknown, {}, unknown> & unknown extends {_id?: infer U} ? IfAny<U, {_id: Types.ObjectId}, Required<{_id: U}>> : {_id: Types.ObjectId}, Document<unknown, {}, unknown> & unknown extends {_id?: infer U} ? IfAny<U, {_id: Types.ObjectId}, Required<{_id: U}>> : {_id: Types.ObjectId}, {}, unknown, "findOne"> & {})|boolean|null>}
 */
async function getDisplayProp(propId) {
	try {
		let exists = await propExists(propId);
		if (exists) {
			let prop = await models.Prop.findOne({_id: propId});
			return new DisplayProp(prop);
		} else {
			return null;
		}
	} catch (error) {
		console.error(error);
		return false;
	}
}



/**
 * This function returns a user given it exists in the database
 * @param userId the propId that will be used to query the database.
 * @returns {Promise<(Query<Document<unknown, {}, unknown> & unknown extends {_id?: infer U} ? IfAny<U, {_id: Types.ObjectId}, Required<{_id: U}>> : {_id: Types.ObjectId}, Document<unknown, {}, unknown> & unknown extends {_id?: infer U} ? IfAny<U, {_id: Types.ObjectId}, Required<{_id: U}>> : {_id: Types.ObjectId}, {}, unknown, "findOne"> & {})|boolean|null>}
 */
async function getUser(userId) {
	try {
		let user = await models.User.findById(userId);
		if (user) {
			return user
		}
		console.error("User not found");
		return null;
	} catch (error) {
		console.error(error);
		return false;
	}
}


/**
 * This function returns a prop given it exists in the database
 * @param orderId the orderId that will be used to query the database.
 * @returns {Promise<(Query<Document<unknown, {}, unknown> & unknown extends {_id?: infer U} ? IfAny<U, {_id: Types.ObjectId}, Required<{_id: U}>> : {_id: Types.ObjectId}, Document<unknown, {}, unknown> & unknown extends {_id?: infer U} ? IfAny<U, {_id: Types.ObjectId}, Required<{_id: U}>> : {_id: Types.ObjectId}, {}, unknown, "findOne"> & {})|boolean|null>}
 */
async function getOrder(orderId) {
	try {
		let exists = await orderExists(orderId);
		if (exists) {
			let order = await models.Order.findOne({_id: orderId});
			return order;
		} else {
			return null;
		}
	} catch (error) {
		console.error(error);
		return false;
	}
}

// getting users for dashboard search funtionality
async function getUsers(searchTerm_1 = "") {
    try {
        let query = {};
        if (searchTerm_1) {
            query = {
                $or: [
                    { fname: new RegExp(searchTerm_1, "i") },
                    { lname: new RegExp(searchTerm_1, "i") },
                    { email: new RegExp(searchTerm_1, "i") }
                ]
            };
        }
        let users = await models.User.find(query);
        let displayUsers = [];
        users.forEach(user => {
            displayUsers.push(new DisplayUser(user._id, user.email, user.fname, user.lname, user.phone));
        });
        return displayUsers;
    } catch (error) {
        console.log(error)
        return [];
    }
}

// getting prop for dashboard search funtionality
async function searchProps(searchTerm_2) {
    try {
        const regex = new RegExp(searchTerm_2, 'i');  
        const props = await models.Prop.find({ 
            name: regex  
        });
        
        //console.log("DB returned props:", props);
        
        let displayProps = [];
        props.forEach(prop => {
            displayProps.push(new DisplayProp(prop));
        });
        
        return displayProps;
    } catch (error) {
        console.error(error);
        throw new Error('Database Error: Failed to search props.');
    }
}

// Exporting the displayProp class
module.exports = {
	DisplayProp: DisplayProp,
	DisplayUser: DisplayUser,
	DisplayOrder: DisplayOrder,
	getProps: getProps,
	getUsers: getUsers,
	getOrders: getOrders,
	propExists: propExists,
	orderExists: orderExists,
	getProp: getProp,
	getOrder: getOrder,
	searchProps: searchProps,
	getDisplayProp: getDisplayProp,
	getDisplayUsers: getDisplayUsers,
	getUserOrders: getUserOrders,
	getDisplayUser: getDisplayUser, 
	getUser: getUser, 
};