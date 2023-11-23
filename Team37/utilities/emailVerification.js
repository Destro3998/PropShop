const User = require("./models").User;
const validatePassword = require("./password").validatePassword;
const crypto = require("crypto");
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_KEY);

/**
 * Middleware to be called upon login that checks if a user has verified there email. 
 * If not, the user is redirected to an verification page and emailed a verification link.
 * @param req the request
 * @param res the response
 * @param next the next middleware in the chain
 */
async function isVerified(req, res, next) {
    try {
        const user = await User.findOne({ email: req.body.email });

        const isLoginValid = user && validatePassword(req.body.password, user.hash, user.salt);

        // If the login is valid but the email is not verified, send new verification link and redirect to email verification page
        if (isLoginValid && !user.verified) {
            sendVerificationEmail(user, req.headers.host);
            req.flash('success', 'A new verification link was sent to ' + user.email);
            return res.redirect('/accounts/verification');
        }

        // Otherwise, let the next middleware handle the login
        return next();

    } catch (error) {
        console.log(error);
        req.flash('error', 'Something went wrong. Please contact us for assistance');
        res.redirect('/');
    }
}

/**
 * Sends an email to a user with a link to verify their email address
 * @param {User} user 
 * @param {String} host the host name of the website; pass req.headers.host
 */
async function sendVerificationEmail(user, host) {
    // Create the email token if it has not already been created
    if (!user.emailToken) {
        user.emailToken = crypto.randomBytes(64).toString('hex');
        user.verified = false;
    }
    await user.save();

    // Verification email
    const msg = {
        from: 'team37db@gmail.com',
        to: user.email,
        subject: 'Team37 - verify your email',
        text: `
            Hello, thanks for registering on our site. 
            Please copy and paste the address below to verify your account.
            http://${host}/accounts/verify-email?token=${user.emailToken}
        `,
        html: `
        <h1>Hello,</h1>
        <p>Thanks for registering on our site.</p>
        <p>Please click the link below to verify your account</p>
        <a href="http://${host}/accounts/verify-email?token=${user.emailToken}">Verify your account</a>
        `
    }

    // Send the verification email
    await sgMail.send(msg);
}

module.exports = {
    isVerified: isVerified,
    sendVerificationEmail: sendVerificationEmail
};