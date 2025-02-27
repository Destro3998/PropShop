const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const express_handlebars = require("express-handlebars");
const indexRouter = require("./routes/index");
const accountsRouter = require("./routes/accounts");
const propsRouter = require("./routes/props");
const adminRouter = require("./routes/admin");
const ordersRouter = require("./routes/orders");
const flash = require("connect-flash");
const {User} = require("./utilities/models");
const {adminEmails, adminPasswordHash, adminPasswordSalt} = require("./utilities/adminUtilities");
require("dotenv").config();


//For Authentication
const session = require("express-session");
const passport = require("passport");
const mongoStore = require("connect-mongo");


const app = express();
const hbs = express_handlebars.create({/* config */
    helpers: {
        json: function (context) {
            return JSON.stringify(context);
        }
    }
});


// The link to our database connection. the {process.env.DB_PASSWORD} is the password to our database.
// Storing our database password in this manner is more secure than just having it in plain text.
// our database will have important information so keeping it safe is very important.
const uri = `mongodb+srv://admin:${process.env.DB_PASSWORD}.16ms14j.mongodb.net/?retryWrites=true&w=majority`;

// Setting up our database as our storage for all of our sessions and their keys.
const sessionStore = mongoStore.create({
    mongoUrl: uri
})

// Using session middleware to create our sessions
app.use(session({
    secret: process.env.SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // This configures how long our sessions last on our site for.
        // If you do not clear your cookies then you can stay logged into the site for 24hours
    }
}));

// Setting up flash messages
app.use(flash());

// Make flash messages available in handlebars templates
app.use((req, res, next) => {
    res.locals.messages = req.flash();
    next();
});


// This is the passport configuration
require("./utilities/passport");


// Initializing the passport framework
// These two middlewares run every time we load a route
// They check if the user property is null.
// Then they run the serialize and/or deserialize methods (in passport.js)
// When we log out the user property is no longer passed in the cookie
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());


// setting up middleware
app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "./views"));

// These statements register routes
app.use(express.static(path.join(__dirname, "./public")));
app.use(bodyParser.urlencoded({extended: true}));
app.use("/", indexRouter);
app.use("/accounts", accountsRouter);
app.use("/prop", propsRouter);
app.use("/admin", adminRouter);
app.use("/orders", ordersRouter);


// connecting to database - Only starts the server if the database connects successfully.
// Using .then() for the promises. async-await could make this more readable.
// This starts the server
const connectToDatabase = async () => {
    try {
        await mongoose.connect(uri);
        await initAdmins();
        console.log("Connected to Database.");
        app.listen(process.env.PORT, async () => {
            console.log(`Listening on port:${process.env.PORT}`);
        });

    } catch (error) {
        console.log(error);
    }
};

async function initAdmins() {
    try {
        for (const adminEmail of adminEmails) {
            let user = await User.findOne({email:adminEmail});
            if (user) {
                console.log("Admin user already exists");
            } else {
                const newUser = new User({
                    email: adminEmail,
                    fname: "Super",
                    lname: "Admin",
                    phone: 1,
                    hash: adminPasswordHash,
                    salt: adminPasswordSalt,
                    admin: true,
                    verified: true,
                    blacklisted: false
                });
                await newUser.save();
                console.log("Admin user created");
            }
        }
    } catch (error) {
        console.error("Failed to initialize admin user. Error: \n", error);
    }
}

connectToDatabase();

// IMPORTANT: TO RUN THE SERVER
// cd to Team37
// run the command: "npm start"


// If you get this error:MongoParseError: mongodb+srv URI cannot have port number
// You probably do not have the .env file.
