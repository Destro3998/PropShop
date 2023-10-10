const sgMail = require('@sendgrid/mail');

const API_KEY = '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';

sgMail.setApiKey(API_KEY);


const msg = {
    to: '',
    from: 'qkc735@usask.ca',
    subject: 'Hello from Team37!',
    text: 'This is a test email from SendGrid.',
    html: '<strong>This is a test email from SendGrid.</strong>',
};

sgMail.send(msg)
    .then(() => {
        console.log('Email sent successfully!');
    })
    .catch((error) => {
        console.error('Error sending email:', error);
    });
