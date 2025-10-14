const express = require("express");
const app = express();

// Simple route to test if Node.js and Express are working
app.get("/", (req, res) => {
	res.send(`
        <h1>🎵 HarmonyCue Test Server Working! 🎵</h1>
        <p>Node.js version: ${process.version}</p>
        <p>Time: ${new Date().toLocaleString()}</p>
        <p>Environment: ${process.env.NODE_ENV || "development"}</p>
        <a href="/test">Test another route</a>
    `);
});

app.get("/test", (req, res) => {
	res.json({
		message: "API endpoint working!",
		timestamp: new Date().toISOString(),
		success: true,
	});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Test server running on port ${PORT}`);
});
