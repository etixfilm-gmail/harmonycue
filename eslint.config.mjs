// eslint.config.mjs
/*
import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
	// --- Front-end (browser) ES modules ---
	{
		files: ["hc-static/hc-static-js/°°/°.js"],
		plugins: { js },
		extends: ["js/recommended"],
		languageOptions: {
			sourceType: "module", // <-- let import/export work
			ecmaVersion: "latest",
			globals: {
				...globals.browser, // window, document, etc.
				eRegistryJS: "readonly",
				initJS: "readonly",
				stateJS: "readonly",
				utilsJS: "readonly",
				lockJS: "readonly",
				handlersJS: "readonly",
				scriptsJS: "readonly",
				contactJS: "readonly",
				explainerJS: "readonly",
				multimixerJS: "readonly",
				samplerJS: "readonly",
				splashJS: "readonly",
				audioBusJS: "readonly",
				mathJS: "readonly",
				mmm: "readonly",
			},
		},
	},

	// --- Node / server CommonJS ---
	{
		files: ["server.js", "hc-routes/°°/°.js", "scripts/°°/°.js"],
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
*/

// eslint.config.js
import js from "@eslint/js";
import globals from "globals";

export default [
	{
		files: ["hc-static/hc-static-js/hc-static-js-*.js"],
		rules: {
			"no-redeclare": "off",
			"no-empty": ["error", { allowEmptyCatch: true }],
		},
	},

	// Browser-side SPA files
	{
		files: ["hc-static/hc-static-js/**/*.js"],
		languageOptions: {
			sourceType: "script",
			globals: {
				...globals.browser,
				audioBusJS: "readonly",
				audiomanagerJS: "readonly",
				contactJS: "readonly",
				debugJS: "readonly",
				eRegistryJS: "readonly",
				explainerJS: "readonly",
				handlersJS: "readonly",
				initJS: "readonly",
				lockJS: "readonly",
				mathJS: "readonly",
				multimixerJS: "readonly",
				samplerJS: "readonly",
				scriptsJS: "readonly",
				splashJS: "readonly",
				stateJS: "readonly",
				utilsJS: "readonly",
				mmm: "readonly",
				zzz: "readonly",
			},
		},
		rules: {
			...js.configs.recommended.rules,
		},
	},

	// Node/Express server files
	{
		files: ["server.js", "hc-routes/**/*.js", "hc-services/**/*.js"],
		languageOptions: {
			sourceType: "commonjs",
			globals: {
				...globals.node,
			},
		},
		rules: {
			...js.configs.recommended.rules,
		},
	},
	{
		files: ["hc-static/hc-static-js/hc-static-js-*.js"],
		rules: {
			"no-redeclare": "off",
		},
	},
];
