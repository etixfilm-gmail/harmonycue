/* eslint-env browser */

// hc-static-js-handlers.js gets loaded by initJS.injectScriptsParallel
// as part of hc-static-js/hc-static-js-init.js
mmm(`✅ LOADED hc-static-js-handlers.js`);

const handlersJS = (window.handlersJS = window.handlersJS || {});

handlersJS.init = async function () {
	//z•zz();
	// m•mm("🎬 Starting handlersJS.init()");

	// Set size vars AFTER deferred DOM is present
	// initJS.updateComponentSizeVars();
	handlersJS.setupWindowEvents;

	// Lock scrolling (splash phase)
	document.documentElement.classList.add("scroll-lock");
	document.body.classList.add("scroll-lock");

	// Prevent scroll restoration
	if ("scrollRestoration" in history) {
		history.scrollRestoration = "manual";
	}
	setTimeout(() => window.scrollTo(0, 0), 10);

	mmm("✅ handlersJS initialized");
	return true;
};

// ///////////// SPLASH HANDLERS /////////////////////////// //
//                                                           //
//                                                           //

handlersJS.removeCoverImage = function (event) {
	eRegistryJS.use(event, "handlersJS.removeCoverImage");
	splashJS.coverImage.remove();
};

//                                                           //
//                                                           //
// ///////////// END SPLASH HANDLERS /////////////////////// //

// ///////////// EXPLAINER HANDLERS /////////// //////////// //
//                                                           //
//                                                           //

handlersJS.removePromptText = function (event) {
	eRegistryJS.use(event, "handlersJS.removePromptText");
	splashJS.audioPrompt.remove();
	splashJS.promptRemoved = true;
	handlersJS.triggerHoverIfNeeded(event);
};

handlersJS.triggerHoverIfNeeded = function (event) {
	eRegistryJS.use(event, "handlersJS.triggerHoverIfNeeded");
	// x•xx(event);
	// m•mm(`handlersJS.triggerHoverIfNeeded(event.type:${event.type})`);
	if (explainerJS.hoverArea && explainerJS.hoverArea.contains(event.target)) {
		// Wait for animation to complete before starting hover interaction
		splashJS.audioPrompt.addEventListener(
			`animationend`,
			(event) => {
				eRegistryJS.register(event);
				handlersJS.startHoverInteraction(event);
			},
			{ once: true }
		);
	}
};

/**
 * helper to handle starting playback/pan, checks to see audio is unlocked
 */
