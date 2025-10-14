require("dotenv").config();

// c•onsole.log("server.js");

const express = require("express");
const path = require("path");
const cookieSession = require("cookie-session");
const createError = require("http-errors");

const app = express();
const port = 2222;
const hostname = "23.235.221.126";

// Set up EJS templating
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "hc-views"));

// Set up POST service
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static assets
app.use(express.static(path.join(__dirname, "hc-static")));

// Load services and routes
const multimixerService = require("./hc-services/hc-services-multimixer");
const samplerService = require("./hc-services/hc-services-sampler");
const routes = require("./hc-routes/hc-routes-index");

// set up params to pass to the routes
const params = {
	multimixerService,
	samplerService,
};

// Wire up all routes
app.use("/", routes(params));

const PORT = process.env.PORT || 3000;

// needed for reverse proxy, whatever that is
app.set("trust proxy", 1);

app.use(
	cookieSession({
		name: "session",
		keys: ["ciyf8wicvu9df", "sidfujwgeerfzwe98r7"],
	})
);

app.locals.hc_siteName = "HarmonyCue.com"; // locals are variables avail throughout the app

// c•onsole.log("__dirname: " + __dirname);

app.use((req, res, next) => {
	// c•onsole.log(`Request URL: ${req.url}`);
	next();
});

app.use("/.well-known", (req, res) => {
	res.status(204).end();
});

app.use((req, res, next) => {
	return next(createError(404, "File not found"));
});

app.listen(PORT, () => {
	console.log(`Express server listening on PORT ${PORT}`);
});

// app.use((err, req, res, next) => {
// res.locals.message = err.message;
// c•onsole.log(err);
// const status = err.status || 500;
// res.locals.status = status;
// res.status(status);
// res.render("hc-views-error");
// });
