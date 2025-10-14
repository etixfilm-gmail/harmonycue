/* eslint-env browser */

// hc-static-js-scripts.js gets loaded by initJS.injectScriptsParallel
// as part of hc-static-js/hc-static-js-init.js
mmm(`✅ LOADED hc-static-js-scripts.js`);

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
		// c•onsole.log(`\n📊 All AudioContext States:`);
		this.contexts.forEach((context, name) => {
			console.log(`  ${name}: ${context.state}`);
		});
	},

	// Test if contexts can play audio
	testContextPlayback: async function () {
		// c•onsole.log(`\n🧪 Testing AudioContext Playback:`);

		for (let [name, context] of this.contexts) {
			try {
				if (context.state === `suspended`) {
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
				console.log(`❌ [${name}] Test failed:`, error.message);
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
	let componentName = `Unknown`;

	if (stack.includes(`explainer`)) componentName = `Explainer`;
	else if (stack.includes(`sampler`) || stack.includes(`AudioPlayer`))
		componentName = `Sampler`;
	else if (stack.includes(`multimixer`)) componentName = `Multimixer`;

	const fullName = `${componentName}_${contextName}`;

	window.audioContextDiagnostic.trackContextCreation(fullName, context);
	return context;
};

// Add click tracking to see interaction order
// let clickCounter = 0;
const originalAddEventListener = Element.prototype.addEventListener;

Element.prototype.addEventListener = function (type, listener, options) {
	// eRegistryJS.register({ type, listener, options });
	if (
		type === `click` &&
		(this.id?.includes(`sampler`) ||
			this.classList?.contains(`sampler-btn`) ||
			this.id?.includes(`audio-hover`) ||
			this.id?.includes(`enable-audio`))
	) {
		const wrappedListener = function (event) {
			console.log("wrappedListener event", event);
			eRegistryJS.use(event, "wrappedListener");
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
	// c•onsole.log(`\n🧪 === AUDIO CONTEXT DIAGNOSTIC TEST ===\n`);
	window.audioContextDiagnostic.logAllStates();
};

// Auto-run the test setup
// c•onsole.log(`🔧 AudioContext diagnostic test loaded. Run window.runAudioTest() to start.`);
window.runAudioTest();

// ///////////// CONSTANTS ///////////////////////////////// //
//                                                           //
//                                                           //
// const theBody = document.getElementsByTagName(`body`)[0];

// variables for interactive audio playback
// let audioCtx;
// let isPlaying = false;

const trackFiles = [
	// Define track files (Update with actual file paths)
	{
		file: `Gloria Soprano.mp3`,
		label: `Soprano`,
		source: null,
		gainNode: null,
		panNode: null,
		isMuted: false,
	},
	{
		file: `Gloria Alto.mp3`,
		label: `Alto`,
		source: null,
		gainNode: null,
		panNode: null,
		isMuted: false,
	},
	{
		file: `Gloria Tenor.mp3`,
		label: `Tenor`,
		source: null,
		gainNode: null,
		panNode: null,
		isMuted: false,
	},
	{
		file: `Gloria Bass.mp3`,
		label: `Bass`,
		source: null,
		gainNode: null,
		panNode: null,
		isMuted: false,
	},
	{
		file: `Gloria Orch.mp3`,
		label: `Orchestra Accomp.`,
		source: null,
		gainNode: null,
		panNode: null,
		isMuted: false,
	},
	{
		file: `Gloria Piano.mp3`,
		label: `Piano Accomp.`,
		source: null,
		gainNode: null,
		panNode: null,
		isMuted: false,
	},
	{
		file: `Gloria Click.mp3`,
		label: `Click Track`,
		source: null,
		gainNode: null,
		panNode: null,
		isMuted: false,
	},
];
//                                                           //
//                                                           //
// ///////////// END CONSTANTS ///////////////////////////// //

// ///////////// MOBILE PRELOAD //////////////////////////// //
//                                                           //
//                                                           //

// Global mobile audio preload handler
window.setupMobileAudioPreload = function () {
	// if (!isMobileDevice || !isMobileDevice()) return;

	console.log("📱 Setting up mobile audio preload handler");

	const loadOnTouch = () => {
		// Find ALL audio elements and trigger loading
		const audioElements = document.querySelectorAll("audio");
		audioElements.forEach((audio) => {
			if (audio.preload === "none") {
				audio.preload = "metadata";
				audio.load();
				console.log(`📱 Mobile: Loading audio ${audio.src || audio.id}`);
			}
		});

		document.removeEventListener("touchstart", loadOnTouch);
		document.removeEventListener("click", loadOnTouch);
	};

	document.addEventListener("touchstart", loadOnTouch, { once: true });
	// document.addEventListener("click", loadOnTouch, { once: true });
	document.addEventListener(
		"click",
		(event) => {
			eRegistryJS.register(event);
			loadOnTouch();
		},
		{ once: true }
	);
};

//                                                           //
//                                                           //
// ///////////// END MOBILE PRELOAD //////////////////////// //

// ///////////// INITIALIZER /////////////////////////////// //
//                                                           //
//                                                           //

//                                                           //
//                                                           //
// ///////////// END INITIALIZER /////////////////////////// //

window.calculateLabelWidth = function () {
	const longestLabel = trackFiles.reduce(
		(max, track) => (track.label.length > max.length ? track.label : max),
		``
	);
	// return (estimatedWidthVW = longestLabel.length);
	return longestLabel.length;
};

/*
// BIG INITIALIZER
document.addEventListener(`DxOMContentLoaded`, async (event) => {
	c‡onst ev‡entIndex = eRegistryJS.register(event);

	window.setupMobileAudioPreload;

	// This will run after all scripts are loaded
	if (multimixerJS.trackData && Array.isArray(multimixerJS.trackData)) {
		multimixerJS.mxrTrackArray = multimixerJS.setupTrackListFromJSON();
	} else {
		console.error(`mxrTracksList data is not available`);
		multimixerJS.mxrTrackArray = [];
	}
	// c•onsole.log(`multimixerJS.mxrTrackArray: ${JSON.stringify(multimixerJS.mxrTrackArray)}`);
	// multimixerJS.currentSong = multimixerJS.songName || `Track`;

	const multimixerSection = document.getElementById(`multimixer`);

	if (!multimixerSection) {
		console.warn(`No multimixer section found!`);
	} else if (!window.multimixerJS?.init) {
		console.warn(`multimixerJS.init() not available!`);
	} else {
		// c•onsole.log(`Multimixer section and script OK — initializing...`);
		// multimixerJS.init() is part of hc-static-js-multimixer.js
		multimixerJS.init();
	}

	initHarmonyCue();

	if (explainerJS?.init) {
		explainerJS.init();
	}

	// Add other section initializers here
});
*/

/////////////////// Debugging Event Tracker ///////////////////
//                                                           //
//                                                           //
// 🔍 Searchable Event Registry System
// Tracks all events and their usage across handlers

// 🧪 Example integration with your event handlers:
/*
explainerJS.hoverArea.addEventListener("pointerdown", (event) => {
c‡onst ev‡entIndex = registerEvent(event, "pointerdown-listener");
    useEvent(event, "pointerdown-handler");
    
    console.log(`👆 Pointer down [Event #${eventIndex}]`);
    xxx(event);
    
    // Your existing handler code...
});

explainerJS.hoverArea.addEventListener("pointerup", (event) => {
c‡onst ev‡entIndex = registerEvent(event, "pointerup-listener");
    useEvent(event, "pointerup-handler");
    
    console.log(`👆 Pointer up [Event #${eventIndex}]`);
    xxx(event);
    
    // Your existing handler code...
});
*/

// 🔍 Search examples:
/*
// Find all pointer events
eRegistryJS.findByType("pointerdown");

// Find overused events (called more than 3 times)
eRegistryJS.findOverused(3);

// Get statistics
eRegistryJS.getStats();

// Log all events in a table
eRegistryJS.logAll();

// Log specific event details
eRegistryJS.logEvent(5);

// Find all touch events
eRegistryJS.findByPointerType("touch");
*/

// console.log("🔍 Event Registry System loaded");
// console.log("📊 Use eRegistryJS.getStats() to see usage statistics");
// console.log("📋 Use eRegistryJS.logAll() to see all events");
