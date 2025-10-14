// hc-static-js-lock.js gets loaded by initJS.injectScriptsParallel()
// as part of hc-static-js/hc-static-js-init.js
mmm(`✅ LOADED hc-static-js-lock.js`);

// hc-static-js-lock.js

const lockJS = (window.lockJS = window.lockJS || {});

lockJS.unlockingInProgress = false;
lockJS.hasAttempted = false;
lockJS.overlayElement = null;
lockJS.overlayRemoved = false;
lockJS.audioPrompt = null;
lockJS.lastUnlockEvent = null;

lockJS.init = async function () {
	// z•zz();
	mmm("🎬 Starting lockJS.init()");
	lockJS.overlayElement = await utilsJS.waitForElement(
		"#global-audio-unlock-overlay"
	);

	if (!lockJS.overlayElement) {
		console.warn("❌ lockJS: overlay element not found");
		return;
	}

	lockJS.overlayElement.setAttribute("tabindex", "0");

	lockJS.overlayElement.addEventListener(
		"pointerdown",
		(event) => {
			if (!event.index) event = eRegistryJS.register(event);
			lockJS.onStart(event);
		},
		{ passive: false }
	);

	lockJS.overlayElement.addEventListener(
		"pointerup",
		(event) => {
			if (!stateJS.audio.isUnlocked) {
				if (eRegistryJS.register(event)) {
					lockJS.onEnd(event);
				}
			}
		},
		{ passive: false }
	);

	lockJS.overlayElement.addEventListener("keydown", (event) => {
		if (!event.index) event = eRegistryJS.register(event);
		if (["Enter", " ", "Spacebar"].includes(event.key)) {
			mmm("⌨️ Unlock via keyboard");
			lockJS.handleUnlock(event);
		}
	});

	stateJS.audio.isUnlocked = false; // mirroring
};

lockJS.onStart = function (event) {
	// z•zz();
	eRegistryJS.use(event, "lockJS.onStart");

	// check for valid coordinates
	if (!utilsJS.hasValidCoordinates(event)) {
		mmm("⛔️ Invalid coordinates — unlockStart canceled");
		lockJS.reset();
		return;
	}

	lockJS.startTime = performance.now();
	lockJS.startLocation = [event.clientX, event.clientY];
	lockJS.startTriggered = true;
};

lockJS.onEnd = function (event) {
	// z•zz();
	eRegistryJS.use(event, "lockJS.onEnd");

	if (!lockJS.startTriggered) return;

	const endTime = performance.now();
	const duration = endTime - lockJS.startTime;
	const dx = event.clientX - lockJS.startLocation[0];
	const dy = event.clientY - lockJS.startLocation[1];
	const movement = Math.hypot(dx, dy);

	if (duration > 300 || movement > 10) {
		mmm(
			`⛔️ Not a trusted gesture (duration: ${duration.toFixed(2)}, movement: ${movement.toFixed(2)})`
		);
		lockJS.reset();
		return;
	}

	mmm(
		`✅ Trusted gesture (duration: ${duration.toFixed(2)}, movement: ${movement.toFixed(2)})`
	);
	lockJS.handleUnlock(event);
};

