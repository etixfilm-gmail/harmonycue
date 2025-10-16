// hc-static-js-explainer.js gets loaded by initJS.injectScriptsParallel()
// as part of hc-static-js/hc-static-js-init.js
// m•mm(`✅ LOADED hc-static-js-explainer.js`);

// hc-static-js-explainer.js (updated with custom mobile pointer logic)

const explainerJS = (window.explainerJS = window.explainerJS || {});

explainerJS._hoverRect = null;

explainerJS.state = {
	audioContextNeedsResume: false,
	audioTime: 0,
	ctxStartTime: null,
	currentFadeTimeout: null,
	holdTimer: null,
	hoverArea: null,
	hoverAudioReady: false,
	hoverHasPointerenter: false,
	ignoreUp: false,
	isHolding: false,
	isHovering: false,
	isMoving: false,
	isPaused: false,
	isPlaying: false,
	lastInteractionType: null,
	lastPausedTime: 0,
	lastTapWasToggleOff: false,
	lastUnlockTime: null,
	playStartTime: 0,
	playRunningTime: 0,
	pausedAt: 0,
	pauseDuration: 0,
	pauseStartTime: 0,
	requiresUserGesture: window.PLATFORM.isMobile,
	resumeOffset: 0,
	tapEndTime: 0,
	tapStartTime: 0,
	touchMoved: false,
	touchStart: { x: 0, y: 0, time: 0 },
	touchStartTime: 0,
	userStopped: false,
	wasTapped: false,
};

// Audio elements
explainerJS.hoverAudio = {
	audioElement: null,
	track: null,
	splitter: null,
	masterGainNode: null,
	leftGainNode: null,
	rightGainNode: null,
	merger: null,
};

// listener flags for listener gating
explainerJS.hoverListenerFlags = {
	audiounlock: false,
	pointerenter: false,
	pointerleave: false,
	pointermove: false,
	pointerdown: false,
	pointerup: false,
};

// List of objects that can be passed to utilsJS.addListener(obj) or .removeListener(obj)
explainerJS.hoverListenerObjects = null;

// c•onfiguration
const CONFIG = {
	hoverAudioSrc: "/hc-static-media/Give My Regards to Broadway LOOP.mp3",
	fadeInMs: 25,
	fadeOutMs: 250,
	gainLeftDivisor: 0.333,
	gainLeftOffset: 0.7,
	gainRightDivisor: 0.242,
	gainRightOffset: 0.125,
	pauseResetThresholdMs: 5000,
	touchHoldThresholdMs: 300,
	touchMoveThresholdPx: 10,
};

