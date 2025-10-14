// hc-static-js-explainer.js gets loaded by initJS.injectScriptsParallel()
// as part of hc-static-js/hc-static-js-init.js
mmm(`✅ LOADED hc-static-js-explainer.js`);

// hc-static-js-explainer.js (updated with custom mobile pointer logic)

const explainerJS = (window.explainerJS = window.explainerJS || {});

explainerJS._hoverRect = null;

explainerJS.state = {
	audioContextNeedsResume: false,
	audioTime: 0,
	currentFadeTimeout: null,
	holdTimer: null,
	hoverArea: null,
	hoverAudioReady: false,
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
	// p°anNode: null,
	pausedAt: 0,
	pauseTime: 0,
	// isMoving: false,
	requiresUserGesture: window.PLATFORM.isMobile,
	resumeOffset: 0,
	startTime: 0,
	tapEndTime: 0,
	tapStartTime: 0,
	touchMoved: false,
	touchStart: { x: 0, y: 0, time: 0 },
	touchStartTime: 0,
	unlockInProgress: false,
	userStopped: false,
	wasTapped: false,
};

// Audio elements
explainerJS.hoverAudio = {
	ctx: null,
	buffer: null,
	leftGainNode: null,
	masterGainNode: null,
	mergerNode: null,
	muted: null,
	networkState: null,
	readyState: null,
	rightGainNode: null,
	sourceNode: null,
	splitterNode: null,
	volume: null,
};

// Configuration
const CONFIG = {
	hoverAudioSrc: "/hc-static-media/Give My Regards to Broadway LOOP.mp3",
	fadeInMs: 25,
	fadeOutMs: 250,
	gainLeftDivisor: 0.233,
	gainLeftOffset: 0.6,
	gainRightDivisor: 0.142,
	gainRightOffset: 0.225,
	pauseResetThresholdMs: 5000,
	touchHoldThresholdMs: 300,
	touchMoveThresholdPx: 10,
};

