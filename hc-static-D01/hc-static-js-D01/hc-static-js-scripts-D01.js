/* eslint-env browser */

document.querySelector("body");

qq("hc-static-js-scripts.js is loaded");

// AudioContext Diagnostic Test
// Add this temporarily to your main scripts file or run it in browser console

window.audioContextDiagnostic = {
	contexts: new Map(),

	// Track all AudioContext creations
	trackContextCreation: function (name, context) {
		this.contexts.set(name, context);
		// c•onsole.log(`🎵 [${name}] AudioContext created:`, {state: context.state, sampleRate: context.sampleRate, timestamp: Date.now(),});

		// Listen for state changes
		const originalStateChange = context.onstatechange;
		context.onstatechange = () => {
			// c•onsole.log(`🔄 [${name}] State changed to: ${context.state}`);
			this.logAllStates();
			if (originalStateChange) originalStateChange.call(context);
		};
	},

	// Log current state of all contexts
	logAllStates: function () {
		// c•onsole.log("\n📊 All AudioContext States:");
		this.contexts.forEach((context, name) => {
			// c•onsole.log(`  ${name}: ${context.state}`);
		});
	},

	// Test if contexts can play audio
	testContextPlayback: async function () {
		// c•onsole.log("\n🧪 Testing AudioContext Playback:");

		for (let [name, context] of this.contexts) {
			try {
				if (context.state === "suspended") {
					// c•onsole.log(`⏸️  [${name}] Suspended - attempting resume...`);
					await context.resume();
				}

				// Create a brief test tone
				const oscillator = context.createOscillator();
				const gainNode = context.createGain();

				oscillator.connect(gainNode);
				gainNode.connect(context.destination);

				oscillator.frequency.setValueAtTime(440, context.currentTime);
				gainNode.gain.setValueAtTime(0.1, context.currentTime);
				gainNode.gain.exponentialRampToValueAtTime(
					0.001,
					context.currentTime + 0.1
				);

				oscillator.start(context.currentTime);
				oscillator.stop(context.currentTime + 0.1);

				// c•onsole.log(`✅ [${name}] Test tone scheduled successfully`);
			} catch (error) {
				// c•onsole.log(`❌ [${name}] Test failed:`, error.message);
			}
		}
	},
};

// Monkey patch AudioContext constructor to track creations
const OriginalAudioContext = window.AudioContext || window.webkitAudioContext;
let contextCounter = 0;

window.AudioContext = window.webkitAudioContext = function (...args) {
	const context = new OriginalAudioContext(...args);
	const contextName = `Context_${++contextCounter}`;

	// Try to identify which component created this context
	const stack = new Error().stack;
	let componentName = "Unknown";

	if (stack.includes("explainer")) componentName = "Explainer";
	else if (stack.includes("sampler") || stack.includes("AudioPlayer"))
		componentName = "Sampler";
	else if (stack.includes("multimixer")) componentName = "Multimixer";

	const fullName = `${componentName}_${contextName}`;

	window.audioContextDiagnostic.trackContextCreation(fullName, context);
	return context;
};

// Add click tracking to see interaction order
let clickCounter = 0;
const originalAddEventListener = Element.prototype.addEventListener;

Element.prototype.addEventListener = function (type, listener, options) {
	if (
		type === "click" &&
		(this.id?.includes("sampler") ||
			this.classList?.contains("sampler-btn") ||
			this.id?.includes("audio-hover") ||
			this.id?.includes("enable-audio"))
	) {
		const wrappedListener = function (event) {
			// c•onsole.log(`👆 Click #${++clickCounter} on:`, { id: this.id, classes: Array.from(this.classList || []), timestamp: Date.now(), });

			// Log context states before handling click
			setTimeout(() => {
				window.audioContextDiagnostic.logAllStates();
			}, 100);

			return listener.call(this, event);
		};

		return originalAddEventListener.call(this, type, wrappedListener, options);
	}

	return originalAddEventListener.call(this, type, listener, options);
};