explainerJS.init = async function () {
	// m•mm("🎬 Starting explainerJS.init()");

	try {
		explainerJS.state.hoverArea =
			await utilsJS.waitForElement("#audio-hover-area");
	} catch (err) {
		console.log(
			`⚠️ explainerJS.init(): hover area not found or timed out: ${err}`
		);
		return false;
	}

	explainerJS.initListenerObjects();

	const listeners = explainerJS.hoverListenerObjects;
	utilsJS.addListener(listeners["pointerenter"]);
	utilsJS.addListener(listeners["pointerleave"]);
	utilsJS.addListener(listeners["pointermove"]);
	utilsJS.addListener(listeners["pointerup"]);
	utilsJS.addListener(listeners["pointerdown"]);
	utilsJS.addListener(listeners["audiounlock"]);

	explainerJS.refreshHoverRect();

	// Here's where the global AudioContext gets created once and only once
	const audioCtx = audiomanagerJS.getAudioCtx();

	// Create HTML5 audio element
	const audioElement = new Audio(
		"/hc-static-media/Give My Regards to Broadway LOOP.mp3"
	);
	audioElement.loop = true;
	audioElement.crossOrigin = "anonymous";
	audioElement.preload = "auto";

	// Create MediaElementSource
	const track = audioCtx.createMediaElementSource(audioElement);

	// Create stereo splitter/merger architecture
	const splitter = audioCtx.createChannelSplitter(2); // Split into L/R
	const leftGain = audioCtx.createGain();
	const rightGain = audioCtx.createGain();
	const merger = audioCtx.createChannelMerger(2); // Merge back to stereo

	// Set initial gains
	leftGain.gain.value = 1.0;
	rightGain.gain.value = 1.0;

	// connect: track → splitter → [L/R gains] → merger → destination
	track.connect(splitter);
	splitter.connect(leftGain, 0); // Left channel
	splitter.connect(rightGain, 1); // Right channel
	leftGain.connect(merger, 0, 0); // Left to left
	rightGain.connect(merger, 0, 1); // Right to right

	// REMOVE merger.connect(audioCtx.destination);

	// Add master gain for fade control
	const masterGain = audioCtx.createGain();
	masterGain.gain.value = 0; // Start at 0 for fade-in
	merger.connect(masterGain);
	masterGain.connect(audioCtx.destination);

	// Store references
	const hovAud = explainerJS.hoverAudio;
	hovAud.audioElement = audioElement;
	hovAud.track = track;
	hovAud.splitter = splitter;
	hovAud.masterGainNode = masterGain;
	hovAud.leftGainNode = leftGain;
	hovAud.rightGainNode = rightGain;
	hovAud.merger = merger;

	explainerJS.state.isPlaying = false;
	explainerJS.state.isPaused = false;

	this.registerWithAudioManager();

	mmm("✅ explainerJS initialized");
};

explainerJS.initListenerObjects = function () {
	const hoverArea = explainerJS.state.hoverArea;
	explainerJS.hoverListenerObjects = {
		audiounlock: {
			DOMElement: hoverArea,
			eventType: "audiounlock",
			fnCall: explainerJS.onUnlockTest,
			listenerFlags: explainerJS.hoverListenerFlags,
		},
		pointerup: {
			DOMElement: hoverArea,
			eventType: "pointerup",
			fnCall: explainerJS.onUpEventTest,
			listenerFlags: explainerJS.hoverListenerFlags,
		},
		pointerdown: {
			DOMElement: hoverArea,
			eventType: "pointerdown",
			fnCall: explainerJS.onDownEventTest,
			listenerFlags: explainerJS.hoverListenerFlags,
		},
		pointerenter: {
			DOMElement: hoverArea,
			eventType: "pointerenter",
			fnCall: explainerJS.onEnterEventTest,
			listenerFlags: explainerJS.hoverListenerFlags,
		},
		pointerleave: {
			DOMElement: hoverArea,
			eventType: "pointerleave",
			fnCall: explainerJS.onLeaveEventTest,
			listenerFlags: explainerJS.hoverListenerFlags,
		},
		pointermove: {
			DOMElement: hoverArea,
			eventType: "pointermove",
			fnCall: explainerJS.onMoveEventTest,
			listenerFlags: explainerJS.hoverListenerFlags,
		},
	};
};

explainerJS.onUnlockTest = function (event) {
	const flags = explainerJS.hoverListenerFlags;
	event = eRegistryJS.register(event);
	eRegistryJS.use(event, "explainerJS.onUnlockTest");
	if (!flags.audiounlock) return;

	explainerJS._hoverRect = explainerJS.state.hoverArea.getBoundingClientRect();
	explainerJS.updateStereo(event);
	audiomanagerJS.play("explainer");
	// c•onsole.log(`🎧 REMOVE ALL UNLOCK LISTENERS`);
	flags.audiounlock = false;
	// flags.pointermove = true;
	flags.pointerleave = true;
	flags.pointerdown = true;
	// c•onsole.log(`onUnlockTest:${event.type}`);
};

