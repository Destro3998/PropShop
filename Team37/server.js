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

const PORT = 3000;

const app = express();

const hbs = express_handlebars.create({/* config */});

app.engine("handlebars", hbs.engine);
app.set("view-engine", "handlebars");
app.set("views", path.join(__dirname, "./views"));


app.use(express.static(path.join(__dirname, "./public")));
app.use("/", indexRouter);
app.use("/accounts", accountsRouter);
app.use("/prop", propsRouter);
app.use("/admin", adminRouter)



app.listen(PORT, () => {
	console.log(`Listening on port:${PORT}`);
});

// IMPORTANT: TO RUN THE SERVER
// cd to Team37
// run the command: "npm run dev"