// hc-static-js-lock.js gets loaded by initJS.injectScriptsParallel()
// as part of hc-static-js/hc-static-js-init.js
mmm(`✅ LOADED hc-static-js-lock.js`);

// hc-static-js-lock.js

const lockJS = (window.lockJS = window.lockJS || {});

lockJS.unlockStarted = false;
lockJS.audioIsUnlocked = false; // ✅ True if AudioContext is running
// lockJS.audioIsLocked = true; // Derived, mirrors !isUnlocked
lockJS.lastUnlockEvent = null; // Pointer/keyboard event that triggered unlock
lockJS.hasAttempted = false; // ✅ Has user attempted unlock gesture?
lockJS.overlayElement = null;
lockJS.overlayRemoved = false;
lockJS.audioPrompt = null;
lockJS.activePointerId = null;
lockJS.startLocation = null;
lockJS.__referDone = false; // once-per-unlock guard

// listener flags for listener gating
lockJS.overlayListenerFlags = {
	pointerdown: false,
	pointerup: false,
	pointercancel: false,
	keydown: false,
};

// Interactive hover-area DOM elements
lockJS.overlayListenerFlagsXX = {
	hasDownListener: false,
	hasUpListener: false,
	hasCancelListener: false,
	hasKeydownListener: false,
};

lockJS.init = async function () {
	// z•zz();
	// m•mm("🎬 Starting lockJS.init()");
	lockJS.overlayElement = await utilsJS.waitForElement(
		"#global-audio-unlock-overlay"
	);

	if (!lockJS.overlayElement) {
		console.log("⚠️ lockJS: overlay element not found");
		return;
	}

	lockJS.overlayElement.setAttribute("tabindex", "0");

	lockJS.initListenerObjects();

	lockJS.audioIsUnlocked = false; // mirroring
	// lockJS.audioIsLocked = true; // mirroring
	mmm("✅ lockJS initialized");
};

lockJS.onUpEventTest = function (event) {
	if (!lockJS.overlayListenerFlags.pointerup) return;
	if (!event.isPrimary) return;
	if (
		lockJS.activePointerId != null &&
		event.pointerId !== lockJS.activePointerId
	)
		return;

	if (!utilsJS.hasValidCoordinates(event)) return;
	if (!event.passkey) event = eRegistryJS.register(event);
	// utilsJS.removeListener(lockJS.overlayListenerObjects["pointerup"]);
	lockJS.overlayListenerFlags.pointerup = false;
	try {
		lockJS.overlayElement.releasePointerCapture?.(lockJS.activePointerId);
	} catch {
		console.log("⚠️ lockJS.overlayElement.releasePointerCapture failed");
	}
	lockJS.onEnd(event);
	// utilsJS.eventIsTap(event);
	// c•onsole.log(`utilsJS.eventIsTap(event):${utilsJS.eventIsTap(event)}`);
	// clear tracking
	lockJS.activePointerId = null;
	lockJS.startLocation = null;
};

lockJS.onDownEventTest = function (event) {
	// const objId = debugJS.eventId(event);
	// debugJS.markHop(event, "overlay pointerdown listener");
	// c•onsole.log(`▶ pointerdown objId#${objId} (pre-register)`);
	if (!event.isPrimary) return; // ignore non-primary touches
	if (!lockJS.overlayListenerFlags.pointerdown) return;
	if (!event.passkey) event = eRegistryJS.register(event);
	if (!utilsJS.hasValidCoordinates(event)) return;

	// utilsJS.removeListener(lockJS.overlayListenerObjects["pointerdown"]);
	// c•onsole.log(`▶ after register [Event:${event.index}]: objId#${objId} .passkey=${event.passkey}`);

	lockJS.activePointerId = event.pointerId ?? 1;
	lockJS.startLocation = { x: event.clientX, y: event.clientY };
	// c•onsole.log("lockJS.startLocation", lockJS.startLocation);

	// ensure we still get pointerup even if finger moves
	try {
		lockJS.overlayElement.setPointerCapture?.(lockJS.activePointerId);
	} catch {
		console.log("⚠️ lockJS.overlayElement.setPointerCapture failed");
	}

	lockJS.onStart(event);
	utilsJS.eventMayBeTap(event);
};
lockJS.onCancelEventTest = function (event) {
	if (event.pointerId === lockJS.activePointerId) {
		lockJS.activePointerId = null;
		lockJS.startLocation = null;
	}
};