explainerJS.onDownEventTest = function (event) {
	const flags = explainerJS.hoverListenerFlags;
	if (!flags.pointerdown) return;
	event = eRegistryJS.register(event);
	eRegistryJS.use(event, "explainerJS.onDownEventTest");
	explainerJS.state.tapStartTime = performance.now();
	explainerJS.state.tapEndTime = 0;
	explainerJS.state.wasTapped = false;

	flags.pointerup = true;
	flags.pointerdown = false;
	// flags.pointermove = true;
	// c•onsole.log(`onDownEventTest:${event.type}`);
};

explainerJS.onUpEventTest = function (event) {
	const flags = explainerJS.hoverListenerFlags;
	if (!flags.pointerup) return;
	event = eRegistryJS.register(event);
	eRegistryJS.use(event, "explainerJS.onUpEventTest");
	explainerJS.state.tapEndTime = performance.now();
	if (explainerJS.state.tapEndTime - explainerJS.state.tapStartTime > 300) {
		// held too long, not a tap
		explainerJS.state.tapStartTime = 0;
		return;
	}

	flags.pointerup = false;
	flags.pointerdown = true;
	// flags.pointermove = true;
	// m•mm(`✅ Tap event duration: ${(explainerJS.state.tapEndTime - explainerJS.state.tapStartTime).toFixed(2)}`);

	explainerJS.togglePlay(event);
};

explainerJS.onMoveEventTest = function (event) {
	const flags = explainerJS.hoverListenerFlags;
	if (!flags.pointermove) return;
	if (!explainerJS.state.isMoving) {
		event = eRegistryJS.register(event);
		eRegistryJS.use(event, "explainerJS.onMoveEventTest");
		explainerJS.state.isMoving = true;
		// c•onsole.log(`onMoveEventTest:${event.type}`);
	}
	explainerJS.updateStereo(event);
	// c•onsole.log(`🎧 SET STEREO BALANCE`);
};

explainerJS.onLeaveEventTest = function (event) {
	const flags = explainerJS.hoverListenerFlags;
	if (!flags.pointerleave) return;
	event = eRegistryJS.register(event);
	eRegistryJS.use(event, "explainerJS.onLeaveEventTest");
	if (explainerJS.state.isPlaying) {
		audiomanagerJS.pause("explainer");
		// c•onsole.log(`🎧 SUSPEND AUDIO`);
	}

	if (explainerJS.state.isMoving) {
		// c•onsole.log(`    set .isMoving = false`);
		explainerJS.state.isMoving = false;
		// flags.pointermove = false;
	}
	flags.pointerleave = false;
	flags.pointerenter = true;
	// c•onsole.log(`onLeaveEventTest:${event.type}`);
};

explainerJS.onEnterEventTest = function (event) {
	const flags = explainerJS.hoverListenerFlags;
	if (!flags.pointerenter) return;
	event = eRegistryJS.register(event);
	eRegistryJS.use(event, "explainerJS.onEnterEventTest");
	if (!explainerJS.state.isPlaying) {
		explainerJS._hoverRect =
			explainerJS.state.hoverArea.getBoundingClientRect();
		explainerJS.updateStereo(event);
		if (explainerJS.state.isPaused) {
			audiomanagerJS.resume("explainer");
			// c•onsole.log(`🎧 RESUME AUDIO PLAY`);
		} else {
			audiomanagerJS.play("explainer");
			// c•onsole.log(`🎧 START AUDIO PLAY`);
		}
	}

	flags.pointerenter = false;
	flags.pointerleave = true;
	flags.pointerdown = true;

	// c•onsole.log(`🎧 SET STEREO BALANCE`);
	// c•onsole.log(`onEnterEventTest:${event.type}`);
};

