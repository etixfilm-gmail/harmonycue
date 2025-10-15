require(`dotenv`).config();

console.log(`✅ LOADED server.js`);

const express = require(`express`);
const path = require(`path`);
const cookieSession = require(`cookie-session`);
const createError = require(`http-errors`);

const app = express();

// Serve static assets with custom cache control
app.use(
	express.static(path.join(__dirname, "hc-static"), {
		setHeaders: (res, filePath) => {
			if (
				filePath.endsWith(".webp") ||
				filePath.endsWith(".jpg") ||
				filePath.endsWith(".png")
			) {
				res.setHeader("Cache-Control", "public, max-age=31536000");
			}
		},
	})
);

// Set up EJS templating
app.set(`view engine`, `ejs`);
app.set(`views`, path.join(__dirname, `hc-views`));

// Set up POST service
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static assets
app.use(express.static(path.join(__dirname, `hc-static`)));

// Load services and routes
const multimixerService = require(`./hc-services/hc-services-multimixer`);
const samplerService = require(`./hc-services/hc-services-sampler`);
const routes = require(`./hc-routes/hc-routes-index`);

// set up params to pass to the routes
const params = {
	multimixerService,
	samplerService,
};

// Wire up all routes
app.use(`/`, routes(params));

// needed for reverse proxy, whatever that is
app.set(`trust proxy`, 1);

app.use(
	cookieSession({
		name: `session`,
		keys: [`ciyf8wicvu9df`, `sidfujwgeerfzwe98r7`],
	})
);

app.locals.hc_siteName = `HarmonyCue.com`; // locals are variables avail throughout the app

app.use((req, res, next) => {
	next();
});

app.use(`/.well-known`, (req, res) => {
	res.status(204).end();
});

app.use((req, res, next) => {
	return next(createError(404, `File not found`));
});

const PORT = process.env.PORT || 3000;
const HOSTNAME = process.env.HOST || "0.0.0.0";
// const HOSTNAME = "23.235.221.126"; Old InmotionHosing IP

app.listen(PORT, HOSTNAME, () => {
	const displayHost = HOSTNAME === "0.0.0.0" ? "localhost" : HOSTNAME;
	console.log(`Express server listening at http://${displayHost}:${PORT}`);
});