explainerJS.init = async function () {
	mmm("🎬 Starting explainerJS.init()");

	await explainerJS.prepHoverAudio?.();
	try {
		explainerJS.state.hoverArea =
			await utilsJS.waitForElement("#audio-hover-area");
	} catch (err) {
		console.warn(
			`❌ explainerJS.init(): hover area not found or timed out: ${err}`
		);
		return false;
	}
	explainerJS.refreshHoverRect();
	const hoverArea = explainerJS.state.hoverArea;
	explainerJS.hoverAudio.ctx = window.hoverAudioCtx = new AudioContext();
	const ctx = explainerJS.hoverAudio.ctx;
	const response = await fetch(
		"/hc-static-media/Give My Regards to Broadway LOOP.mp3"
	);
	const arrayBuffer = await response.arrayBuffer();
	explainerJS.hoverAudio.buffer = await ctx.decodeAudioData(arrayBuffer);

	hoverArea.addEventListener("pointerenter", (event) => {
		if (event.pointerType === "touch") return; // ignore enter from touch
		if (!event.index) event = eRegistryJS.register(event);
		const unlockEvent = stateJS.audio.lastUnlockEvent;
		const justUnlocked =
			unlockEvent && event.timeStamp - (unlockEvent.timeStamp || 0) < 250; // same clock
		console.log(
			`justUnlocked:${justUnlocked} = event.timeStamp - unlockEvent.timeStamp = ${event.timeStamp} - ${unlockEvent.timeStamp || 0} = ${event.timeStamp - (unlockEvent.timeStamp || 0)} < 250?`
		);
		if (justUnlocked) return;
		if (!event.index) {
			if (event.pointerType !== "touch") {
				if (!event.index) event = eRegistryJS.register(event);
				explainerJS.onEnter(event);
			}
		}
	});
	hoverArea.addEventListener("pointerleave", (event) => {
		if (event.pointerType === "touch") return; // ignore leave from touch
		if (eRegistryJS.register(event)) {
			explainerJS.state.isMoving = false;
			explainerJS.onLeave(event);
		}
	});
	hoverArea.addEventListener("pointermove", (event) => {
		// m•mm(`explainerJS.state.isPlaying:${explainerJS.state.isPlaying}`);
		if (!explainerJS.state.isPlaying) return; // if audio isn't playing, ignore event
		if (!explainerJS.state.isMoving) {
			// if it's not already moving, register
			if (!event.index) event = eRegistryJS.register(event);
			explainerJS.state.isMoving = true;
		}
		explainerJS.onMove(event);
	});
	hoverArea.addEventListener("hc:audio-unlocked", (event) => {
		// console.log("event:", event);
		// mark when we unlocked to ignore the immediate pointerenter that follows
		// if (!event.index) event = eRegistryJS.register(event);
		explainerJS.state.lastUnlockAt = event.detail.time;

		console.log(`stateJS.audio.isUnlocked:${stateJS.audio.isUnlocked}`);
		console.log(`explainerJS.state.isPlaying:${explainerJS.state.isPlaying}`);

		if (!stateJS.audio.isUnlocked) return;
		if (explainerJS.state.isPlaying) return;

		// Build a minimal event-like object for pan calc using the detail coords
		// for (let key in event) {
		// console.log(`${key}: ${event[key]}`);
		// }
		// event.clientX = event.detail.x;
		// event.clientY = event.detail.y;
		// console.log(`event.type:${event.type}`);
		// console.log(`event.detail:${JSON.stringify(event.detail)}`);
		// console.log(`event.detail.x:${event.detail.x}`);
		// console.log(`event.clientX:${event.clientX}`);
		// console.log(`event.clientY:${event.clientY}`);
		// const tempKey = event.key || event.detail.customKey;
		// console.log(`event.key:${event.key}`);
		// console.log(`event.detail.customKey:${event.detail.customKey}`);
		// console.log(`tempKey:${tempKey}`);
		// console.log(`event.key || event.detail.customKey:${event.key || event.detail.customKey}`);
		// console.log("event: ", event);
		const fauxEvent = {
			index: eRegistryJS.findByReference(event).index,
			// eventReference: event,
			key: event.key || event.detail.customKey, // <-- store key
			useCount: event.useCount,
			type: event.type,
			pointerType: event.pointerType,
			// timeStamp: event.timeStamp,
			// pointerId: event.pointerId,
			// handlers: event.handlers,
			// registeredAt: event.registeredAt,
			clientX: event.detail.x, //<--
			clientY: event.detail.y, //<--
			// registeredAt: event.registeredAt,
			// bubbles: event.bubbles,
			// composed: event.composed,
			detail: event.detail,
		};
		// console.log("fauxEvent: ", fauxEvent);
		explainerJS.updateStereo(fauxEvent);

		if (explainerJS.shouldReset()) explainerJS.state.resumeOffset = 0;
		explainerJS.play(explainerJS.state.resumeOffset, 0);
	});
	document.addEventListener("pointerdown", (event) => {
		// console.log("event:", event);
		if (!explainerJS.isInsideHoverArea(event)) return;
		// if (eRegistryJS.register(event)) {
		explainerJS.onDown(event);
		// }
	});
	document.addEventListener("pointerup", (event) => {
		if (!explainerJS.isInsideHoverArea(event)) {
			console.log(`${event.target} is not inside hoverArea`);
			return;
		}
		// if (eRegistryJS.register(event)) {
		explainerJS.onUp(event);
		// }
	});

	mmm("✅ explainerJS initialized");
};

explainerJS.refreshHoverRect = () => {
	zzz();
	const hoverArea = explainerJS.state.hoverArea;
	if (hoverArea) explainerJS._hoverRect = hoverArea.getBoundingClientRect();
};

explainerJS.prepHoverAudio = async function () {
	zzz();
	const state = explainerJS.state;

	if (state.hoverAudioReady) return;

	if (!explainerJS.hoverAudio.ctx) {
		explainerJS.hoverAudio.ctx = new (window.AudioContext ||
			window.webkitAudioContext)();
		state.audioContextNeedsResume = true;
	}

	console.log(
		`explainerJS.hoverAudio.ctx.currentTime:${explainerJS.hoverAudio.ctx.currentTime}`
	);

	if (!(await explainerJS.loadAudioBuffer())) return false;
	// if (!explainerJS.createAudioNodes()) return false;
	if (!(await explainerJS.createAudioNodes())) return false;
	state.hoverAudioReady = true;
};