explainerJS.registerWithAudioManager = function () {
	const hoverArea = explainerJS.state.hoverArea;

	if (!hoverArea) {
		console.log("⚠️ Hover area not found for AudioManager registration");
		return false;
	}

	audiomanagerJS.register("explainer", {
		element: hoverArea,
		playFn: (offset = 0) => {
			explainerJS.play(offset);
			return true;
		},
		pauseFn: () => {
			explainerJS.pause();
		},
		resumeFn: () => {
			explainerJS.resume();
		},
		stopFn: () => {
			explainerJS.pause();
		},
		volume: 1.0,
	});

	// m•mm("✅ Explainer registered with AudioManager");
	return true;
};

explainerJS.refreshHoverRect = () => {
	const hoverArea = explainerJS.state.hoverArea;
	if (hoverArea) explainerJS._hoverRect = hoverArea.getBoundingClientRect();
};

// In explainerJS.play() - simpler approach
explainerJS.play = function (offset = 0) {
	const hovAud = explainerJS.hoverAudio;
	const audioCtx = audiomanagerJS.audioCtx;

	// Set position
	hovAud.audioElement.currentTime = offset;

	// Simple immediate ramp
	hovAud.masterGainNode.gain.cancelAndHoldAtTime(audioCtx.currentTime);
	hovAud.masterGainNode.gain.linearRampToValueAtTime(
		1.0,
		audioCtx.currentTime + 0.2
	);

	mmm(`🎚️ Simple ramp from current gain`);

	hovAud.audioElement.play().then(() => {
		explainerJS.state.isPlaying = true;
		mmm("✅ Play started");
	});
};

explainerJS.pause = function () {
	if (!explainerJS.state.isPlaying) return;

	const hovAud = explainerJS.hoverAudio;
	const audioCtx = audiomanagerJS.audioCtx;
	const fadeOutMs = CONFIG.fadeOutMs;

	// Store current position and pause start time
	explainerJS.state.pausedAt = hovAud.audioElement.currentTime;
	explainerJS.state.pauseStartTime = performance.now();

	// Fade out
	hovAud.masterGainNode.gain.setValueAtTime(1.0, audioCtx.currentTime);
	hovAud.masterGainNode.gain.linearRampToValueAtTime(
		0,
		audioCtx.currentTime + fadeOutMs / 1000
	);

	// Pause after fade completes
	setTimeout(() => {
		hovAud.audioElement.pause();
		explainerJS.state.isPlaying = false;
		explainerJS.state.isPaused = true;
		mmm(`⏸️ Paused at ${explainerJS.state.pausedAt.toFixed(2)}s`);
	}, fadeOutMs);
};

explainerJS.pauseXX = function () {
	if (!explainerJS.state.isPlaying) return;

	const hovAud = explainerJS.hoverAudio;

	// Store current position and pause start time
	explainerJS.state.pausedAt = hovAud.audioElement.currentTime;
	explainerJS.state.pauseStartTime = performance.now();

	// Pause using HTML5 method
	hovAud.audioElement.pause();

	explainerJS.state.isPlaying = false;
	explainerJS.state.isPaused = true;
	const flags = explainerJS.hoverListenerFlags;
	flags.pointermove = false;

	// m•mm(`⏸️ Paused at ${explainerJS.state.pausedAt.toFixed(2)}s`);
};

explainerJS.resume = function () {
	// eRegistryJS.use(event, "explainerJS.resume");
	if (!explainerJS.state.isPaused) return;

	const pauseDuration = performance.now() - explainerJS.state.pauseStartTime;

	// Check if pause exceeded 5 seconds
	if (pauseDuration > 5000) {
		// c•onsole.log(`🔄 Long pause (${(pauseDuration / 1000).toFixed(1)}s) - restart from beginning`);
		audiomanagerJS.play("explainer", 0); // Restart from beginning
	} else {
		// c•onsole.log(`🔊 Quick resume (${(pauseDuration / 1000).toFixed(1)}s) - continue from ${explainerJS.state.pausedAt.toFixed(2)}s`);
		audiomanagerJS.play("explainer", explainerJS.state.pausedAt); // Resume from pause position
	}
	const flags = explainerJS.hoverListenerFlags;
	flags.pointermove = true;
	explainerJS.state.pauseStartTime = 0;
};

