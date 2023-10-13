const accountSid = 'AC702cfd8cc49b75f7f9c539b52b25cc8a';
const authToken = '15887f195f2cfed21b46dc7ad6cf40c6';
const client = require('twilio')(accountSid, authToken);

client.messages
    .create({
        body: 'hello sam. This message is from twilio!',
        from: '+12565791959',
        to: '+15875666599'
    })
    .then(message => console.log(message.sid))
    .catch(err => {
        console.error("Failed to send message:", err);
    });
    