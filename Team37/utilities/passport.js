const passport = require("passport");
const { isEmailAdmin } = require("./adminUtilities");
const localStrategy = require("passport-local").Strategy;
const User = require("./models").User;
const validatePassword = require("./password").validatePassword;

/**
 * This middleware is used to allow passport to authenticate users
 */
passport.use(new localStrategy({usernameField: "email", passwordField: "password"}, // These options tell passport what our username and password fields are called
	function (email, password, callback) {
		User.findOne({email: email})
			.then((user) => { // This callback(something, something) syntax is standard for passportJS
				if (!user) {
					return callback(null, false)
				}


				const isAdminEmail = isEmailAdmin(email);
				if (isAdminEmail){
					const isLoginValid = validatePassword(password, user.hash, user.salt);
					if (isLoginValid) {
						user.admin = true; // if the user has logged in with an admin email then set their admin value to true.
						return callback(null, user);
					} else {
						return callback(null, false);
					}
				} 


				const isLoginValid = validatePassword(password, user.hash, user.salt);

				if (isLoginValid) {
					return callback(null, user);
				} else {
					return callback(null, false);
				}
			})
			.catch((error) => {
				callback(error);
			});
	}
));

// This grabs the userId and adds it to the cookie that is created.
passport.serializeUser((userId, callback) => {
	callback(null, userId);
});

// This grabs the user from the database based on the userId and gets the user object and puts it in the cookie.
passport.deserializeUser((userId, callback) => {
	User.findById(userId)
		.then((user) => {
			callback(null, user);
		})
		.catch((error) => {
			callback(error);
		});
});