// NEW: Handle tap-to-toggle functionality
explainerJS.togglePlay = function (event) {
	eRegistryJS.use(event, "explainerJS.togglePlay");
	if (explainerJS.state.isPlaying) {
		// c•onsole.log(`⛔ TOGGLE OFF`);
		audiomanagerJS.pause("explainer");
	} else {
		// c•onsole.log(`✅ TOGGLE ON`);
		explainerJS.updateStereo(event);
		audiomanagerJS.resume("explainer");
	}
	// explainerJS.state.isPlaying = !explainerJS.state.isPlaying;
};

// Helper function to get current playback time
explainerJS.getCurrentPlaybackTime = function () {
	const audioCtx = audiomanagerJS.getAudioCtx();
	if (!audioCtx || !explainerJS.playStartTime) return 0;

	return (
		audioCtx.currentTime -
		explainerJS.playStartTime +
		(explainerJS.state.resumeOffset || 0)
	);
};

explainerJS.shouldReset = function () {
	return performance.now() - audiomanagerJS.lastPauseTime > 5000;
};

explainerJS.updateStereo = function (event) {
	const hovAud = explainerJS.hoverAudio;
	const audioCtx = audiomanagerJS.audioCtx;

	// Get hover area dimensions
	const rect =
		explainerJS._hoverRect ||
		explainerJS.state.hoverArea.getBoundingClientRect();

	// Calculate normalized position (0 to 1), % from L to R
	const norm = (event.clientX - rect.left) / rect.width;

	// Get L/R gain values
	const gains = explainerJS.calculateGains(norm);

	// Apply gains
	hovAud.leftGainNode.gain.setValueAtTime(gains.left, audioCtx.currentTime);
	hovAud.rightGainNode.gain.setValueAtTime(gains.right, audioCtx.currentTime);
	// Optional: log for debugging
	// c•onsole.log
	`norm:${norm.toFixed(2)} L:${gains.left.toFixed(2)} R:${gains.right.toFixed(2)}`;
};

// Utility: calculate stereo gains
explainerJS.calculateGains = function (normalizedX) {
	const leftGain = Math.min(
		1,
		Math.max(0, (CONFIG.gainLeftOffset - normalizedX) / CONFIG.gainLeftDivisor)
	);
	const rightGain = Math.min(
		1,
		Math.max(
			0,
			(normalizedX - CONFIG.gainRightOffset) / CONFIG.gainRightDivisor
		)
	);
	return { left: leftGain, right: rightGain };
};

explainerJS.isInsideHoverArea = function (event) {
	// z•zz();
	event = eRegistryJS.use(event, "explainerJS.isInsideHoverArea");
	const el = document.getElementById("audio-hover-area");
	// c•onsole.log("el.getBoundingClientRect()", el.getBoundingClientRect());
	if (!el) return false;
	const rect = el.getBoundingClientRect();
	return (
		event.clientX >= rect.left &&
		event.clientX <= rect.right &&
		event.clientY >= rect.top &&
		event.clientY <= rect.bottom
	);
};

explainerJS.startPause = function () {
	explainerJS.state.pausedAt = audiomanagerJS.audioCtx.currentTime;
	explainerJS.state.pauseStartTime = performance.now();
	explainerJS.state.isPaused = true;
	// c•onsole.log(`.pausedAt:${explainerJS.state.pausedAt} .pauseStartTime:${explainerJS.state.pauseStartTime} .isPaused:${explainerJS.state.isPaused}`);
};

explainerJS.endPause = function () {
	explainerJS.state.pauseDuration =
		performance.now() - explainerJS.state.pauseStartTime;
	explainerJS.state.isPaused = false;
	// c•onsole.log(`.pauseDuration:${explainerJS.state.pauseDuration} .isPaused:${explainerJS.state.isPaused}`);
};
