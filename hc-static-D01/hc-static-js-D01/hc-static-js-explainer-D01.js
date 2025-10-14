// hc-static-js-explainer.js gets loaded by hc-views/layout/index.ejs
// as a <script> element at the bottom of the <body>

// c•onsole.log(`hc-static-js-explainer.js is loaded`);

window.explainerJS = window.explainerJS || {};

explainerJS.config = {
	hoverAreaID: "#audio-hover-area",
	hoverAudioID: "#stereo-audio",
	enableAudioPromptID: "#enable-audio-prompt",
};

explainerJS.audioCtx = null;
explainerJS.isPlaying = false;
explainerJS.audioTime = 0;
explainerJS.pauseDuration = null;
explainerJS.audioIsLocked = true;
explainerJS.mouseEnterTime = null;
explainerJS.mouseLeaveTime = null;

explainerJS.init = function () {
	// c•onsole.log(`explainerJS.init = function () { <--- DOES NOTHING RIGHT NOW`);
};

/////////////////// Hover Audio Player ////////////////////////
//                                                           //
//                                                           //
explainerJS.displayTimes = function () {
	// c•onsole.log(`Enter: ${explainerJS.mouseEnterTime}
	// Leave: ${explainerJS.mouseLeaveTime}
	// Audio: ${explainerJS.audioTime}
	// Pause: ${explainerJS.pauseDuration}`);
};

