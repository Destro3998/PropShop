// Middleware: functions that are executed when the request is made, but before it gets to the server...(not a dictionary definition)
/**
 * Middleware used to authenticate and authorize users.
 */

/**
 * This function checks if there is an authenticated user
 * @param req the request
 * @param res the response
 * @param next the next middleware in the chain
 */
module.exports.isAuth = (req, res, next) => {
	if (req.isAuthenticated()) {
		next();
	} else {
		res.render("error.handlebars", {authenticated:true, message: "You must be authenticated to view this resource."})
		// res.status(401).json({message: "You must be authenticated to view this resource."});
	}
}
/**
 * This function checks if the user is an admin
 * @param req the request
 * @param res the response
 * @param next the next middleware in the chain
 */
module.exports.isAdmin = (req, res, next) => {
	if (req.isAuthenticated() && req.user.admin) {
		next();
	} else {
		res.render("error.handlebars", {admin:true, message: "You must be authenticated to view this resource. You must be an Admin to view this resource."});
		// res.status(401).json({message: "You must be authenticated to view this resource. You must be an Admin to view this resource."});
	}
}

/**
 * This function checks if the user is blacklisted.
 * @param req the request
 * @param res the response
 * @param next the next middleware in the chain
 */
module.exports.isBlacklisted = (req, res, next) =>{
	if (req.isAuthenticated()){
		if (!req.user.blacklisted){
			next();
		}else{
			res.render("error.handlebars", {blacklisted:true, message:"You are blacklisted and cannot view this resource."});
			// res.status(401).json({message:"You are blacklisted and cannot view this resource."});
		}
	}else{
		next();
	}
}