//  this file has models used to define documents in mongoDB

const mongoose = require("mongoose");

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
	description: String,
	quantity: {type: Number, required: true}, //Ensure to update quantity when adding/removing instances of a prop
	instance: [propInstanceSchema]
});


const userSchema = new mongoose.Schema({
	email: {type: String, unique: true, require: true},
	fname: String,
	lname: String,
	phone: String,
	hash: {type: String, require: true},
	salt: {type: String, require: true},
	admin: Boolean,
	blacklisted: Boolean
});

const clientSchema = new mongoose.Schema({
	name: {type: String, required: true},
	email: String,
	phone: Number,
	address: String,
	rentHistory: propSchema,
	userAccount: userSchema
});

const orderSchema = new mongoose.Schema({
	price: Number,
	datePlaced: Date,
	status: Number
})


const User = mongoose.model("User", userSchema);
const Order = mongoose.model("Order", orderSchema);
const Employee = mongoose.model('Employee', employeeSchema);
const PropInstance = mongoose.model('PropInstance', propInstanceSchema);
const Prop = mongoose.model('Prop', propSchema);
const Client = mongoose.model('Client', clientSchema);

module.exports = {
	Employee,
	PropInstance,
	Prop,
	Client,
	User,
	Order
};