handlersJS.startHoverInteraction = function (event) {
	mmm(`⚠️ startHoverInteraction called - isPlaying: ${explainerJS.isPlaying}`);

	eRegistryJS.use(event, "handlersJS.startHoverInteraction");
	// x•xx(event);

	const isTouchEvent =
		event.pointerType === `touch` || event.type.includes(`touch`);
	mmm(
		`handlersJS.startHoverInteraction lockJS.audioIsUnlocked:${lockJS.audioIsUnlocked} ✅`
	);
	console.log(`isTouchEvent:${isTouchEvent}`);
	if (!lockJS.audioIsUnlocked) return;

	explainerJS.isHovering = true;
	explainerJS.pointerEnterTime = performance.now();

	const rect = explainerJS.hoverArea.getBoundingClientRect();
	const x = (event.clientX - rect.left) / rect.width;

	const targetLeft = Math.min(1, Math.max(0, (0.6 - x) / 0.233));
	const targetRight = Math.min(1, Math.max(0, (x - 0.225) / 0.142));

	// Initialize routing if not already set up
	console.log(`!explainerJS.sourceNode:${!explainerJS.sourceNode}`);
	if (!explainerJS.sourceNode) {
		const source = explainerJS.hoverAudioCtx.createMediaElementSource(
			explainerJS.hoverAudio
		);
		const leftGain = explainerJS.hoverAudioCtx.createGain();
		const rightGain = explainerJS.hoverAudioCtx.createGain();
		const splitter = explainerJS.hoverAudioCtx.createChannelSplitter(2);
		const merger = explainerJS.hoverAudioCtx.createChannelMerger(2);
		splitter.connect(leftGain, 0);
		splitter.connect(rightGain, 1);
		leftGain.connect(merger, 0, 0);
		rightGain.connect(merger, 0, 1);
		source.connect(splitter);
		merger.connect(explainerJS.hoverAudioCtx.destination);
		explainerJS.sourceNode = source;
		explainerJS.leftGain = leftGain;
		explainerJS.rightGain = rightGain;
	}

	const audioCurrentTime = explainerJS.ctxClockTime();
	// m•mm(`>>> Setting audioCurrentTime to ` + audioCurrentTime);
	explainerJS.config.fadeInTime = 0.025;
	if (explainerJS.pointerLeaveTime === null) explainerJS.config.fadeInTime = 0;

	// Cancel fades and reset to silence
	explainerJS.leftGain.gain.cancelScheduledValues(audioCurrentTime);
	explainerJS.rightGain.gain.cancelScheduledValues(audioCurrentTime);
	explainerJS.leftGain.gain.setValueAtTime(0, audioCurrentTime);
	explainerJS.rightGain.gain.setValueAtTime(0, audioCurrentTime);

	// Start audio if not playing
	console.log(`!explainerJS.isPlaying:${!explainerJS.isPlaying}`);
	console.log(
		`explainerJS.isAudioContextUnlocked():${explainerJS.isAudioContextUnlocked()}`
	);
	console.log(`lockJS.audioIsUnlocked:${lockJS.audioIsUnlocked}`);
	if (!explainerJS.isPlaying && lockJS.audioIsUnlocked) {
		// m•mm(`explainerJS.hoverAudioState:${explainerJS.hoverAudioState}`);
		if (explainerJS.hoverAudioState === `suspended`) {
			explainerJS.ctxClockResume().then(() => {
				// m•mm(`explainerJS.isPlaying}`);
				if (explainerJS.isPlaying) {
					// m•mm(`1 >>> Calling hoverAudio.play()`);
					explainerJS.hoverAudio
						.play()
						.then(() => mmm(`2 hoverAudio.play() promise resolved`))
						.catch((err) => mmm(`2 hoverAudio.play() failed: ` + err.message));
					// explainerJS.hoverAudio
					// 	.play()
					// 	.catch((err) => console.warn(`Playback failed:`, err));
				}
				const newT = explainerJS.ctxClockTime();
				explainerJS.leftGain.gain.linearRampToValueAtTime(
					targetLeft,
					newT + explainerJS.config.fadeInTime
				);
				explainerJS.rightGain.gain.linearRampToValueAtTime(
					targetRight,
					newT + explainerJS.config.fadeInTime
				);
			});
		} else {
			// m•mm(`1 explainerJS.isPlaying}`);
			if (explainerJS.isPlaying) {
				// m•mm(`2 >>> Calling hoverAudio.play()`);
				explainerJS.hoverAudio
					.play()
					.then(() => mmm(`1 hoverAudio.play() promise resolved`))
					.catch((err) => mmm(`1 hoverAudio.play() failed: ` + err.message));
			}
			const t = explainerJS.ctxClockTime();
			explainerJS.leftGain.gain.linearRampToValueAtTime(
				targetLeft,
				t + explainerJS.config.fadeInTime
			);
			explainerJS.rightGain.gain.linearRampToValueAtTime(
				targetRight,
				t + explainerJS.config.fadeInTime
			);
		}
		explainerJS.isPlaying = true;
		explainerJS.hoverArea.classList.add(`audio-active`);
	}
};

/**
 * Set up hover audio effect in #explainer-section
 */
handlersJS.setupExplainerHover = function () {
	//z•zz();
	explainerJS.hoverArea = document.getElementById(`audio-hover-area`);
	console.log(`explainerJS?:${explainerJS}`);
	console.log(`explainerJS.hoverArea:${explainerJS.hoverArea}`);
	if (explainerJS?.addHoverPlayer && explainerJS.hoverArea) {
		// c•onsole.log(`🎧 Initializing explainer hover audio`);
		explainerJS.addHoverPlayer();
	} else {
		console.warn(
			`⚠️ Explainer hover audio not initialized: missing DOM or script`
		);
	}
};