// Test scenarios
window.runAudioTest = async function () {
	// c•onsole.log("\n🧪 === AUDIO CONTEXT DIAGNOSTIC TEST ===\n");

	// c•onsole.log("1. Current AudioContext states:");
	window.audioContextDiagnostic.logAllStates();

	// c•onsole.log("2. Instructions for manual testing:");
	// c•onsole.log("   a) First click a SAMPLER button");
	// c•onsole.log("   b) Then try the EXPLAINER hover area");
	// c•onsole.log("   c) Check console logs for context states");
	// c•onsole.log("   d) Run window.audioContextDiagnostic.testContextPlayback() to test each context");

	// c•onsole.log("\n3. Expected problem pattern:");
	// c•onsole.log('   - If sampler clicked first: Sampler context = "running", Explainer context = "suspended"');
	// c•onsole.log("   - This would explain why explainer audio doesn't work");

	// c•onsole.log("\n🎯 Watch the console as you interact with different components!\n");
};

// Auto-run the test setup
// c•onsole.log("🔧 AudioContext diagnostic test loaded. Run window.runAudioTest() to start.");
window.runAudioTest();

// ///////////// CONSTANTS ///////////////////////////////// //
//                                                           //
//                                                           //
const theBody = document.getElementsByTagName("body")[0];

// variables for interactive audio playback
let audioCtx;
let isPlaying = false;

const trackFiles = [
	// Define track files (Update with actual file paths)
	{
		file: "Gloria Soprano.mp3",
		label: "Soprano",
		source: null,
		gainNode: null,
		panNode: null,
		isMuted: false,
	},
	{
		file: "Gloria Alto.mp3",
		label: "Alto",
		source: null,
		gainNode: null,
		panNode: null,
		isMuted: false,
	},
	{
		file: "Gloria Tenor.mp3",
		label: "Tenor",
		source: null,
		gainNode: null,
		panNode: null,
		isMuted: false,
	},
	{
		file: "Gloria Bass.mp3",
		label: "Bass",
		source: null,
		gainNode: null,
		panNode: null,
		isMuted: false,
	},
	{
		file: "Gloria Orch.mp3",
		label: "Orchestra Accomp.",
		source: null,
		gainNode: null,
		panNode: null,
		isMuted: false,
	},
	{
		file: "Gloria Piano.mp3",
		label: "Piano Accomp.",
		source: null,
		gainNode: null,
		panNode: null,
		isMuted: false,
	},
	{
		file: "Gloria Click.mp3",
		label: "Click Track",
		source: null,
		gainNode: null,
		panNode: null,
		isMuted: false,
	},
];
//                                                           //
//                                                           //
// ///////////// END CONSTANTS ///////////////////////////// //

