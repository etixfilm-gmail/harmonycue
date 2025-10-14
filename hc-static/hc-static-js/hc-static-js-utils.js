/* eslint-env browser */

// hc-static-js-utils.js gets loaded by initJS.injectScriptsParallel
// as a <script> element within the <body>
mmm(`✅ LOADED hc-static-js-utils.js`);

// hc-static-js-utils.js
// Shared utility functions for DOM, timing, and validation

const utilsJS = (window.utilsJS = window.utilsJS || {});

// constants
utilsJS.eventStartTime = -1;
utilsJS.eventEndTime = -1;
utilsJS.eventStartLocation = null;
utilsJS.eventStartTriggered = true;
utilsJS.initialized = false;

utilsJS.initX = async function () {
	// z•zz(); placeholder function
	// m•mm("🎬 Starting utilsJS.init()");
};

utilsJS.init = async function () {
	if (this.isInitialized) {
		// c•onsole.log("utilsJS already initialized");
		return false;
	}
	// m•mm("🎬 Starting utilsJS.init()");

	try {
		this.isInitialized = true;
	} catch (err) {
		console.log("⚠️ err:", err);
		return false;
	}

	mmm("✅ utilsJS initialized");
};

// Safe init runner (keeps Promise.all ergonomics)
utilsJS.safeInit = async function (ns, ready) {
	// ns = namespace, get name from debugJS.getNamespaceName(ns)
	// is a function that signals when the ns is ready, can be empty
	// c•onsole.log(`safeInit ns:${debugJS.getNamespaceName(ns)}`);
	// c•onsole.log("ready", ready);
	// z•zz();

	try {
		// c•onsole.log(`if (!${debugJS.getNamespaceName(ns)}:${!ns} || (typeof ${debugJS.getNamespaceName(ns)}.init:${typeof ns.init} !== "function")):${typeof ns.init !== "function"}):${!ns || typeof ns.init !== "function"}`);
		// c•onsole.log(`---- return "skipped:no-init";`);
		if (!ns || typeof ns.init !== "function") {
			// c•onsole.log(`---- RETURN "skipped:no-init"`);
			return "skipped:no-init";
		}
		// c•onsole.log(`else`);
		// c•onsole.log(`---- if !!ready:${!!ready} then`);
		const notReady = !ready;
		if (!notReady) {
			// c•onsole.log(`---- ---- if ((typeof ready:${typeof ready} === "function"):${typeof ready === "function"} && !ready():${!ready()}):${typeof ready === "function" && !ready()} then`);
			if (typeof ready === "function" && !ready()) {
				// c•onsole.log(`---- ---- ---- RETURN "skipped:not-ready"`);
				return "skipped:not-ready";
			}
		}

		// c•onsole.log(`---- else`);

		const r = ns.init(); // returns a promise unless specified
		// const rName = debugJS.getNamespaceName(ns);
		// c•onsole.log(`r = ${debugJS.getNamespaceName(ns)} => ${r}`);
		// c•onsole.log(`---- ---- if (${rName}:${!!r} && (typeof ${rName}.then:${typeof (r.then == null)} === "function"):${r && typeof r.then === "function"})`);
		// c•onsole.log(`---- ---- ---- await ${rName};`);
		// if (r && typeof r.then === "function") c•onsole.log(`AWAIT ${rName};`);
		if (r && typeof r.then === "function") await r; // await promises
		// c•onsole.log(`RETURN "ok";`);
		return "ok";
	} catch (err) {
		console.log("⚠️ safeInit error:", err);
		return "error";
	}
};

// Execute inline <script> tags inside a container (no src)
utilsJS.runInlineScripts = function (root) {
	const nodes = root.querySelectorAll("script:not([src])");
	nodes.forEach((old) => {
		const t = (old.type || "").toLowerCase();
		if (t && !["", "text/javascript", "application/javascript"].includes(t))
			return;
		const s = document.createElement("script");
		// ✅ Run in its own scope so top-level const/let in the snippet won't redeclare globals
		s.text = `(()=>{ ${old.textContent}\n})();`;
		old.replaceWith(s);
	});
};

