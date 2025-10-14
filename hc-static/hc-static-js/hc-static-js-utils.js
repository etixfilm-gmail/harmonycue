/* eslint-env browser */

// hc-static-js-utils.js gets loaded by initJS.injectScriptsParallel
// as a <script> element within the <body>
mmm(`✅ LOADED hc-static-js-utils.js`);

// hc-static-js-utils.js
// Shared utility functions for DOM, timing, and validation

const utilsJS = (window.utilsJS = window.utilsJS || {});

utilsJS.init = async function () {
	// z•zz(); placeholder function
	mmm("🎬 Starting utilsJS.init()");
};

/**
 * Returns true if event.clientX and .clientY are both defined and valid.
 */
utilsJS.hasValidCoordinates = function (event) {
	// z•zz();
	eRegistryJS.use(event, "utilsJS.hasValidCoordinates");
	const valid =
		event?.clientX !== undefined &&
		event?.clientY !== undefined &&
		!isNaN(event.clientX) &&
		!isNaN(event.clientY);
	// mmm(`utilsJS.hasValidCoordinates → ${valid} (clientX: ${event.clientX}, clientY: ${event.clientY})`);
	return valid;
};

/////////////////// Waiting Functions /////////////////////////
//                                                           //
//                                                           //

/**
 * Wait for an element to appear in the DOM.
 */
utilsJS.waitForElement = function (selector, timeout = 5000) {
	// z•zz();
	console.log(`⏳ waiting for element: ${selector}`);
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
				console.warn(
					`utilsJS.waitForElement: Timeout for selector ${selector}`
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
	console.log(`⏳ waiting for function: ${fnName}()`);
	const startTime = Date.now();

	function check() {
		if (typeof window[fnName] === "function") {
			console.log(`🟢 Function ${fnName} is available. Executing callback.`);
			callback();
		} else if (Date.now() - startTime < timeout) {
			setTimeout(check, interval);
		} else {
			console.warn(`❌ Timeout waiting for function: ${fnName}`);
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
	console.log(`⏳ waiting for property: ${element.id}.${prop}`);
	const startTime = Date.now();

	function check() {
		if (!element) return;

		if (element[prop] === targetValue) {
			callback();
		} else if (Date.now() - startTime < timeout) {
			setTimeout(check, interval);
		} else {
			console.warn(
				`Timeout waiting for property ${prop} to become ${targetValue}`
			);
		}
	}

	check();
};

/**
 * Wait until an <img> or background image is decoded and ready.
 */
utilsJS.waitForImage = function (element, timeout = 5000) {
	// z•zz();
	console.log(`⏳ waiting for image: ${element.id}`);
	return new Promise((resolve) => {
		let imageUrl = null;

		if (element.tagName === `IMG` && element.src) {
			imageUrl = element.src;
			if (element.complete && element.naturalHeight !== 0) {
				console.log(`✅ <img> already loaded: ${imageUrl}`);
				return resolve(element);
			}

			const onLoad = () => {
				clearTimeout(timeoutId);
				element.removeEventListener(`load`, onLoad);
				element.removeEventListener(`error`, onError);
				console.log(`✅ <img> finished loading: ${imageUrl}`);
				resolve(element);
			};

			const onError = () => {
				clearTimeout(timeoutId);
				console.warn(`❌ <img> failed to load: ${imageUrl}`);
				resolve(element);
			};

			const timeoutId = setTimeout(() => {
				console.warn(`⏳ Timeout waiting for <img> to load: ${imageUrl}`);
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
				console.log(`✅ Background image loaded: ${imageUrl}`);
				resolve(element);
			};
			preload.onerror = () => {
				console.warn(`❌ Failed to load background image: ${imageUrl}`);
				resolve(element);
			};
			preload.src = imageUrl;
			return;
		}

		console.warn(`⚠️ No image source found on element:`, element);
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
