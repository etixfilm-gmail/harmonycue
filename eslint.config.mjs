// eslint.config.mjs
// eslint.config.mjs
import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
	// --- Front-end (browser) ES modules ---
	{
		files: ["hc-static/hc-static-js/**/*.js"],
		plugins: { js },
		extends: ["js/recommended"],
		languageOptions: {
			sourceType: "module", // <-- let import/export work
			ecmaVersion: "latest",
			globals: {
				...globals.browser, // window, document, etc.
			},
		},
	},

	// --- Node / server CommonJS ---
	{
		files: ["server.js", "hc-routes/**/*.js", "scripts/**/*.js"],
		plugins: { js },
		extends: ["js/recommended"],
		languageOptions: {
			sourceType: "commonjs", // <-- require/module.exports
			ecmaVersion: "latest",
			globals: {
				...globals.node, // __dirname, process, etc.
			},
		},
	},
]);
