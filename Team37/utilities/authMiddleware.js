const User = require("./models").User;
const validatePassword = require("./password").validatePassword;
const crypto = require("crypto");
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_KEY);

// Middleware: functions that are executed when the request is made, but before it gets to the server...(not a dictionary definition)
/**
 * Middleware used to authenticate and authorise users.
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
		res.status(401).json({ message: "You must be authenticated to view this resource." });
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
		res.status(401).json({ message: "You must be authenticated to view this resource. You must be an Admin to view this resource." });
	}
}

/**
 * This function checks if a user has verified their email
 * @param req the request
 * @param res the response
 * @param next the next middleware in the chain
 */
module.exports.isVerified = async function (req, res, next) {
	try {
		const user = await User.findOne({ email: req.body.email });

		const isLoginValid = user && validatePassword(req.body.password, user.hash, user.salt);

		// If the login is valid but the email is not verified, send new verification link and redirect to email verification page
		if (isLoginValid && !user.verified) {

			// Create the email token if it has not already been created
			if (!user.emailToken) {
				user.emailToken = crypto.randomBytes(64).toString('hex');
			}

			// Verification email
			const msg = {
				from: 'team37db@gmail.com',
				to: user.email,
				subject: 'Team37 - verify your email',
				text: `
					Hello, thanks for registering on our site. 
					Please copy and paste the address below to verify your account.
					http://${req.headers.host}/accounts/verify-email?token=${user.emailToken}
				`,
				html: `
				<h1>Hello,</h1>
				<p>Thanks for registering on our site.</p>
				<p>Please click the link below to verify your account</p>
				<a href="http://${req.headers.host}/accounts/verify-email?token=${user.emailToken}">Verify your account</a>
				`
			}

			// Send the verification email
			await sgMail.send(msg);
			req.flash('success', 'Account not verified. A new verification link was sent to ' + user.email);
			return res.redirect('/accounts/verification');
		}

		// Otherwise, let Passport middleware handle the login
		return next();

	} catch (error) {
		console.log(error);
		req.flash('error', 'Something went wrong. Please contact us for assistance')
		res.redirect('/');
	}
}