utilsJS.getOrCreateAudioContext = function () {
	mmm(`🎬 utilsJS.getOrCreateAudioContext()`);
	// return audiomanagerJS.context; // Use manager context!
	return audiomanagerJS.getAudioCtx();
};

utilsJS.addListener = function (eventArgs) {
	// c•onsole.log("before add eventArgs:", JSON.stringify(eventArgs));
	const {
		DOMElement,
		eventType,
		fnCall,
		listenerFlags, // Object containing the flag
		flagKey, // Property name of the flag
	} = eventArgs;

	// Validation
	if (!DOMElement || !eventType || !fnCall) {
		console.log("⚠️ Missing required args:", eventArgs);
		return false;
	}

	// Check if listener already exists
	if (listenerFlags && flagKey && listenerFlags[flagKey]) {
		// c•onsole.log(`⚠️ ${eventType} listener already exists on ${DOMElement.id}`);
		return false;
	}

	try {
		// Add the event listener
		DOMElement.addEventListener(eventType, fnCall);

		// Update the flag in the original object
		if (!!listenerFlags && !!flagKey) {
			listenerFlags[flagKey] = true;
		}

		// c•onsole.log(`✅ Added ${eventType} listener to ${DOMElement.id}`);
		return true;
	} catch (error) {
		console.log(`⚠️ Failed to add ${eventType} listener:`, error);
		return false;
	}
};

utilsJS.removeListener = function (eventArgs) {
	// c•onsole.log("before remove eventArgs:", JSON.stringify(eventArgs));
	const {
		DOMElement,
		eventType,
		fnCall,
		listenerFlags, // Object containing the flag
		flagKey, // Property name of the flag
	} = eventArgs;

	// Validation
	if (!DOMElement || !eventType || !fnCall) {
		console.log("⚠️ Missing required args:", eventArgs);
		return false;
	}

	// Check if listener already exists
	if (listenerFlags && flagKey && !listenerFlags[flagKey]) {
		// c•onsole.log(`⚠️ ${eventType} listener already removed from ${DOMElement.id}`);
		return false;
	}

	try {
		// Remove the event listener
		DOMElement.removeEventListener(`eventType`, fnCall);

		// Update the flag in the original object
		if (!!listenerFlags && !!flagKey) {
			listenerFlags[flagKey] = false;
		}

		// c•onsole.log(`✅ Removed ${eventType} listener from ${DOMElement.id}`);
		return true;
	} catch (error) {
		console.log(`⚠️ Failed to remove ${eventType} listener:`, error);
		return false;
	}
};

utilsJS.resumeSharedAudioContext = async function () {
	const ctx = audiomanagerJS.getAudioCtx();
	if (!ctx) return "unavailable";

	if (ctx.state === "suspended") {
		try {
			await ctx.resume();
			// Safari: state may lag one frame
			await new Promise((r) => requestAnimationFrame(r));

			// If still not running, try a short fallback + retry
			if (ctx.state !== "running") {
				await new Promise((r) => setTimeout(r, 120));
				if (ctx.state === "suspended") {
					try {
						await ctx.resume();
					} catch {}
					await new Promise((r) => requestAnimationFrame(r));
				}
			}
		} catch (err) {
			console.log("⚠️ utilsJS.resumeSharedAudioContext failed:", err);
		}
	}

	return ctx.state;
};

/**
 * Returns true if event.clientX and .clientY are both defined and valid.
 */
