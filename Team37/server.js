const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const indexRouter = require("./routes/index");
const models = require("./utilities/models");
const utils = require("./utilities/utilities");

const PORT = 3000;

const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use("/", indexRouter);
app.use("/dashboard", indexRouter);


app.listen(PORT, () => {
	console.log(`Listening on port:${PORT}`);
});

// IMPORTANT: TO RUN THE SERVER
// cd to Team37
// run the command: "npm run dev"