handlersJS.explainerLeave = function () {
	//z•zz();
	if (!explainerJS.hoverAudio || !explainerJS.hoverAudio) {
		return;
	}

	explainerJS.pointerLeaveTime = performance.now();
	explainerJS.audioTime = explainerJS.ctxClockTime();
	explainerJS.displayTimes?.();

	const leftGain = explainerJS.leftGain;
	const rightGain = explainerJS.rightGain;

	if (!leftGain || !rightGain || !explainerJS.hoverAudio) {
		// m•mm(`3 >>> Calling hoverAudio.pause()`);
		console.warn(`⚠️ Gain nodes not found — skipping fade`);
		explainerJS.hoverAudio.pause();
		explainerJS.isPlaying = false;
		explainerJS.hoverArea.classList.remove(`audio-active`);
		return;
	}

	const fadeOutTime = 0.4;

	// Perform smooth fade
	const fadeStart = explainerJS.ctxClockTime();
	leftGain.gain.setTargetAtTime(0.0001, fadeStart, fadeOutTime / 4);
	rightGain.gain.setTargetAtTime(0.0001, fadeStart, fadeOutTime / 4);

	setTimeout(() => {
		// Instead of pause(), suspend explainerJS.hoverAudio to avoid clicks
		if (explainerJS.hoverAudioState === `running`) {
			console.log(`explainerJS.hoverAudioState:${explainerJS.hoverAudioState}
				explainerJS.ctxClockSuspend():${explainerJS.ctxClockSuspend()}
				explainerJS.isPlaying:${explainerJS.isPlaying}
				explainerJS.hoverArea.classList:${JSON.stringify(explainerJS.hoverArea.classList)}
				explainerJS.ctxClockTime():${explainerJS.ctxClockTime()}
				explainerJS.ctxClockTime():${explainerJS.ctxClockTime()}`);
			explainerJS.ctxClockSuspend().then(() => {
				explainerJS.isPlaying = false;
				explainerJS.hoverArea.classList.remove(`audio-active`);

				// Reset gains for next time
				leftGain.gain.setValueAtTime(1, explainerJS.ctxClockTime());
				rightGain.gain.setValueAtTime(1, explainerJS.ctxClockTime());
			});
		}
	}, fadeOutTime * 1000);
};

// 🎵 Start audio with fade-in and pan
handlersJS.startAudioWithPan = function (event) {
	eRegistryJS.use(event, "handlersJS.startAudioWithPan");
	mmm(
		`handlersJS.startAudioWithPan lockJS.audioIsUnlocked:${lockJS.audioIsUnlocked} ✅`
	);
	if (!lockJS.audioIsUnlocked) return;

	explainerJS.isHovering = true;
	explainerJS.pointerEnterTime = performance.now();

	// Calculate stereo position
	const rect = explainerJS.hoverArea.getBoundingClientRect();
	const x = (event.clientX - rect.left) / rect.width;
	const targetLeft = Math.min(1, Math.max(0, (0.6 - x) / 0.233));
	const targetRight = Math.min(1, Math.max(0, (x - 0.225) / 0.142));

	// Initialize routing if needed
	explainerJS.initializeAudioRouting();

	const audioCurrentTime = explainerJS.ctxClockTime();
	explainerJS.config.fadeInTimeadeInTime = 0.025;
	if (explainerJS.pointerLeaveTime === null) explainerJS.config.fadeInTime = 0;

	// Cancel fades and reset to silence
	explainerJS.leftGain.gain.cancelScheduledValues(audioCurrentTime);
	explainerJS.rightGain.gain.cancelScheduledValues(audioCurrentTime);
	explainerJS.leftGain.gain.setValueAtTime(0, audioCurrentTime);
	explainerJS.rightGain.gain.setValueAtTime(0, audioCurrentTime);

	// Start playback logic
	mmm(
		`handlersJS.startAudioWithPan 2 lockJS.audioIsUnlocked:${lockJS.audioIsUnlocked} ✅`
	);
	if (!explainerJS.isPlaying && lockJS.audioIsUnlocked) {
		if (explainerJS.hoverAudioState === "suspended") {
			explainerJS.ctxClockResume().then(() => {
				if (explainerJS.isPaused) {
					mmm("🎯 3 About to call hoverAudio.play()");
					explainerJS.hoverAudio
						.play()
						.then(() => {
							mmm(`🎵 Play promise resolved
								🔍 Audio debug:
								- paused: ${explainerJS.isPaused}
								- currentTime: ${explainerJS.currentTime}
								- volume: ${explainerJS.volume}
								- muted: ${explainerJS.muted}
								- readyState: ${explainerJS.readyState}
								- networkState: ${explainerJS.networkState}`);
						})
						.catch((err) => {
							console.error("❌ Play failed:", err);
						});
				}
				const newT = explainerJS.ctxClockTime();
				explainerJS.leftGain.gain.linearRampToValueAtTime(
					targetLeft,
					newT + explainerJS.config.fadeInTime
				);
				explainerJS.rightGain.gain.linearRampToValueAtTime(
					targetRight,
					newT + explainerJS.config.fadeInTime
				);
			});
		} else {
			if (explainerJS.isPaused) {
				mmm("🎯 4 About to call hoverAudio.play()");
				explainerJS.hoverAudio
					.play()
					.then(() => {
						mmm(`🎵 Play promise resolved
							🔍 Audio debug:
							-- paused: ${explainerJS.isPaused}
							-- currentTime: ${explainerJS.currentTime}
							-- volume: ${explainerJS.volume}
							-- muted: ${explainerJS.muted}
							-- readyState: ${explainerJS.readyState}
							-- networkState: ${explainerJS.networkState}
							🎵 Audio play() resolved`);
					})
					.catch((err) => {
						console.error("❌ Play failed:", err);
					});
			}
			const t = explainerJS.ctxClockTime();
			explainerJS.leftGain.gain.linearRampToValueAtTime(
				targetLeft,
				t + explainerJS.config.fadeInTime
			);
			explainerJS.rightGain.gain.linearRampToValueAtTime(
				targetRight,
				t + explainerJS.config.fadeInTime
			);
		}
		explainerJS.isPlaying = true;
		explainerJS.hoverArea.classList.add("audio-active");
	}
};

