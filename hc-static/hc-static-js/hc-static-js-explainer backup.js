// hc-static-js-explainer.js gets loaded by hc-views/layout/index.ejs
// as a <script> element at the bottom of the <body>
// m•mm(`✅ LOADED hc-static-js-explainer.js`);
// mmm(`Explainer script loaded, DOM ready state:${document.readyState}`);

// hc-static-js-explainer.js (updated with custom mobile pointer logic)

(function () {
	"use strict";

	const explainerJS = (window.explainerJS = window.explainerJS || {});

	explainerJS.standBy = async function (event) {
		let hoverArea;

		// Audio elements
		const hoverAudio = {
			ctx: null,
			buffer: null,
			sourceNode: null,
			leftGainNode: null,
			rightGainNode: null,
			splitterNode: null,
			mergerNode: null,
			masterGainNode: null,
			volume: null,
			muted: null,
			readyState: null,
			networkState: null,
		};

		// State management
		const state = {
			isPlaying: false,
			isPaused: false,
			pausedAt: 0,
			pauseTime: 0,
			startTime: 0,
			audioTime: 0,
			userStopped: false,
			isHovering: false,
			lastInteractionType: null,
			touchStart: { x: 0, y: 0, time: 0 },
			touchMoved: false,
			isHolding: false,
			holdTimer: null,
			currentFadeTimeout: null,
			requiresUserGesture: window.PLATFORM.isMobile,
			audioContextNeedsResume: false,
			lastUnlockTime: null,
			unlockInProgress: false,
			isMoving: false,
			hoverAudioReady: false,
			lastTapWasToggleOff: false,
		};

		// Configuration
		const CONFIG = {
			hoverAudioSrc: "/hc-static-media/Give My Regards to Broadway LOOP.mp3",
			fadeInMs: 25,
			fadeOutMs: 250,
			pauseResetThresholdMs: 5000,
			touchHoldThresholdMs: 300,
			touchMoveThresholdPx: 10,
			gainLeftOffset: 0.6,
			gainLeftDivisor: 0.233,
			gainRightOffset: 0.225,
			gainRightDivisor: 0.142,
		};

		// Private helper: set up listeners
		function addHoverPlayer() {
			zzz();
			console.log("🎧 addHoverPlayer called");
			// Add hover/touch/pointer listeners to hoverArea
		}

		async function prepHoverAudio() {
			zzz();
			if (state.hoverAudioReady) return;

			if (!hoverAudio.ctx) {
				hoverAudio.ctx = new (window.AudioContext ||
					window.webkitAudioContext)();
				state.audioContextNeedsResume = true;
			}

			console.log(`hoverAudio.ctx.currentTime:${hoverAudio.ctx.currentTime}`);

			if (!(await loadAudioBuffer())) return false;
			if (!createAudioNodes()) return false;

			state.hoverAudioReady = true;
		}

		// s‡etupExplainerListeners();

		// Utility: calculate stereo gains
		function exZplainerJS.caZlculateGaZins(normalizedX) {
			const leftGain = Math.min(
				1,
				Math.max(
					0,
					(CONFIG.gainLeftOffset - normalizedX) / CONFIG.gainLeftDivisor
				)
			);
			const rightGain = Math.min(
				1,
				Math.max(
					0,
					(normalizedX - CONFIG.gainRightOffset) / CONFIG.gainRightDivisor
				)
			);
			return { left: leftGain, right: rightGain };
		}

		// AudioContext management
		async function ensureAudioContextRunning() {
			if (!hoverAudio.ctx) return false;
			if (hoverAudio.ctx.state === "suspended") {
				try {
					await hoverAudio.ctx.resume();
					state.audioContextNeedsResume = false;
				} catch {
					state.audioContextNeedsResume = true;
					return false;
				}
			}
			return hoverAudio.ctx.state === "running";
		}

		// Load buffer
		async function loadAudioBuffer() {
			try {
				const resp = await fetch(CONFIG.hoverAudioSrc);
				const data = await resp.arrayBuffer();
				hoverAudio.buffer = await hoverAudio.ctx.decodeAudioData(data);
				mmm("Decoded buffer channels:", hoverAudio.buffer.numberOfChannels);
				return true;
			} catch {
				return false;
			}
		}

		// Node creation
		function createAudioNodes() {
			try {
				hoverAudio.splitterNode = hoverAudio.ctx.createChannelSplitter(2);
				hoverAudio.leftGainNode = hoverAudio.ctx.createGain();
				hoverAudio.rightGainNode = hoverAudio.ctx.createGain();
				hoverAudio.mergerNode = hoverAudio.ctx.createChannelMerger(2);
				hoverAudio.masterGainNode = hoverAudio.ctx.createGain();
				hoverAudio.splitterNode.connect(hoverAudio.leftGainNode, 0);
				hoverAudio.splitterNode.connect(hoverAudio.rightGainNode, 1);
				hoverAudio.leftGainNode.connect(hoverAudio.mergerNode, 0, 0);
				hoverAudio.rightGainNode.connect(hoverAudio.mergerNode, 0, 1);
				hoverAudio.mergerNode.connect(hoverAudio.masterGainNode);
				hoverAudio.masterGainNode.connect(hoverAudio.ctx.destination);
				return true;
			} catch {
				return false;
			}
		}

		// Cleanup
		async function cleanupAudioSource() {
			if (state.currentFadeTimeout) clearTimeout(state.currentFadeTimeout);
			if (hoverAudio.sourceNode) {
				hoverAudio.sourceNode.onended = null;
				try {
					hoverAudio.sourceNode.stop();
				} catch {}
				try {
					hoverAudio.sourceNode.disconnect();
				} catch {}
				hoverAudio.sourceNode = null;
			}
			if (hoverAudio.masterGainNode) {
				const t = hoverAudio.ctx.currentTime;
				hoverAudio.masterGainNode.gain.cancelScheduledValues(t);
				hoverAudio.masterGainNode.gain.setValueAtTime(0, t);
			}
		}

		// Core audio controls
		async function startAudio(reset = false) {
			// 1️⃣ Make sure the buffer is loaded
			if (!hoverAudio.buffer) {
				console.warn("Audio buffer missing – loading now…");
				const ok = await loadAudioBuffer();
				if (!ok) {
					console.error("Failed to load audio buffer");
					return false;
				}
			}
			// 2️⃣ Log channel count for sanity
			console.log(
				"Decoded buffer channels:",
				hoverAudio.buffer.numberOfChannels
			);

			// 3️⃣ Make sure your node graph exists
			if (!hoverAudio.mergerNode) {
				console.warn("Audio nodes not created – creating now…");
				if (!createAudioNodes()) {
					console.error("Failed to create audio nodes");
					return false;
				}
			}
			if (!(await ensureAudioContextRunning())) return false;
			if (hoverAudio.sourceNode && !reset) return true;
			if (hoverAudio.sourceNode) await cleanupAudioSource();
			const src = hoverAudio.ctx.createBufferSource();
			src.buffer = hoverAudio.buffer;
			src.loop = true;
			src.connect(hoverAudio.splitterNode);
			hoverAudio.sourceNode = src;
			src.start(0, reset ? 0 : state.pausedAt || 0);
			state.isPlaying = true;
			state.userStopped = false;
			state.startTime = hoverAudio.ctx.currentTime;
			state.currentFadeTimeout = setTimeout(() => {
				/* fade logic */
			}, CONFIG.fadeInMs);
			hoverArea.classList.add("audio-active");
			return true;
		}

		async function stopAudio(userInitiated) {
			if (!state.isPlaying) return;
			state.isPlaying = false;
			state.userStopped = userInitiated;
			state.pausedAt = hoverAudio.ctx.currentTime;
			hoverArea.classList.remove("audio-active");
			state.currentFadeTimeout = setTimeout(async () => {
				await cleanupAudioSource();
			}, CONFIG.fadeOutMs);
		}

		function updateStereoBalance(clientX, clientY) {
			const rect = hoverArea.getBoundingClientRect();
			const norm = (clientX - rect.left) / rect.width;
			const gains = exZplainerJS.caZlculateGaZins(norm);
			hoverAudio.leftGainNode.gain.setValueAtTime(
				gains.left,
				hoverAudio.ctx.currentTime
			);
			hoverAudio.rightGainNode.gain.setValueAtTime(
				gains.right,
				hoverAudio.ctx.currentTime
			);
		}

		// Pointer-based interaction
		function onPointerDown(event) {
			window.EventRegistry.use(event, "explainerJS.onPointerDown");
			event.preventDefault();
			const x = event.clientX,
				y = event.clientY;
			state.touchStart = { x, y, time: Date.now() };
			state.touchMoved = false;
			state.isHolding = false;
			// only start on hold
			state.holdTimer = setTimeout(() => {
				state.isHolding = true;
				startAudio();
			}, CONFIG.touchHoldThresholdMs);
		}

		function onPointerMove(event) {
			if (!state.isMoving) {
				window.EventRegistry.use(event, "explainerJS.onPointerMove");
				state.isMoving = true;
			}

			event.preventDefault();
			const x = event.clientX,
				y = event.clientY;
			const dx = Math.abs(x - state.touchStart.x),
				dy = Math.abs(y - state.touchStart.y);
			if (
				dx > CONFIG.touchMoveThresholdPx ||
				dy > CONFIG.touchMoveThresholdPx
			) {
				state.touchMoved = true;
				if (state.holdTimer) {
					clearTimeout(state.holdTimer);
					state.holdTimer = null;
				}
			}
			if (state.isHovering && state.isPlaying) updateStereoBalance(x, y);
		}

		function onPointerUp(event) {
			window.EventRegistry.use(event, "explainerJS.onPointerUp");
			event.preventDefault();
			// clear the pending hold
			clearTimeout(state.holdTimer);

			// compute tap vs. hold
			const duration = Date.now() - state.touchStart.time;
			const dx = event.clientX - state.touchStart.x;
			const dy = event.clientY - state.touchStart.y;
			const moved = Math.hypot(dx, dy) > CONFIG.touchMoveThresholdPx;
			const isTap = duration < CONFIG.touchHoldThresholdMs && !moved;

			if (isTap) {
				// tap = toggle play/pause, with reset if paused > threshold
				const now = Date.now();
				const reset =
					state.pausedAt && now - state.pausedAt > CONFIG.pauseResetThresholdMs;
				if (state.isPlaying) {
					stopAudio(true);
				} else {
					startAudio(reset);
				}
			} else if (state.isHolding) {
				// ended a hold gesture → stop
				stopAudio(true);
				state.isHolding = false;
			}

			state.isMoving = false;
		}

		function onPointerEnter(event) {
			window.EventRegistry.use(event, "explainerJS.onPointerEnter");
			state.isHovering = true;
			const x = event.clientX,
				y = event.clientY;
			updateStereoBalance(x, y);
			startAudio();
		}

		function onPointerLeave(event) {
			window.EventRegistry.use(event, "explainerJS.onPointerLeave");
			state.isHovering = false;
			state.isMoving = false;
			stopAudio();
		}

		// Unlock sequence handler (unchanged)
		function handleUnlockGesture() {
			/* existing logic */
		}

		function waitForAudioContext(timeout = 30000) {
			return new Promise((res, rej) => {
				const start = Date.now();
				(function check() {
					if (hoverAudio.ctx) return res();
					if (Date.now() - start > timeout) return rej();
					setTimeout(check, 100);
				})();
			});
		}

		// Initialization
		explainerJS.init = async function () {
			// z•zz();
			mmm("🎬 explainerJS.init() starting");
			try {
				hoverArea = await utilsJS.waitForElement("#audio-hover-area");
			} catch (err) {
				console.warn(
					`❌ explainerJS.init(): hover area not found or timed out: ${err}`
				);
				return false;
			}

			await prepHoverAudio?.();
			// addHoverPlayer?.();

			initPublicAPI();

			setupExplainerListeners();

			console.log("✅ explainerJS.init() complete");
			return true;

			if (!(await loadAudioBuffer())) return false;
			if (!createAudioNodes()) return false;
			handleUnlockGesture();
			state.lastUnlockTime = Date.now();
			mmm("Explainer audio system initialized successfully");
			return true;
		};

		// Define clock utilities immediately for handlers.js
		async function ctxClockResume() {
			if (!hoverAudio.ctx) {
				console.warn("hoverAudio.ctx not available for resume");
				return;
			}

			if (hoverAudio.ctx.state === "suspended") {
				try {
					await hoverAudio.ctx.resume();
					mmm(
						`AudioContext resumed via ctxClockResume, state: ${hoverAudio.ctx.state}`
					);
				} catch (error) {
					console.warn("Failed to resume AudioContext:", error);
					throw error;
				}
			}
		}

		async function ctxClockSuspend() {
			if (!hoverAudio.ctx) {
				console.warn("hoverAudio.ctx not available for suspend");
				return;
			}

			if (hoverAudio.ctx.state === "running") {
				try {
					await hoverAudio.ctx.suspend();
					mmm(
						`AudioContext suspended via ctxClockSuspend, state: ${hoverAudio.ctx.state}`
					);
				} catch (error) {
					console.warn("Failed to suspend AudioContext:", error);
					throw error;
				}
			}
		}

		// clock handlers
		function ctxClockTime() {
			if (!hoverAudio.ctx) {
				console.warn("hoverAudio.ctx not available for time");
				return 0;
			}
			return hoverAudio.ctx.currentTime;
		}

		function isAudioContextUnlocked() {
			return hoverAudio.ctx && hoverAudio.ctx.state === "running";
		}

		function initPublicAPI() {
			zzz();
			// Public API

			explainerJS.hoverAudio = hoverAudio;
			explainerJS.hoverAudioCtx = hoverAudio.ctx;

			explainerJS.config = CONFIG;
			explainerJS.ctxClockResume = ctxClockResume;
			explainerJS.ctxClockSuspend = ctxClockSuspend;
			explainerJS.ctxClockTime = ctxClockTime;
			explainerJS.currentTime = explainerJS.hoverAudioCtx.currentTime;
			explainerJS.getPlatform = () => ({ ...PLATFORM });
			explainerJS.getState = () => ({ ...state });
			explainerJS.hoverArea = hoverArea;
			explainerJS.hoverAudioState = explainerJS.hoverAudioCtx.state;
			explainerJS.isAudioContextUnlocked = isAudioContextUnlocked;
			explainerJS.isHovering = state.isHovering;
			explainerJS.isPaused = state.isPaused;
			explainerJS.isPlaying = state.isPlaying;
			explainerJS.leftGain = hoverAudio.leftGainNode;
			explainerJS.networkState = hoverAudio.networkState;
			explainerJS.pointerEnterTime = statevent.pointerEnterTime;
			explainerJS.pointerLeaveTime = statevent.pointerLeaveTime;
			explainerJS.readyState = hoverAudio.readyState;
			explainerJS.rightGain = hoverAudio.rightGainNode;
			explainerJS.sourceNode = hoverAudio.sourceNode;
			explainerJS.startAudio = startAudio;
			explainerJS.state = state;
			explainerJS.stopAudio = stopAudio;
			explainerJS.updateStereoBalance = updateStereoBalance;
			explainerJS.volume = hoverAudio.volume;
		}

		////////////////////// EVENT LISTENERS ////////////////////////
		//                                                           //
		//                                                           //
		function setupExplainerListeners() {
			zzz();
			// Attach pointer-only listeners
			if (!hoverArea) return;
			const area = hoverArea;
			[
				["pointerenter", onPointerEnter],
				["pointerleave", onPointerLeave],
				["pointerdown", onPointerDown],
				["pointerup", onPointerUp],
			].forEach(([evt, fn]) => {
				area.addEventListener(evt, (event) => {
					if (evt != "pointermove" || !state.isMoving) {
						window.EventRegistry.register(event);
					}
					fn(event);
				});
			});
			area.addEventListener("pointermove", (event) => {
				if (!state.isMoving) {
					window.EventRegistry.register(event);
				}
				onPointerMove(event);
			});
			mmm(`Explainer event listeners setup complete - pointer events only`);
		}
		//                                                           //
		//                                                           //
		///////////////////// END EVENT LISTENERS /////////////////////
	};
})();
