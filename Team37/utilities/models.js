//  this file has models used to define documents in mongoDB

const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
	itemId: {type: mongoose.Schema.Types.ObjectId, ref: "item", required: true},
	quantity: {type: Number, default: 1}
});

const employeeSchema = new mongoose.Schema({
	name: {type: String, required: true},
	email: {type: String, required: true},
	phone: Number,
	address: String,
	password: {type: String, required: true},
});
const propInstanceSchema = new mongoose.Schema({
	available: {type: Boolean, required: true},
	location: {type: String, required: true},
	rentHistory: String
});
const propSchema = new mongoose.Schema({
	name: {type: String, required: true},
	price: {type: Number, required: true}, //setting this to false for now until the server/frontend is setup to handle this value
	description: String,
	quantity: {type: Number, required: true}, //Ensure to update quantity when adding/removing instances of a prop
	instance: [propInstanceSchema]
});

const orderSchema = new mongoose.Schema({
	price: Number,
	datePlaced: Date,
	status: Number,
	items: [cartItemSchema]
});


const userSchema = new mongoose.Schema({
	email: {type: String, unique: true, require: true},
	fname: String,
	lname: String,
	phone: String,
	hash: {type: String, require: true},
	salt: {type: String, require: true},
	admin: Boolean,
	blacklisted: Boolean,
	cart: [cartItemSchema],
	orders: [orderSchema]
});

const clientSchema = new mongoose.Schema({
	name: {type: String, required: true},
	email: String,
	phone: Number,
	address: String,
	rentHistory: propSchema,
	userAccount: userSchema
});


const User = mongoose.model("User", userSchema);
const Order = mongoose.model("Order", orderSchema);
const Employee = mongoose.model('Employee', employeeSchema);
const PropInstance = mongoose.model('PropInstance', propInstanceSchema);
const Prop = mongoose.model('Prop', propSchema);
const Client = mongoose.model('Client', clientSchema);
const CartItem = mongoose.model('CartItem', cartItemSchema);

module.exports = {
	Employee,
	PropInstance,
	Prop,
	Client,
	User,
	Order,
	CartItem
};