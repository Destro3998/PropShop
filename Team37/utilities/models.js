//  this file has models used to define documents in mongoDB

const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
	itemId: {type: mongoose.Schema.Types.ObjectId, ref: "Prop", required: true},
	quantity: {type: Number, default: 1}
});

const employeeSchema = new mongoose.Schema({
	name: {type: String, required: true},
	email: {type: String, required: true},
	phone: Number,
	address: String,
	password: {type: String, required: true},
});

const propSchema = new mongoose.Schema({
	name: {type: String, required: true},
	price: {type: Number, required: true}, // Setting this to false for now until the server/frontend is setup to handle this value
	description: String,
	category: [String],
	quantity: {type: Number, required: true},
	numOfAvailable: {type: Number, required: true}, // Number of instances with the status available
	instance: [ // Each prop has children that share prop fields but have unique fields
		{
			status: { // Using enum behaviour to restrict possible values
				type: String,
				enum: ["available", "unavailable"], 
				required: true
		  	}, 
			location: {type: String, required: true},
			condition: {type: String},
			rentHistory: [String] 
		}
	]
});
// Pre-hook trigger before saving to propSchema
propSchema.pre('save', function(next) {
	this.quantity = this.instance.length; // Set quantity to number of instances plus one
	// Count the number of instances with status "available"
  	this.numOfAvailable = this.instance.reduce((count, instance) => {
    	if (instance.status === 'available') {
      		count++;
    	}
    	return count;
  	}, 0);
	next(); // Allow rest of the operation to continue
});

const userSchema = new mongoose.Schema({
	email: {type: String, /*unique: true,*/ require: true},
	fname: String,
	lname: String,
	phone: String,
	hash: {type: String, require: true},
	salt: {type: String, require: true},
	admin: Boolean,
	blacklisted: Boolean,
	cart: [cartItemSchema],
});

const orderSchema = new mongoose.Schema({
	price: Number,
	datePlaced: {type: Date, default: Date.now()},
	status: { // using enum behaviour to restrict possible values
		type: String,
		enum: ["pending", "in progress", "complete"], 
		default: "pending"
	  }, 
	user: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
	items: [cartItemSchema]
});

const clientSchema = new mongoose.Schema({
	name: {type: String, required: true},
	email: String,
	phone: Number,
	address: String,
	rentHistory: propSchema,
	userAccount: userSchema
});

const configSchema = new mongoose.Schema({
	siteMessage: String,
	companyAddress: String,
	companyEmail: String,
	companyPhone: String
});

const User = mongoose.model("User", userSchema);
const Order = mongoose.model("Order", orderSchema);
const Employee = mongoose.model('Employee', employeeSchema);
const Prop = mongoose.model('Prop', propSchema);
const Client = mongoose.model('Client', clientSchema);
const CartItem = mongoose.model('CartItem', cartItemSchema);
const Configuration = mongoose.model('Configuration', configSchema);

//Order.collection.dropIndexes()
//Client.collection.dropIndexes()
//User.collection.dropIndexes()

module.exports = {
	Employee,
	Prop,
	Client,
	User,
	Order,
	CartItem,
	Configuration
};