// Load buffer
explainerJS.loadAudioBuffer = async function () {
	mmm("🎬 Starting explainerJS.loadAudioBuffer()");
	const hov = explainerJS.hoverAudio;
	const ctx = hov.ctx;
	try {
		const resp = await fetch(CONFIG.hoverAudioSrc);
		const data = await resp.arrayBuffer();
		hov.buffer = await ctx.decodeAudioData(data);
		mmm("Decoded buffer channels:", hov.buffer.numberOfChannels);
		hov.sourceNode = ctx.createBufferSource();
		hov.sourceNode.buffer = hov.buffer;
		return true;
	} catch {
		return false;
	}
};

// Node creation
explainerJS.createAudioNodes = async function () {
	mmm("🎬 Starting explainerJS.createAudioNodes()");
	const hov = explainerJS.hoverAudio;
	if (hov._nodesReady) {
		mmm("⏭️ createAudioNodes: already initialized, skipping");
		return true;
	}

	const ctx = hov.ctx;
	try {
		// build once
		hov.sourceNode = ctx.createBufferSource();
		hov.masterGainNode = ctx.createGain();
		hov.masterGainNode.connect(ctx.destination);

		hov.mergerNode = ctx.createChannelMerger(2);
		hov.mergerNode.connect(hov.masterGainNode);

		hov.leftGainNode = ctx.createGain();
		hov.rightGainNode = ctx.createGain();
		hov.leftGainNode.connect(hov.mergerNode, 0, 0);
		hov.rightGainNode.connect(hov.mergerNode, 0, 1);

		hov.splitterNode = ctx.createChannelSplitter(2);
		hov.splitterNode.connect(hov.leftGainNode, 0);
		hov.splitterNode.connect(hov.rightGainNode, 1);

		hov._nodesReady = true; // ← mark ready
		return true;
	} catch (err) {
		console.error("createAudioNodes failed:", err);
		return false;
	}
};

explainerJS.play = function (offset = 0) {
	zzz();
	const ctx = explainerJS.hoverAudio.ctx;
	if (explainerJS.state.isPlaying) return;
	if (!explainerJS.hoverAudio._nodesReady) explainerJS.createAudioNodes();
	// explainerJS.state.p°anNode.pan.value = pan;
	// explainerJS.state.p°anNode.value = pan;
	explainerJS.state.startTime = ctx.currentTime - offset;
	explainerJS.hoverAudio.sourceNode.start(0, offset);
	explainerJS.state.isPlaying = true;
	mmm(`▶️ Audio started at ${offset.toFixed(2)}s`);
};

explainerJS.pause = function () {
	if (!explainerJS.state.isPlaying) return;
	explainerJS.hoverAudio.sourceNode.stop();
	explainerJS.state.resumeOffset =
		explainerJS.hoverAudio.ctx.currentTime - explainerJS.state.startTime;
	explainerJS.state.lastPausedTime = performance.now();
	explainerJS.state.isPlaying = false;
	mmm(`⏸️ Audio paused at ${explainerJS.state.resumeOffset.toFixed(2)}s`);
};

explainerJS.onEnter = function (event) {
	// z•zz();
	eRegistryJS.use(event, "explainerJS.onEnter");
	const unlockEvent = stateJS.audio.lastUnlockEvent;
	const justUnlocked = unlockEvent && event.timeStamp - unlockEvent.time < 250;
	if (!stateJS.audio.isUnlocked) return;
	if (event.pointerType === "touch") return;
	if (explainerJS.state.isPlaying) return;
	if (justUnlocked) return; // ignore the echo enter that follows overlay removal
	explainerJS.refreshHoverRect();
	if (explainerJS.shouldReset()) explainerJS.state.resumeOffset = 0;
	explainerJS.updateStereo(event);
	explainerJS.play(explainerJS.state.resumeOffset, 0);
};

explainerJS.onLeave = function (event) {
	// z•zz();
	eRegistryJS.use(event, "explainerJS.onLeave");
	explainerJS.state.isMoving = false;
	mmm("📤 pointerleave fired", {
		pointerType: event.pointerType,
		isPlaying: explainerJS.state.isPlaying,
		t: performance.now(),
	});
	if (!explainerJS.state.isPlaying) return;
	explainerJS.pause();
};

