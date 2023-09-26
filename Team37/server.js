const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const bodyParser = require("body-parser")

const models = require("./models");
const utils = require("./utilities");

const app = express();

const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "pages", "index.html"));
});

// This file should have routes

app.listen(PORT, () => {
	console.log(`Listening on port:${PORT}`);
});

// IMPORTANT: TO RUN THE SERVER
// cd to Team37
// run the command: "npm run dev"