const { User, Order } = require("./models");
const validatePassword = require("./password").validatePassword;
const crypto = require("crypto");
const sgMail = require('@sendgrid/mail');

// TODO: move/replace these variables
const FROM_EMAIL = 'team37db@gmail.com';  // new 'from' emails must be verified in the SendGrid account
const COMPANY = 'Team37';

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
        from: FROM_EMAIL,
        to: user.email,
        subject: `${COMPANY} - verify your email`,
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
    sgMail.setApiKey(process.env.SENDGRID_KEY);
    await sgMail.send(msg);
}

/**
 * Sends a confirmation email to a user after they place an order. Also sends a new order notification
 * to the admin email
 * @param {OrderId} orderId the id of the order that was placed by user
 * @param {String} host the host name of the website; pass req.headers.host
 */
async function sendOrderConfirmationEmails(orderId, host) {
    // Find user to send the email to
    const order = await Order.findById(orderId);
    const user = await User.findById(order.user);

    // Order summary message used in both confirmation and admin notification emails
    orderSummary = `
        <p><br><strong>Order ID: </strong><a href="http://${host}/orders/${orderId}">${orderId}</a></p>
        
        <p><br><strong>Order Summary:</strong></p>
        <p>Order Date: ${order.datePlaced}</p>
        <p>Paid Deposit: $${order.depositAmount.toFixed(2)}</p>
        <p>Total Rental Cost: $${order.price.toFixed(2)} per day</p>
        `

    // Create the user confirmation email
    const userMsg = {
        from: FROM_EMAIL,
        to: user.email,
        subject: `${COMPANY} - Reservation Confirmation`,
        text: `This a confirmation of your order.`,
        html: `
        <h1>${COMPANY} - Reservation Confirmation</h1>
        ` + orderSummary
    }

    // Create the admin new order notification email
    const adminMsg = {
        from: FROM_EMAIL,
        to: FROM_EMAIL,
        subject: `${COMPANY} - New Reservation Made`,
        text: `${user.fname} ${user.lname} made a new reservation.`,
        html: `
        <h1>${COMPANY} - New Reservation</h1>
        <p><strong>Customer:</strong> ${user.fname} ${user.lname}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        ` + orderSummary
    }

    // Send the order confirmation and admin notification emails
    sgMail.setApiKey(process.env.SENDGRID_KEY);
    await sgMail.send(userMsg);
    await sgMail.send(adminMsg);
}

/**
 * Sends email to admins with message submitted by a user
 * @param {String} name the name of the user who sent the message
 * @param {String} email the email of the user who sent the message
 * @param {String} business the user's business
 * @param {String} message the message sent
 */
async function sendCustomerMessageEmail(name, email, business, message) {
    // Customer Message Email
    const msg = {
        to: 'team37db@gmail.com',
        from: FROM_EMAIL,
        subject: 'Message from Customer',
        text: `Name: ${name}\nEmail: ${email}\nBusiness: ${business}\nMessage:\n${message}`,
        html:
            `
        <h1>Message from Customer</h1>
		<p><strong>Name:<\strong> ${name}</p>
		<p><strong>Email:<\strong> ${email}</p>
		<p><strong>Business:<\strong> ${business}</p>
		<p><strong>Message:<\strong></p>
		<p>${message}</p>
		`,
    };

    // Send the email
    sgMail.setApiKey(process.env.SENDGRID_KEY);
    await sgMail.send(msg);
}

module.exports = {
    isVerified: isVerified,
    sendVerificationEmail: sendVerificationEmail,
    sendOrderConfirmationEmails: sendOrderConfirmationEmails,
    sendCustomerMessageEmail: sendCustomerMessageEmail
};