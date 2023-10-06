const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const express_handlebars = require("express-handlebars");
const indexRouter = require("./routes/index");
const accountsRouter = require("./routes/accounts");
const propsRouter = require("./routes/props");
const adminRouter = require("./routes/admin");
const models = require("./utilities/models");
const utils = require("./utilities/utilities");

const uri = "mongodb+srv://admin:admin@370.16ms14j.mongodb.net/?retryWrites=true&w=majority";

const PORT = 3000;

const app = express();

const hbs = express_handlebars.create({/* config */});

// setting up middleware
app.engine("handlebars", hbs.engine);
app.set("view-engine", "handlebars");
app.set("views", path.join(__dirname, "./views"));

// These statements register routes
app.use(express.static(path.join(__dirname, "./public")));
app.use(bodyParser.urlencoded({extended: true}));
app.use("/", indexRouter);
app.use("/accounts", accountsRouter);
app.use("/prop", propsRouter);
app.use("/admin", adminRouter)


// connecting to database - Only starts the server if the database connects successfully.
// Using .then() for the promises. async could make this more readable.
mongoose.connect(uri).then(() => {
	console.log("Connected to Database.");
	app.listen(PORT, () => {
		console.log(`Listening on port:${PORT}`);
	});
})
	.catch((error) => {
		console.log(error);
	});

// IMPORTANT: TO RUN THE SERVER
// cd to Team37
// run the command: "npm start"