const http = require('http');
const ngrok = require('@ngrok/ngrok');
const mongoose = require('mongoose');
const app = require('./server');

const uri = `mongodb+srv://admin:${process.env.DB_PASSWORD}.16ms14j.mongodb.net/?retryWrites=true&w=majority`;

mongoose.connect(uri).then(() => {
    console.log('Connected to Database.');

    // Start ngrok and expose the server
    ngrok.connect({
        proto: 'http', // Use HTTP protocol
        addr: process.env.PORT, // Use the port your app is listening on
    }).then((url) => {
        console.log('ngrok tunnel:', url);

        // Create an HTTP server using your Express app
        const server = http.createServer(app);

        // Start your Express app on the given port
        server.listen(process.env.PORT, () => {
            console.log(`Listening on port:${process.env.PORT}`);
        });
    });
}).catch((error) => {
    console.log(error);
});