explainerJS.addHoverPlayer = function () {
	// c•onsole.log("explainerJS.addHoverPlayer()");

	const hoverArea = document.querySelector(explainerJS.config.hoverAreaID);
	const hoverAudio = document.querySelector(explainerJS.config.hoverAudioID);

	if (!hoverArea || !hoverAudio) {
		console.warn("⚠️ Audio hover elements not found — skipping init.");
		return;
	}

	hoverAudio.loop = true;

	hoverArea.addEventListener("mouseenter", (event) => {
		// c•onsole.log("🎧 hoverArea mouseenter");

		explainerJS.mouseEnterTime = performance.now();

		if (!explainerJS.audioCtx) return;

		// Calculate current stereo position based on mouse X
		const rect = hoverArea.getBoundingClientRect();
		const x = (event.clientX - rect.left) / rect.width;

		const targetLeft = Math.min(1, Math.max(0, (0.6 - x) / 0.233));
		const targetRight = Math.min(1, Math.max(0, (x - 0.225) / 0.142));

		// Initialize routing if not already set up
		if (!hoverAudio.sourceNode) {
			const source = explainerJS.audioCtx.createMediaElementSource(hoverAudio);
			const leftGain = explainerJS.audioCtx.createGain();
			const rightGain = explainerJS.audioCtx.createGain();
			const splitter = explainerJS.audioCtx.createChannelSplitter(2);
			const merger = explainerJS.audioCtx.createChannelMerger(2);

			splitter.connect(leftGain, 0);
			splitter.connect(rightGain, 1);
			leftGain.connect(merger, 0, 0);
			rightGain.connect(merger, 0, 1);
			source.connect(splitter);
			merger.connect(explainerJS.audioCtx.destination);

			hoverAudio.sourceNode = source;
			hoverAudio.leftGain = leftGain;
			hoverAudio.rightGain = rightGain;
		}

		const t = explainerJS.audioCtx.currentTime;
		let fadeInTime = 0.025;
		if (explainerJS.mouseLeaveTime === null) fadeInTime = 0;

		// Cancel any old fades and reset to silence
		hoverAudio.leftGain.gain.cancelScheduledValues(t);
		hoverAudio.rightGain.gain.cancelScheduledValues(t);
		hoverAudio.leftGain.gain.setValueAtTime(0, t);
		hoverAudio.rightGain.gain.setValueAtTime(0, t);

		// Track pause duration
		if (!explainerJS.mouseLeaveTime) {
			// c•onsole.log("▶️ First play start");
			explainerJS.pauseDuration = 0;
		} else {
			explainerJS.pauseDuration =
				explainerJS.mouseEnterTime - explainerJS.mouseLeaveTime;
			// c•onsole.log(`⏱ Pause duration: ${explainerJS.pauseDuration.toFixed(0)}ms`);
		}
		explainerJS.displayTimes();

		// c•onsole.log(`explainerJS.pauseDuration: ${explainerJS.pauseDuration},
		// 	.isPlaying: ${explainerJS.isPlaying},
		// 	.isAudioContextUnlocked(): ${explainerJS.isAudioContextUnlocked()},
		// 	.hoverAudio.paused: ${hoverAudio.paused},
		// 	.leftGain.gain.value: ${JSON.stringify(hoverAudio.leftGain.gain.value)},
		// 	.rightGain.gain.value: ${JSON.stringify(hoverAudio.rightGain.gain.value)}`);

		// Resume AudioContext if suspended and start/continue audio
		if (!explainerJS.isPlaying && explainerJS.isAudioContextUnlocked()) {
			if (explainerJS.pauseDuration > 5000) {
				// c•onsole.log("🔁 Long pause — restarting audio");
				hoverAudio.currentTime = 0;
			}

			// Resume context if suspended
			if (explainerJS.audioCtx.state === "suspended") {
				// c•onsole.log(`".audioCtx.state(): ${explainerJS.audioCtx.state}`);
				explainerJS.audioCtx.resume().then(() => {
					// c•onsole.log(`resume-then ".audioCtx.state(): ${explainerJS.audioCtx.state}`);
					// Start audio and fade in
					if (hoverAudio.paused) {
						hoverAudio
							.play()
							.catch((err) => console.warn("Playback failed:", err));
					}

					// Schedule fade-in based on cursor position
					const newT = explainerJS.audioCtx.currentTime;
					hoverAudio.leftGain.gain.linearRampToValueAtTime(
						targetLeft,
						newT + fadeInTime
					);
					hoverAudio.rightGain.gain.linearRampToValueAtTime(
						targetRight,
						newT + fadeInTime
					);
				});
			} else {
				// Context already running, just start audio
				if (hoverAudio.paused) {
					hoverAudio
						.play()
						.catch((err) => console.warn("Playback failed:", err));
				}

				// Schedule fade-in based on cursor position
				hoverAudio.leftGain.gain.linearRampToValueAtTime(
					targetLeft,
					t + fadeInTime
				);
				hoverAudio.rightGain.gain.linearRampToValueAtTime(
					targetRight,
					t + fadeInTime
				);
			}

			explainerJS.isPlaying = true;
			hoverArea.classList.add("audio-active");

			// c•onsole.log(`hoverArea.classList: ${hoverArea.classList},
			// ".paused: ${hoverAudio.paused},
			// ".currentTime: ${hoverAudio.currentTime},
			// explainerJS.isPlaying: ${explainerJS.isPlaying},
			// ".isAudioContextUnlocked(): ${explainerJS.isAudioContextUnlocked()},
			// ".audioCtx.state(): ${explainerJS.audioCtx.state},
			// .targetLeft: ${targetLeft},
			// .targetRight: ${targetRight},
			// .rightGain.gain.value: ${hoverAudio.rightGain.gain.value}`);
		}
	});

	hoverArea.addEventListener("mousemove", (event) => {
		const rect = hoverArea.getBoundingClientRect();
		if (!this.isAudioContextUnlocked()) {
			return;
		}
		const x = (event.clientX - rect.left) / rect.width;

		const targetLeft = Math.min(1, Math.max(0, (0.6 - x) / 0.233));
		const targetRight = Math.min(1, Math.max(0, (x - 0.225) / 0.142));

		const now = explainerJS.audioCtx.currentTime;
		// c•onsole.log(`hoverArea.addEventListener("mousemove" now: ${now}`);
		// Use smooth update instead of hard override
		hoverAudio.leftGain.gain.setTargetAtTime(targetLeft, now, 0.01);
		hoverAudio.rightGain.gain.setTargetAtTime(targetRight, now, 0.01);
	});

	hoverArea.addEventListener("mouseleave", () => {
		// c•onsole.log(`hoverArea mouseleave`);

		if (!explainerJS.audioCtx || !hoverAudio) {
			return;
		}

		explainerJS.mouseLeaveTime = performance.now();
		explainerJS.audioTime = explainerJS.audioCtx.currentTime;
		explainerJS.displayTimes();

		const leftGain = hoverAudio.leftGain;
		const rightGain = hoverAudio.rightGain;

		if (!leftGain || !rightGain || !explainerJS.audioCtx) {
			console.warn("⚠️ Gain nodes not found — skipping fade");
			hoverAudio.pause();
			explainerJS.isPlaying = false;
			hoverArea.classList.remove("audio-active");
			return;
		}

		const fadeOutTime = 0.4;

		// Perform smooth fade
		const fadeStart = explainerJS.audioCtx.currentTime;
		leftGain.gain.setTargetAtTime(0.0001, fadeStart, fadeOutTime / 4);
		rightGain.gain.setTargetAtTime(0.0001, fadeStart, fadeOutTime / 4);

		setTimeout(() => {
			// Instead of pause(), suspend the AudioContext to avoid clicks
			if (explainerJS.audioCtx.state === "running") {
				explainerJS.audioCtx.suspend().then(() => {
					explainerJS.isPlaying = false;
					hoverArea.classList.remove("audio-active");

					// Reset gains for next time
					leftGain.gain.setValueAtTime(1, explainerJS.audioCtx.currentTime);
					rightGain.gain.setValueAtTime(1, explainerJS.audioCtx.currentTime);
				});
			}
		}, fadeOutTime * 1000);
	});
};
//                                                           //
//                                                           //
/////////////// END Hover Audio Player ////////////////////////

// Unlock audio context on first user interaction
explainerJS.unlockAudioContext = function () {
	// c•onsole.log("explainerJS.unlockAudioContext() triggered");

	if (!explainerJS.audioCtx) {
		explainerJS.audioCtx = new (window.AudioContext ||
			window.webkitAudioContext)();
		const audioPrompt = document.querySelector(
			explainerJS.config.enableAudioPromptID
		);

		// c•onsole.log("🟡 audioPrompt element:", audioPrompt);

		if (audioPrompt) {
			audioPrompt.classList.add("hide");
			// c•onsole.log("✅ added 'hide' class");
		}

		explainerJS.audioIsLocked = false;
		// c•onsole.log("✅ AudioContext unlocked");
	}
	// c•onsole.log("✅ Final audioCtx state after unlock:",explainerJS.audioCtx.state);
};

// check audio context to see if it's unlocked
explainerJS.isAudioContextUnlocked = function () {
	// c•onsole.log(`explainerJS.isAudioContextUnlocked(): ${!explainerJS.audioIsLocked}`);
	// c•onsole.log(`explainerJS.audioIsLocked: ${explainerJS.audioIsLocked}`);
	// return explainerJS.audioCtx && explainerJS.audioCtx.state === "running";
	return !explainerJS.audioIsLocked;
};
