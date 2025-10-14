// hc-static-js-state.js gets loaded by initJS.injectScriptsParallel
// as part of hc-static-js/hc-static-js-init.js
mmm(`✅ LOADED hc-static-js-state.js`);

// hc-static-js-state.js
// Centralized shared state module for audio, UI, platform, and unlock

const stateJS = (window.stateJS = window.stateJS || {});

// Audio state (global control and unlock)
stateJS.audio = {
	isUnlocked: false, // ✅ True if AudioContext is running
	attemptedUnlock: false, // ✅ Has user attempted unlock gesture?
	isLocked: true, // Derived, mirrors !isUnlocked
	contexts: new Map(), // Populated by audioContextDiagnostic
	lastUnlockEvent: null, // Pointer/keyboard event that triggered unlock
};

// UI state (splash animation, DOM readiness)
stateJS.page = {
	initStarted: false,
	initFinished: false,
	splashStarted: false,
	coverImageReady: false,
	promptRemoved: false,
	overlayRemoved: false,
};

// Device and platform info (already partially in window.PLATFORM)
stateJS.device = {
	type: "desktop", // or "mobile"
	initialWidth: window.initialMobileWidth || window.innerWidth,
	isMobile: window.PLATFORM?.isMobile || false,
	isIOS: window.PLATFORM?.isIOS || false,
	isAndroid: window.PLATFORM?.isAndroid || false,
	isSafari: window.PLATFORM?.isSafari || false,
	supportsTouch: window.PLATFORM?.supportsTouch || false,
};

// placeholder init function
stateJS.init = function () {
	//z•zz();
	mmm("🎬 Starting stateJS.init()");
};

// Debug utility
stateJS.log = function () {
	console.log("🧠 Current state snapshot:");
	console.table(JSON.parse(JSON.stringify(this)));
};