handlersJS.toggleExplainerAudio = function (event) {
	eRegistryJS.use(event, "handlersJS.toggleExplainerAudio");
	mmm("🔄 Toggling audio playback");
	if (explainerJS.isPlaying) {
		this.stopAudio();
		explainerJS.lastTapWasToggleOff = true;
		explainerJS.isPaused = true;
	} else {
		this.startAudio(event);
		explainerJS.lastTapWasToggleOff = false;
		explainerJS.isPaused = false;
	}
};

handlersJS.updateExplainerPan = function (event) {
	eRegistryJS.use(event, "handlersJS.updateExplainerPan");
	const rect = explainerJS.hoverArea.getBoundingClientRect();
	const x = (event.clientX - rect.left) / rect.width;
	const targetLeft = Math.min(1, Math.max(0, (0.6 - x) / 0.233));
	const targetRight = Math.min(1, Math.max(0, (x - 0.225) / 0.142));

	const now = explainerJS.ctxClockTime();
	explainerJS.leftGain.gain.setTargetAtTime(targetLeft, now, 0.01);
	explainerJS.rightGain.gain.setTargetAtTime(targetRight, now, 0.01);

	// mmm(`🔈 Stereo pan: x=${x}, L=${targetLeft.toFixed(2)}, R=${targetRight.toFixed(2)}`);
};

handlersJS.hoverPointerEnter = function (event) {
	if (event.pointerType === "touch") return; // ignore enter from touch

	utilsJS.waitForValue(() => stateJS?.audio?.lastUnlockEvent, {
		predicate: (v) => v && Number.isFinite(v.x) && Number.isFinite(v.y),
		timeout: 4000,
	});
	const unlockEvent = stateJS.audio.lastUnlockEvent;

	const justUnlocked =
		unlockEvent && event.timeStamp - (unlockEvent.timeStamp || 0) < 250; // same clock
	// c•onsole.log(`justUnlocked:${justUnlocked} = thisEvent.timeStamp:${thisEvent.timeStamp} - unlockEvent.timeStamp:${unlockEvent.timeStamp} = ${thisEvent.timeStamp} - ${unlockEvent.timeStamp} = ${event.timeStamp - (unlockEvent.timeStamp || 0)} < 250?`);

	if (justUnlocked) return;
	if (!event.passkey) {
		if (event.pointerType !== "touch") {
			if (!event.passkey) event = eRegistryJS.register(event);
			explainerJS.onEnter(event);
		}
	}
};

handlersJS.hoverPointerLeave = function (event) {
	if (event.pointerType === "touch") return; // ignore leave from touch
	if (!event.passkey) event = eRegistryJS.register(event);
	explainerJS.state.isMoving = false;
	explainerJS.onLeave(event);
};

handlersJS.hoverPointerMove = function (event) {
	if (!explainerJS.state.isPlaying) return; // if audio isn't playing, ignore event
	if (!explainerJS.state.isMoving) {
		// if it's not already moving, register
		if (!event.passkey) event = eRegistryJS.register(event);
		explainerJS.state.isMoving = true;
	}
	explainerJS.onMove(event);
};

handlersJS.hoverPointerMove = function (event) {
	// console.log("event:", event);
	if (!explainerJS.isInsideHoverArea(event)) return;
	// if (eRegistryJS.register(event)) {
	explainerJS.onDown(event);
	// }
};

handlersJS.hoverPointerMove = function (event) {
	if (!explainerJS.isInsideHoverArea(event)) {
		console.log(`${event.target.id} is not inside hoverArea`);
		return;
	}
	// if (eRegistryJS.register(event)) {
	explainerJS.onUp(event);
	// }
};

//                                                           //
//                                                           //
// ///////////// END EXPLAINER HANDLERS //////////////////// //

/**
 * Add future handlers here...
 */