lockJS.onKeydownEventTest = function (event) {
	if (!event.index) event = eRegistryJS.register(event);
	if (["Enter", " ", "Spacebar"].includes(event.passkey)) {
		// m•mm("⌨️ Unlock via keyboard");
		lockJS.handleUnlock(event);
	}
};

lockJS.initListenerObjects = function () {
	const overlay = lockJS.overlayElement;
	const flags = lockJS.overlayListenerFlags;
	lockJS.overlayListenerObjects = {
		pointerup: {
			DOMElement: overlay,
			eventType: "pointerup",
			fnCall: lockJS.onUpEventTest,
			listenerFlags: flags,
			flagKey: "pointerup",
		},
		pointerdown: {
			DOMElement: overlay,
			eventType: "pointerdown",
			fnCall: lockJS.onDownEventTest,
			listenerFlags: flags,
			flagKey: "pointerdown",
		},
		pointercancel: {
			DOMElement: overlay,
			eventType: "pointercancel",
			fnCall: lockJS.onCancelEventTest,
			listenerFlags: flags,
			flagKey: "pointercancel",
		},
		keydown: {
			DOMElement: overlay,
			eventType: "keydown",
			fnCall: lockJS.onKeydownEventTest,
			listenerFlags: flags,
			flagKey: "keydown",
		},
	};
	const listeners = lockJS.overlayListenerObjects;
	utilsJS.addListener(listeners["keydown"]);
	utilsJS.addListener(listeners["pointercancel"]);
	utilsJS.addListener(listeners["pointerdown"]);
	utilsJS.addListener(listeners["pointerup"]);
};

lockJS.onStart = function (event) {
	// debugJS.markHop(event, "lockJS.onStart");
	eRegistryJS.use(event, "lockJS.onStart");

	audiomanagerJS.playStartTime = performance.now();
	// lockJS.startLocation = [event.clientX, event.clientY];
	lockJS.unlockStarted = true;
};

lockJS.onEnd = function (event) {
	// z•zz();
	event = eRegistryJS.use(event, "lockJS.onEnd");
	// c•onsole.log("lockJS.onEnd registered event:", event);

	if (!lockJS.unlockStarted) return;

	const endTime = performance.now();
	const duration = endTime - audiomanagerJS.playStartTime;
	const dx = event.clientX - lockJS.startLocation.x;
	const dy = event.clientY - lockJS.startLocation.y;
	const movement = Math.hypot(dx, dy);

	if (duration > 300 || movement > 10) {
		console.log(
			`⚠️ Not a trusted gesture (duration: ${duration.toFixed(2)}, movement: ${movement.toFixed(2)})`
		);
		lockJS.reset();
		return;
	}

	console.log(
		`✅ Trusted gesture (duration: ${duration.toFixed(2)}, movement: ${movement.toFixed(2)})`
	);
	lockJS.handleUnlock(event);
};