// ///////////// INITIALIZER /////////////////////////////// //
//                                                           //
//                                                           //
function initHarmonyCue() {
	qq("function initHarmonyCue()");

	// Force scroll to top
	if ("scrollRestoration" in history) {
		history.scrollRestoration = "manual";
	}

	setTimeout(() => window.scrollTo(0, 0), 10);

	// Lock scrolling
	document.documentElement.classList.add("scroll-lock");
	document.body.classList.add("scroll-lock");

	// Setup system variables attached to document
	updateComponentSizeVars();

	// Splash animation (if defined)
	if (typeof startSplashAnimation === "function") {
		startSplashAnimation();
	}

	registerWindowEvents();

	// Explainer audio player
	if (
		window.explainerJS?.addHoverPlayer &&
		document.getElementById("audio-hover-area")
	) {
		explainerJS.addHoverPlayer();
	}

	const unlockAndReplayHandler = (e) => {
		// c•onsole.log(`🟢 First interaction: ${e.type} on`, e.target);

		if (explainerJS.audioIsLocked) {
			explainerJS.unlockAudioContext(); // unlock audio
		}
	};

	// One-time listeners
	document.addEventListener("pointerdown", unlockAndReplayHandler, {
		once: true,
	});

	document.addEventListener("keydown", unlockAndReplayHandler, { once: true });

	document
		.getElementById("sampler-section")
		.addEventListener("play-start", (e) => {
			// c•onsole.log(`play-start (${e.target.id}) => {}`);
			const sampler = e.currentTarget;
			// c•onsole.log(`sampler = e.currentTarget (${e.currentTarget.id}) => {}`);
			const activePlayer = e.target;
			// c•onsole.log(`activePlayer = e.target (${e.target.id}) => {}`);
			// turn on the progress line
			activePlayer.samplerTimelineSlider.classList.add("on");

			// iterate through all the tracks and shut off all be the selected one
			sampler.querySelectorAll("audio-player").forEach((player) => {
				// c•onsole.log(`activePlayer: (${e.target.id} =? player: (${player.id}) ${player == activePlayer}`);
				if (
					player !== activePlayer &&
					player.samplerTimelineSlider.classList.contains("on")
				) {
					player.samplerTimelineSlider.classList.remove("on");
				}
				// c•onsole.log(`player !== activePlayer: ${player !== activePlayer}`);
				// c•onsole.log(`player.isPlaying?.(): ${player.isPlaying?.()}`);
				// c•onsole.log(`typeof player.resetPlayBtn === "function": ${typeof player.resetPlayBtn === "function"}`);
				if (
					player !== activePlayer &&
					player.isPlaying?.() &&
					typeof player.resetPlayBtn === "function"
				) {
					player.togglePlay?.();
					player.resetPlayBtn();
				}
				// c•onsole.log(`player.samplerTimelineSlider.classList: ${player.samplerTimelineSlider.className}`);
			});
		});

	// Add more section-specific logic here as needed
}

// check to see if the page is being requested by a handheld device
function isMobile() {
	return window.innerWidth <= 600 || /Mobi|Android/i.test(navigator.userAgent);
}

function registerWindowEvents() {
	qq("function registerWindowEvents()");

	window.addEventListener("resize", () => {
		// Update player width on resize
		updateComponentSizeVars();
	});

	window.addEventListener("load", () => {
		qq("window.addEventListener('load') triggered");
		// Update player width on load
		updateComponentSizeVars();
		startSplashAnimation();
	});
}
//                                                           //
//                                                           //
// ///////////// END INITIALIZER /////////////////////////// //

function calculateLabelWidth() {
	const longestLabel = trackFiles.reduce(
		(max, track) => (track.label.length > max.length ? track.label : max),
		""
	);
	return (estimatedWidthVW = longestLabel.length);
}