utilsJS.hasValidCoordinates = function (event) {
	// z•zz();
	// c•onsole.log(`event.passkey: ${event.passkey} || event?.detail?.customPasskey: ${event?.detail?.customPasskey}`);
	if (event.passkey || event?.detail?.customPasskey)
		eRegistryJS.use(event, "utilsJS.hasValidCoordinates");

	const thisX = event?.clientX || event?.detail?.x || -1;
	const thisY = event?.clientY || event?.detail?.y || -1;
	// c•onsole.log(`event.clientX: ${event?.clientX} || ${event?.detail?.x} || ${-1} = ${thisX}`);
	// c•onsole.log(`event.clientY: ${event?.clientY} || ${event?.detail?.y} || ${-1} = ${thisY}`);

	const valid =
		thisX !== undefined &&
		thisX !== -1 &&
		thisY !== undefined &&
		thisY !== -1 &&
		!isNaN(thisX) &&
		!isNaN(thisY);
	return valid;
};

utilsJS.coordsFrom = function (event) {
	if (!event) return [];
	return [event.clientX, event.clientY];
};

utilsJS.eventMayBeTap = function (event) {
	if (!event) return [];
	eRegistryJS.use(event, "utilsJS.eventMayBeTap");
	utilsJS.eventStartTime = performance.now();
	utilsJS.eventEndTime = -1;
	utilsJS.eventStartLocation = [event.clientX, event.clientY];
	utilsJS.eventStartTriggered = true;
};

utilsJS.eventIsTapX = function (event) {
	if (!event) return false;
	event = eRegistryJS.use(event, "utilsJS.eventIsTapX");
	utilsJS.eventEndTime = performance.now();
	// return [thisEvent.clientX, thisEvent.clientY];
	// c•onsole.log("lockJS.onEnd registered event:", thisEvent);

	if (!utilsJS.eventStartTriggered) return;

	const eventDuration = utilsJS.eventEndTime - utilsJS.eventStartTime;
	// const dx = thisEvent.clientX - lockJS.startLocation[0];
	// const dy = thisEvent.clientY - lockJS.startLocation[1];
	// const movement = Math.hypot(dx, dy);

	if (eventDuration > 300) {
		mmm(`⚠️ Not a TAP (eventDuration: ${eventDuration.toFixed(2)})`);
		// lockJS.reset();
		return false;
	}

	mmm(`✅ Is a TAP (eventDuration: ${eventDuration.toFixed(2)})`);
	return true;
};

/////////////////// Waiting Functions /////////////////////////
//                                                           //
//                                                           //

/**
 * Wait for an element to appear in the DOM.
 */
utilsJS.waitForElement = function (selector, timeout = 5000) {
	// z•zz();
	// c•onsole.log(`⏳ waiting for element: ${selector}`);
	return new Promise((resolve) => {
		const element = document.querySelector(selector);
		if (element) return resolve(element);

		const start = Date.now();
		const interval = setInterval(() => {
			const el = document.querySelector(selector);
			if (el) {
				clearInterval(interval);
				resolve(el);
			} else if (Date.now() - start > timeout) {
				clearInterval(interval);
				console.log(
					`⚠️ utilsJS.waitForElement: Timeout for selector ${selector}`
				);
				resolve(null);
			}
		}, 50);
	});
};

/**
 * Wait until a window-scoped function becomes available.
 */
utilsJS.waitForFunction = function (
	fnName,
	callback,
	interval = 100,
	timeout = 5000
) {
	// z•zz();
	// c•onsole.log(`⏳ waiting for function: ${fnName}()`);
	const startTime = Date.now();

	function check() {
		if (typeof window[fnName] === "function") {
			// c•onsole.log(`🟢 Function ${fnName} is available. Executing callback.`);
			callback();
		} else if (Date.now() - startTime < timeout) {
			setTimeout(check, interval);
		} else {
			console.log(`⚠️ Timeout waiting for function: ${fnName}`);
		}
	}

	check();
};

/**
 * Wait until a property on an element equals the expected value.
 */