explainerJS.onMove = function (event) {
	// m•mm(`onMove() explainerJS.state.isPlaying:${explainerJS.state.isPlaying}`);
	if (!explainerJS.state.isPlaying) return;
	// m•mm(`onMove() explainerJS.state.isMoving:${explainerJS.state.isMoving}`);
	if (!explainerJS.state.isMoving) {
		eRegistryJS.use(event, "explainerJS.onMove");
		explainerJS.state.isMoving = true;
	}
	explainerJS.updateStereo(event);
	// explainerJS.state.p°anNode.pan.value = 0;
};

explainerJS.onDown = function (event) {
	// z•zz();
	// m•mm(`onMove() onDown.state.isPlaying:${explainerJS.state.isPlaying}`);
	explainerJS.state.tapStartTime = performance.now();
	explainerJS.state.tapEndTime = 0;
	explainerJS.state.wasTapped = false;

	if (!explainerJS.state.isPlaying) return;
	eRegistryJS.use(event, "explainerJS.onDown");
	if (!stateJS.audio.isUnlocked) return;
	if (event.pointerType === "touch") {
		explainerJS.state.touchStartTime = performance.now();
		if (!explainerJS.state.isPlaying) {
			if (explainerJS.shouldReset()) explainerJS.state.resumeOffset = 0;
			explainerJS.updateStereo(event);
			explainerJS.play(explainerJS.state.resumeOffset, 0);
		} else {
			explainerJS.pause();
		}
		return;
	}
	// optional: desktop click logic here
};

explainerJS.onUp = function (event) {
	// z•zz();
	eRegistryJS.use(event, "explainerJS.onUp");
	explainerJS.state.tapEndTime = performance.now();
	explainerJS.state.isMoving = false;
	// if (event.pointerType !== "touch") return;
	const duration =
		explainerJS.state.tapEndTime - explainerJS.state.tapStartTime;
	mmm(
		`🕒 Quick tap? -- duration:${duration.toFixed(2)}<300;${duration < 300} || .ignoreUp;${explainerJS.state.ignoreUp} = ${duration < 300 || explainerJS.state.ignoreUp}`
	);
	if (duration < 300) explainerJS.state.wasTapped = true;
	if (duration < 300 || explainerJS.state.ignoreUp) {
		mmm(`✅ It's a tap or a duplicate`);
		// do nothing
	} else {
		mmm(`🕒 Not a tap`);
	}
	explainerJS.state.ignoreUp = !explainerJS.state.ignoreUp;
};

explainerJS.shouldReset = function () {
	return performance.now() - explainerJS.state.lastPausedTime > 5000;
};

explainerJS.updateStereo = function (event) {
	if (!explainerJS.state.isMoving) {
		zzz();
		eRegistryJS.use(event, "explainerJS.updateStereo");
	}
	const rect = explainerJS._hoverRect;
	const norm = (event.clientX - rect.left) / rect.width;
	const gains = explainerJS.calculateGains(norm);
	// console.log(`norm:${norm} gains.left:${gains.left} gains.right:${gains.right}`);
	if (!explainerJS) console.log(`!explainerJS`);
	if (!explainerJS.hoverAudio) console.log(`!explainerJS.hoverAudio`);
	if (!explainerJS.hoverAudio.leftGainNode)
		console.log(`!explainerJS.hoverAudio.leftGainNode`);
	if (!explainerJS.hoverAudio.rightGainNode)
		console.log(`!explainerJS.hoverAudio.rightGainNode`);
	explainerJS.hoverAudio.leftGainNode.gain.setValueAtTime(
		gains.left,
		explainerJS.hoverAudio.ctx.currentTime
	);
	explainerJS.hoverAudio.rightGainNode.gain.setValueAtTime(
		gains.right,
		explainerJS.hoverAudio.ctx.currentTime
	);
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
	eRegistryJS.use(event, "explainerJS.isInsideHoverArea");
	const el = explainerJS.state.hoverArea;
	if (!el) return false;
	const rect = explainerJS._hoverRect;
	return (
		event.clientX >= rect.left &&
		event.clientX <= rect.right &&
		event.clientY >= rect.top &&
		event.clientY <= rect.bottom
	);
};