function updateComponentSizeVars() {
	qq("function updateComponentSizeVars()");

	const sectionWidth = Math.min(Math.max(window.innerWidth, 600), 1500) * 0.8; // Get current width in pixels
	const pixelSize = Number((sectionWidth * 0.002).toFixed(4));
	const trackHeight = Math.max(sectionWidth * 0.06, 52);
	const btnSize = Math.max(sectionWidth * 0.055, 48);
	const dialSize = Math.max(sectionWidth * 0.05, 48);
	const sliderHeight = Math.max(sectionWidth * 0.0125, 12);
	const labelWidth = calculateLabelWidth() * sectionWidth * 0.013;

	const samplerBorderWidth = Number((sectionWidth * 0.0032).toFixed(4));
	const samplerTrackHeight = trackHeight * 1.1;
	const samplerSliderWidth = Math.max(sectionWidth * 0.125, 100);
	const samplerVolumeIconSize = btnSize * 0.65;
	const samplerLine2Width =
		samplerSliderWidth + samplerVolumeIconSize + pixelSize * 10;
	const samplerCanvasWidth = sectionWidth - btnSize - samplerLine2Width;
	const samplerLine1Width = sectionWidth - samplerLine2Width;

	const fontXs = Number((sectionWidth * 0.1 ** 2).toFixed(4));
	const fontSm = Number((sectionWidth * 0.15).toFixed(4));
	const fontMd = Number((sectionWidth * 0.2).toFixed(4));
	const fontRg = Number((sectionWidth * 0.25).toFixed(4));
	const fontLg = Number((sectionWidth * 0.3).toFixed(4));
	const fontXl = Number((sectionWidth * 0.35).toFixed(4));
	const font01 = Number((sectionWidth * (0.01 + 0.005 * 1)).toFixed(4));
	const font02 = Number((sectionWidth * (0.01 + 0.005 * 2)).toFixed(4));
	const font03 = Number((sectionWidth * (0.01 + 0.005 * 3)).toFixed(4));
	const font04 = Number((sectionWidth * (0.01 + 0.005 * 4)).toFixed(4));
	const font05 = Number((sectionWidth * (0.01 + 0.005 * 5)).toFixed(4));
	const font06 = Number((sectionWidth * (0.01 + 0.005 * 6)).toFixed(4));
	const font07 = Number((sectionWidth * (0.01 + 0.005 * 7)).toFixed(4));
	const font08 = Number((sectionWidth * (0.01 + 0.005 * 8)).toFixed(4));
	const font09 = Number((sectionWidth * (0.01 + 0.005 * 9)).toFixed(4));
	const font10 = Number((sectionWidth * (0.01 + 0.005 * 10)).toFixed(4));
	const font11 = Number((sectionWidth * (0.01 + 0.005 * 11)).toFixed(4));
	const font12 = Number((sectionWidth * (0.01 + 0.005 * 12)).toFixed(4));
	const font13 = Number((sectionWidth * (0.01 + 0.005 * 13)).toFixed(4));
	const font14 = Number((sectionWidth * (0.01 + 0.005 * 14)).toFixed(4));
	const font15 = Number((sectionWidth * (0.01 + 0.005 * 15)).toFixed(4));
	const font16 = Number((sectionWidth * (0.01 + 0.005 * 16)).toFixed(4));
	const font17 = Number((sectionWidth * (0.01 + 0.005 * 17)).toFixed(4));
	const font18 = Number((sectionWidth * (0.01 + 0.005 * 18)).toFixed(4));
	document.documentElement.style.setProperty(
		"--section-width",
		`${sectionWidth}px`
	);
	document.documentElement.style.setProperty("--px", `${pixelSize}px`);
	document.documentElement.style.setProperty("--font-xs", `${fontXs}px`);
	document.documentElement.style.setProperty("--font-sm", `${fontSm}px`);
	document.documentElement.style.setProperty("--font-md", `${fontMd}px`);
	document.documentElement.style.setProperty("--font-rg", `${fontRg}px`);
	document.documentElement.style.setProperty("--font-lg", `${fontLg}px`);
	document.documentElement.style.setProperty("--font-xl", `${fontXl}px`);

	document.documentElement.style.setProperty("--font-01", `${font01}px`);
	document.documentElement.style.setProperty("--font-02", `${font02}px`);
	document.documentElement.style.setProperty("--font-03", `${font03}px`);
	document.documentElement.style.setProperty("--font-04", `${font04}px`);
	document.documentElement.style.setProperty("--font-05", `${font05}px`);
	document.documentElement.style.setProperty("--font-06", `${font06}px`);
	document.documentElement.style.setProperty("--font-07", `${font07}px`);
	document.documentElement.style.setProperty("--font-08", `${font08}px`);
	document.documentElement.style.setProperty("--font-09", `${font09}px`);
	document.documentElement.style.setProperty("--font-10", `${font10}px`);
	document.documentElement.style.setProperty("--font-11", `${font11}px`);
	document.documentElement.style.setProperty("--font-12", `${font12}px`);
	document.documentElement.style.setProperty("--font-13", `${font13}px`);
	document.documentElement.style.setProperty("--font-14", `${font14}px`);
	document.documentElement.style.setProperty("--font-15", `${font15}px`);
	document.documentElement.style.setProperty("--font-16", `${font16}px`);
	document.documentElement.style.setProperty("--font-17", `${font17}px`);
	document.documentElement.style.setProperty("--font-18", `${font18}px`);
	document.documentElement.style.setProperty(
		"--track-height",
		`${trackHeight}px`
	);

	document.documentElement.style.setProperty(
		"--sampler-border-width",
		`${samplerBorderWidth}px`
	);
	document.documentElement.style.setProperty(
		"--sampler-slider-width",
		`${samplerSliderWidth}px`
	);
	document.documentElement.style.setProperty(
		"--sampler-volume-icon-size",
		`${samplerVolumeIconSize}px`
	);
	document.documentElement.style.setProperty(
		"--sampler-canvas-width",
		`${samplerCanvasWidth}px`
	);
	document.documentElement.style.setProperty(
		"--sampler-line-1-width",
		`${samplerLine1Width}px`
	);
	document.documentElement.style.setProperty(
		"--sampler-line-2-width",
		`${samplerLine2Width}px`
	);
	document.documentElement.style.setProperty(
		"--sampler-track-height",
		`${samplerTrackHeight}px`
	);

	document.documentElement.style.setProperty("--btn-size", `${btnSize}px`);
	document.documentElement.style.setProperty("--dial-size", `${dialSize}px`);
	document.documentElement.style.setProperty(
		"--slider-height",
		`${sliderHeight}px`
	);
	document.documentElement.style.setProperty(
		"--label-width",
		`${labelWidth}px`
	);
	document.documentElement.style.setProperty("section-width-set", true);
	multimixerJS.calculateTimelineOffset; // margin between player border and timeline
	// sizeTest.innerHTML = `--btn-size: ${btnSize}`;
	qq(`--player-width OBSOLETE | --section-width: ${sectionWidth}px`);
	qq(`--font-sm: ${fontSm}px`);
	// qq(`--px: ${pixelSize}px`);
	// qq(`--btn-size: ${btnSize}px`);
	// qq(`--section-width: ${sectionWidth}px`);
	// qq(`--slider-height: ${sliderHeight}px`);
	// qq(`--label-width: ${labelWidth}px`);
}