lockJS.handleUnlock = async function (event) {
	event = eRegistryJS.use(event, "lockJS.handleUnlock");

	// After detecting trusted gesture:
	// audiomanagerJS.handleUnlockEvent().then(() => {
	await audiomanagerJS.handleUnlockEvent();

	// Remove overlayElement, set lastUnlockEvent
	// if (lockJS.audioIsUnlocked || lockJS.unlockStarted) return;
	if (lockJS.audioIsUnlocked) return;
	lockJS.unlockStarted = true;

	// release pointer capture if we had it (safe if keyboard path)
	try {
		if (lockJS.overlayElement?.hasPointerCapture?.(event.pointerId)) {
			lockJS.overlayElement.releasePointerCapture(event.pointerId);
		}
	} catch {
		console.log("⚠️ lockJS.overlayElement.releasePointerCapture failed");
	}

	// Remove overlay exactly once
	if (!lockJS.overlayRemoved && lockJS.overlayElement) {
		lockJS.overlayElement.remove();
		lockJS.overlayElement = null;
		lockJS.overlayRemoved = true;
		// stateJS.page.overlayRemoved = true; // mirror to shared state
		// m•mm(`✅ lockJS.overlayElement removed`);
	}

	// Determine coordinates once (also used by downstream modules)
	// c•onsole.log(`utilsJS.coordsFrom(event):${utilsJS.coordsFrom(event)}`);
	const [x, y] = utilsJS.coordsFrom(event);

	// Publish a snapshot for other modules
	lockJS.lastUnlockEvent = {
		timeStamp: event.timeStamp,
		x,
		y,
		pointerType: event.pointerType,
		pointerId: event.pointerId,
	};

	// m•mm(`✅ lockJS.lastUnlockEvent:${JSON.stringify(lockJS.lastUnlockEvent)}`);

	// Enable UI interactions
	// Resume the explainer AudioContext if needed (before re-dispatch so UI sounds can start)
	const audioCtx = audiomanagerJS.getAudioCtx();
	if (!audioCtx) {
		console.log("⚠️ Failed to get AudioContext");
		return;
	}
	if (audioCtx && audioCtx.state === "suspended") {
		try {
			await audioCtx.resume();
		} catch (err) {
			console.log("⚠️ AudioContext resume failed:", err?.message || err);
			return lockJS.reset?.();
		}
	}

	// Mark unlocked (source of truth)
	lockJS.audioIsUnlocked = true;
	// lockJS.audioIsLocked = !lockJS.audioIsUnlocked;

	// Fade out the enable-audio prompt (same as before)
	const prompt = document.getElementById("enable-audio-prompt");
	if (prompt) {
		prompt.addEventListener("animationend", () => prompt.remove(), {
			once: true,
		});
		prompt.classList.add("hide");
		lockJS.audioPrompt = null;
	}

	lockJS.unlockStarted = false;

	// m•mm(`Handoff to referUnlockEvent(event:[Event:${event.index}])`);
	// NEW: hand off to the referral helper
	lockJS.referUnlockEvent(event);
};

lockJS.referUnlockEvent = function (baseEvent) {
	baseEvent = eRegistryJS.use(baseEvent, "lockJS.referUnlockEvent");
	if (lockJS.__referDone) return; // run once
	lockJS.__referDone = true;

	// c•onsole.log("utilsJS.coordsFrom(baseEvent)", utilsJS.coordsFrom(baseEvent));
	const [x, y] = utilsJS.coordsFrom(baseEvent);
	let area =
		explainerJS?.state?.hoverArea ||
		document.getElementById("audio-hover-area");
	// refresh if a stale reference somehow slipped through
	if (area && !area.isConnected) {
		area = document.getElementById("audio-hover-area");
	}

	// Let layout settle after overlay removal so elementFromPoint hits the true target
	setTimeout(() => {
		const el = document.elementFromPoint(x, y);
		// c•onsole.log("[x, y]", [x, y]);
		console.log(
			`document.elementFromPoint(${x.toFixed(2)}, ${y.toFixed(2)}): ${el.id || "undefined"}`
		);
		if (!el) return;
		if (el === area)
			if (area && area.contains(el)) {
				// c•onsole.log(`${area.id} === .elementFromPoint ? ${el === area}`);
				// If unlock occurred over the hover area → dispatch your custom event
				// const customPasskey = `audiounlock|${pid}|${tgt}|${ts}`;

				// Create synthetic PointerEvent with standard properties
				const unlockEvent = new PointerEvent("audiounlock", {
					clientX: x,
					clientY: y,
					target: el.id || area.id || "",
					pointerId: baseEvent.pointerId ?? 0,
					pointerType: baseEvent.pointerType,
					timeStamp: Math.round(
						typeof baseEvent.timeStamp === "number"
							? baseEvent.timeStamp
							: performance.now()
					),
					bubbles: true,
					composed: true,
				});

				area.dispatchEvent(unlockEvent);
				// ADD THIS DEBUG:
				// c•onsole.log('🎯 PointerEvent "audiounlock" dispatched to:', area.id);
				return;
			}

		// Otherwise → pass a single click to the revealed target (avoid pointerdown/up)
		// Focus common controls first (optional but helpful)
		if (
			el.matches(
				'input, textarea, select, [contenteditable], button, [role="button"], a[href]'
			)
		) {
			el.focus?.({ preventScroll: true });
		}

		// Prefer native programmatic activation
		if (typeof el.click === "function") {
			el.click(); // triggers click listeners + default action
		} else {
			// Fallback: fire a bubbling MouseEvent('click')
			const clickEv = new MouseEvent("click", {
				bubbles: true,
				cancelable: true,
				view: window,
				clientX: x,
				clientY: y,
				button: 0,
			});
			try {
				eRegistryJS.register?.(clickEv);
			} catch {}
			el.dispatchEvent(clickEv);
		}
	}, 0);
};