lockJS.handleUnlock = async function (event) {
	zzz();
	eRegistryJS.use(event, "lockJS.handleUnlock");

	// Guards
	if (stateJS.audio.isUnlocked) return;
	if (lockJS.unlockingInProgress) return;
	lockJS.unlockingInProgress = true;

	lockJS.lastUnlockEvent = event;
	const x = event.clientX,
		y = event.clientY;

	if (lockJS.overlayElement?.hasPointerCapture?.(event.pointerId)) {
		try {
			lockJS.overlayElement.releasePointerCapture(event.pointerId);
		} catch {
			console.log(`pointer capture release failed`);
		}
	}

	// Remove overlay exactly once
	if (!lockJS.overlayRemoved && lockJS.overlayElement) {
		lockJS.overlayElement.remove();
		lockJS.overlayElement = null;
		lockJS.overlayRemoved = true;
	}

	// Publish a lightweight snapshot for other modules
	stateJS.audio.lastUnlockEvent = {
		time: event.timeStamp,
		x,
		y,
		pointerType: event.pointerType,
		pointerId: event.pointerId,
	};

	// Resume the explainer AudioContext if needed
	if (
		explainerJS.hoverAudioCtx &&
		explainerJS.hoverAudioCtx.state === "suspended"
	) {
		try {
			await explainerJS.hoverAudioCtx.resume();
			mmm("🔊 AudioContext resumed");
		} catch (err) {
			mmm("❌ AudioContext resume failed:", err?.message || err);
			lockJS.unlockingInProgress = false;
			if (typeof lockJS.reset === "function") lockJS.reset();
			return;
		}
	}

	// Mark unlocked (source of truth for everyone else)
	stateJS.audio.isUnlocked = true;

	const area = explainerJS.state.hoverArea;
	const el = document.elementFromPoint(x, y);
	console.log(
		`elementFromPoint(x:${x.toFixed(2)}, y:${y.toFixed(2)}) el.id:${el.id}|.className:${el.className}`
	);
	// If unlock occurred over the hover area, start once
	if (area) {
		const r = area.getBoundingClientRect();
		const inside = x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
		if (inside) {
			// area.dispatchEvent(unlockEvent);
			// console.log(`dispatch 1`);
			const pid = event.pointerId ?? "";
			const tgt = event.currentTarget?.id || event.target?.id || "";
			const ts =
				typeof event.timeStamp === "number" ? Math.round(event.timeStamp) : 0;
			const customKey = `hc:audio-unlocked|${pid}|${tgt}|${ts}`;
			area.dispatchEvent(
				new CustomEvent("hc:audio-unlocked", {
					detail: { x, y, time: performance.now(), customKey },
					bubbles: true,
					composed: true,
				})
			);
		}
	}

	// 1) Start immediately if over hover area
	if (area && (area === el || area.contains(el))) {
		console.log(`dispatch 2`);
		area.dispatchEvent(
			new CustomEvent("hc:audio-unlocked-x", {
				detail: { x, y, time: performance.now(), reference: event },
				bubbles: true,
				composed: true,
			})
		);
	} else if (el) {
		console.log(`el.type:${el.type || "none"}`);
		console.log(`el.tagName:${el.tagName || "none"}`);
		console.log(`el.control:${el.control || "none"}`);
		// 2) Ensure focus for text-like controls (before any await)
		const isFocusable = el.matches?.(
			'input, textarea, select, [contenteditable="true"]'
		);
		const target = el.tagName === "LABEL" && el.control ? el.control : el;
		if (isFocusable || target === el.control) {
			try {
				target.focus({ preventScroll: true });
				if (
					target.setSelectionRange &&
					/^(text|search|tel|url|email|password)$/.test(target.type || "")
				) {
					const len = target.value.length;
					target.setSelectionRange(len, len);
				}
			} catch {
				console.log(`Focusable target failed.`);
			}
		}

		// 3) Replay a native click for activation
		const clickable = /^(A|BUTTON|INPUT|LABEL|TEXTAREA|SELECT)$/;
		if (
			typeof el.click === "function" &&
			!el.disabled &&
			clickable.test(el.tagName)
		) {
			el.click();
		} else {
			el.dispatchEvent(
				new MouseEvent("click", {
					bubbles: true,
					cancelable: true,
					clientX: x,
					clientY: y,
					button: 0,
					buttons: 0,
					view: window,
				})
			);
		}
	}

	// 4) Now resume audio (after native focus/click happened)
	if (
		explainerJS.hoverAudio.ctx &&
		explainerJS.hoverAudio.ctx.state === "suspended"
	) {
		try {
			await explainerJS.hoverAudio.ctx.resume();
			mmm("🔊 AudioContext resumed");
		} catch (err) {
			mmm("❌ AudioContext resume failed:", err?.message || err);
			lockJS.unlockingInProgress = false;
			if (typeof lockJS.reset === "function") lockJS.reset();
			return;
		}
	}
	stateJS.audio.isUnlocked = true;

	// Fade out the enable-audio prompt
	const prompt = document.getElementById("enable-audio-prompt");
	if (prompt) {
		prompt.addEventListener("animationend", () => prompt.remove(), {
			once: true,
		});
		prompt.classList.add("hide");
		lockJS.audioPrompt = null;
	}

	lockJS.unlockingInProgress = false;
	console.log(`stateJS.audio.isUnlocked:${stateJS.audio.isUnlocked}`);
};

lockJS.reset = function () {
	// z•zz();
	mmm("🔁 lockJS.reset()");
	lockJS.startTriggered = false;
	lockJS.hasAttempted = false;
	stateJS.audio.isUnlocked = false; // mirroring
};

lockJS.activateAtPoint = function (x, y) {
	mmm(`lockJS.activateAtPoint(x:${x},y:${y})`);
};