/////////////////// Waiting Functions /////////////////////////
//                                                           //
//                                                           //
function waitForFunction(
	functionName,
	callback,
	interval = 100,
	timeout = 5000
) {
	const startTime = Date.now();

	function checkFunction() {
		if (typeof window[functionName] === "function") {
			qq(`Function ${functionName} is available. Executing callback.`);
			callback();
		} else if (Date.now() - startTime < timeout) {
			setTimeout(checkFunction, interval);
		} else {
			console.warn(`Timeout waiting for function: ${functionName}`);
		}
	}

	checkFunction();
}

function waitForProperty(
	element,
	property,
	targetValue,
	callback,
	interval = 50,
	timeout = 2000
) {
	const startTime = Date.now();

	function checkProperty() {
		const computedStyle = getComputedStyle(element);
		const currentValue = computedStyle.getPropertyValue(property).trim();

		qq(`Checking ${property}: current=${currentValue}, target=${targetValue}`);

		if (currentValue === targetValue) {
			qq(`Property ${property} reached value ${targetValue}. Applying class.`);
			callback();
		} else if (Date.now() - startTime < timeout) {
			setTimeout(checkProperty, interval);
		} else {
			console.warn(`Timeout waiting for ${property} to reach ${targetValue}`);
		}
	}

	checkProperty();
}

