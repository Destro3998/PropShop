const express = require("express");
const router = express.Router();
const models = require("../utilities/models.js");
const utilities = require("../utilities/dbUtilities.js");
const {isAdmin, isAuth} = require("../utilities/authMiddleware.js");
const getProps = utilities.getProps;
const DisplayProp = utilities.DisplayProp;


/**
 *  proposed file for handling/tracking orders/reservations
 *  
 *  not routed yet.
 * 
 * 
 */