utilsJS.waitForProperty = function (
	element,
	prop,
	targetValue,
	callback,
	interval = 50,
	timeout = 2000
) {
	// z•zz();
	// c•onsole.log(`⏳ waiting for property: ${element.id}.${prop}`);
	const startTime = Date.now();

	function check() {
		if (!element) return;

		if (element[prop] === targetValue) {
			callback();
		} else if (Date.now() - startTime < timeout) {
			setTimeout(check, interval);
		} else {
			console.log(
				`⚠️ Timeout waiting for property ${prop} to become ${targetValue}`
			);
		}
	}

	check();
};

/**
 * Resolves when predicate(getter()) is true. A getter is a function that returns the Value you want to await
 * A Predicate is a custom test function to verify that the value from getter is ready. Defaults to v != null
 * Pass your predicate function to waitForValue.
 * predicate: custom test function, defaults to v != null
 * interval: poll rate, default 50ms
 * timeout: default 5000ms, returns null
 * signal: optional AbortController.signal to cancel early
 */
utilsJS.waitForValue = async function (
	getter,
	{ predicate = (v) => v != null, interval = 50, timeout = 5000, signal } = {}
) {
	return new Promise((resolve, reject) => {
		const start = performance.now();
		let timer = null;

		const tick = () => {
			if (signal?.aborted) {
				if (timer) clearTimeout(timer);
				return reject(new DOMException("Aborted", "AbortError"));
			}
			let val;
			try {
				val = getter();
			} catch {
				/* e.g., stateJS not defined yet */
			}
			if (predicate(val)) {
				if (timer) clearTimeout(timer);
				return resolve(val);
			}
			if (performance.now() - start >= timeout) {
				if (timer) clearTimeout(timer);
				return resolve(null);
			}
			timer = setTimeout(tick, interval);
		};
		tick();
	});
};

/**
 * Wait until an <img> or background image is decoded and ready.
 */
utilsJS.waitForImage = function (element, timeout = 5000) {
	// z•zz();
	// c•onsole.log(`⏳ waiting for image: ${element.id}`);
	return new Promise((resolve) => {
		let imageUrl = null;

		if (element.tagName === `IMG` && element.src) {
			imageUrl = element.src;
			if (element.complete && element.naturalHeight !== 0) {
				// c•onsole.log(`✅ <img> already loaded: ${imageUrl}`);
				return resolve(element);
			}

			const onLoad = () => {
				clearTimeout(timeoutId);
				element.removeEventListener(`load`, onLoad);
				element.removeEventListener(`error`, onError);
				// c•onsole.log(`✅ <img> finished loading: ${imageUrl}`);
				resolve(element);
			};

			const onError = () => {
				clearTimeout(timeoutId);
				console.log(`⚠️ <img> failed to load: ${imageUrl}`);
				resolve(element);
			};

			const timeoutId = setTimeout(() => {
				console.log(`⚠️ Timeout waiting for <img> to load: ${imageUrl}`);
				resolve(element);
			}, timeout);

			element.addEventListener(`load`, onLoad);
			element.addEventListener(`error`, onError);
			return;
		}

		// Handle background-image
		const style = getComputedStyle(element);
		const match = style.backgroundImage.match(/url\(["']?(.*?)["']?\)/);
		if (match) {
			imageUrl = match[1];
			const preload = new Image();
			preload.onload = () => {
				// c•onsole.log(`✅ Background image loaded: ${imageUrl}`);
				resolve(element);
			};
			preload.onerror = () => {
				console.log(`⚠️ Failed to load background image: ${imageUrl}`);
				resolve(element);
			};
			preload.src = imageUrl;
			return;
		}

		console.log(`⚠️ No image source found on element:`, element);
		resolve(element);
	});
};

/**
 * Generic delay
 */
utilsJS.delay = function (ms) {
	// z•zz();
	return new Promise((res) => setTimeout(res, ms));
};

//                                                           //
//                                                           //
/////////////////// END Wait Functions ////////////////////////