function waitForElement(selector, callback) {
	qq(`Waiting for element: ${selector}`);

	// Check if element already exists
	const existingElement = document.querySelector(selector);
	if (existingElement) {
		qq(`${selector} already exists, sending callback...`);
		callback(existingElement);
		return;
	}

	// Create observer
	const observer = new MutationObserver((mutations, obs) => {
		const element = document.querySelector(selector);
		if (element) {
			qq(`Found ${selector}, , sending callback...`);
			obs.disconnect(); // Stop observing once found
			callback(element);
		}
	});

	// Observe changes in the document body (or a more specific container)
	observer.observe(document.body, {
		childList: true,
		subtree: true, // Ensures we detect elements added anywhere in the body
	});
}
//                                                           //
//                                                           //
/////////////////// END Wait Functions ////////////////////////

document.addEventListener("DOMContentLoaded", async () => {
	qq(`DOMContentLoaded - triggered`);

	// ✅ Always update CSS custom properties FIRST
	if (typeof updateComponentSizeVars === "function") {
		qq("Updating CSS component size variables...");
		updateComponentSizeVars();
	}

	// This will run after all scripts are loaded
	if (multimixerJS.trackData && Array.isArray(multimixerJS.trackData)) {
		multimixerJS.mxrTrackArray = multimixerJS.setupTrackListFromJSON();
	} else {
		console.error("mxrTracksList data is not available");
		multimixerJS.mxrTrackArray = [];
	}
	// c•onsole.log(`multimixerJS.mxrTrackArray: ${JSON.stringify(multimixerJS.mxrTrackArray)}`);
	// multimixerJS.currentSong = multimixerJS.songName || "Track";

	const multimixerSection = document.getElementById("multimixer");

	if (!multimixerSection) {
		console.warn("No multimixer section found!");
	} else if (!window.multimixerJS?.init) {
		console.warn("multimixerJS.init() not available!");
	} else {
		qq("Multimixer section and script OK — initializing...");
		// multimixerJS.init() is part of hc-static-js-multimixer.js
		multimixerJS.init();
	}

	/*
	if (multimixerSection) {
		qq("Initializing multimixerJS...");

		try {
			multimixerJS.lastAppliedPreset = "custom"; // ✅ Default

			multimixerJS.setControlsEnabled(false); // 🚫 Disable controls

			await multimixerJS.initializeTracks(); // ✅ Wait for all tracks loaded
			multimixerJS.setupTrackControls();
			multimixerJS.setupDialControls();
			multimixerJS.setupMuteButtons();
			multimixerJS.initTimelineSlider();
			multimixerJS.setupVoiceChangeHandlers();
			multimixerJS.setControlsEnabled(true); // ✅ Enable controls

			// 🔥 Only after tracks loaded: Wire preset buttons
			document
				.getElementById("custom-mix-btn")
				.addEventListener("click", () => {
					qq("Switching to custom Mix mode");
					multimixerJS.lastAppliedPreset = "custom";
				});

			document
				.getElementById("stereo-split-btn")
				.addEventListener("click", () => {
					const selectedVoice = multimixerJS.getSelectedVoice();
					if (!selectedVoice) {
						const sopranoRadio = document.querySelector(
							'input[name="voice"][value="Soprano"]'
						);
						if (sopranoRadio) sopranoRadio.checked = true;
					}
					multimixerJS.lastAppliedPreset = "stereo-split";
					multimixerJS.applyStereoSplitPreset();
				});

			document
				.getElementById("part-predominant-btn")
				.addEventListener("click", () => {
					const selectedVoice = multimixerJS.getSelectedVoice();
					if (!selectedVoice) {
						const sopranoRadio = document.querySelector(
							'input[name="voice"][value="Soprano"]'
						);
						if (sopranoRadio) sopranoRadio.checked = true;
					}
					multimixerJS.lastAppliedPreset = "part-predominant";
					multimixerJS.applyPartPredominantPreset();
				});
		} catch (error) {
			console.error("Error during multimixerJS initialization:", error);
		}
	} else {
		console.warn("multimixer section not found!");
	} */

	initHarmonyCue();

	if (window.explainerJS?.init) {
		explainerJS.init();
	}

	// Add other section initializers here
});

function qq(consoleLogString) {
	// c•onsole.log(consoleLogString);
}