lockJS.reset = function () {
	// z•zz();
	// m•mm("🔁 lockJS.reset()");
	lockJS.unlockStarted = false;
	lockJS.hasAttempted = false;
	lockJS.audioIsUnlocked = false; // mirroring
	lockJS.overlayListenerFlags.pointerup = true;
	lockJS.overlayListenerFlags.pointerdown = true;
	// lockJS.audioIsLocked = true; // mirroring
};

lockJS.activateAtPoint = function (x, y) {
	// m•mm(`lockJS.activateAtPoint(x:${x},y:${y})`);
};

/**
 * Test helper: simulate an unlock at (x,y) without requiring a real tap.
 * - If x,y are omitted, uses the center of #audio-hover-area (or viewport center).
 * - Updates lockJS.lastUnlockEvent / isUnlocked and optionally dispatches
 *   a "audiounlock" CustomEvent that explainerJS can react to.
 *
 * @param {number} [x]
 * @param {number} [y]
 * @param {Object} [opts]
 * @param {boolean} [opts.dispatch=true]  Dispatch "audiounlock" on hover area
 * @param {boolean} [opts.resume=true]    Try to resume explainer AudioContext
 * @param {number}  [opts.pointerId=9999] Synthetic pointerId used in detail payload
 * @returns {{x:number,y:number,dispatched:boolean}}
 */

lockJS.simulateUnlockAtX = async function (x, y, opts = {}) {
	const { dispatch = true, resume = true, pointerId = 9999 } = opts;
	const area = document.getElementById("audio-hover-area");

	// Pick coordinates
	let px = Number.isFinite(x) ? x : null;
	let py = Number.isFinite(y) ? y : null;
	if (px == null || py == null) {
		if (area) {
			const r = area.getBoundingClientRect();
			px = Math.round(r.left + r.width / 2);
			py = Math.round(r.top + r.height / 2);
		} else {
			px = Math.round(window.innerWidth / 2);
			py = Math.round(window.innerHeight / 2);
		}
	}

	// Mirror real unlock state (used by downstream modules)
	const ts = performance.now();
	lockJS.lastUnlockEvent = {
		timeStamp: ts,
		x: px,
		y: py,
		pointerType: "test",
		pointerId,
	};
	lockJS.audioIsUnlocked = true;
	// lockJS.audioIsLocked = false;
	stateJS.page.overlayRemoved = true;
	console.log(`🔓 Simulated unlock at (${px}, ${py})`);
	const audioCtx = audiomanagerJS.getAudioCtx();
	// Optionally resume explainer audio context (matches real unlock behavior)
	try {
		if (resume && audioCtx && audioCtx.state === "suspended") {
			await audioCtx.resume();
		}
	} catch (err) {
		console.log("⚠️ simulateUnlockAt: resume failed:", err);
	}

	// Optionally notify interested listeners (explainerJS listens for this shape)
	let dispatched = false;
	if (dispatch && area) {
		const customPasskey = `audiounlock|${pointerId}|${area.id}|${Math.round(ts)}`;

		area.dispatchEvent(
			new CustomEvent("audiounlock", {
				detail: {
					x: px,
					y: py,
					customPasskey,
					pointerType: "test",
					pointerId,
				},
				bubbles: true,
				composed: true,
			})
		);
		dispatched = true;
	}

	return { x: px, y: py, dispatched };
};
