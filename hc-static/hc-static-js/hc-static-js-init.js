/* eslint-env browser */

// hc-static-js-init.js gets loaded by hc-views/layout/main-loader.ejs
// as a <script> element within the <body>
mmm(`✅ LOADED hc-static-js-init.js`);

// get details for the user's device
window.PLATFORM = window.PLATFORM || {
	isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
		navigator.userAgent
	),
	isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
	isAndroid: /Android/.test(navigator.userAgent),
	isSafari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
	supportsTouch: "ontouchstart" in window || navigator.maxTouchPoints > 0,
	// Width as backup indicator
	isNarrow: window.innerWidth <= 768,
};
Object.freeze(window.PLATFORM);
// c•onsole.log(`window.PLATFORM: ${JSON.stringify(window.PLATFORM)}`);
// Mobile detection (already set via PLATFORM)
if (window.PLATFORM.isMobile) {
	window.initialMobileWidth = document.documentElement.clientWidth;
	console.log(
		`Mobile detected, stored initial width:${window.initialMobileWidth}`
	);
	window.deviceType = "mobile";
} else {
	console.log(`Desktop detected`);
	window.deviceType = "desktop";
}

const initJS = (window.initJS = window.initJS || {});

initJS.initStarted = false;
initJS.initFinished = false;

initJS.firstInit = async function () {
	// eRegistryJS.use(event, "initJS.firstInit");
	console.log(`✅ FIRST INIT CALLED`);
	mmm("🎬 Starting initJS.firstInit()");

	const fnName = "overseeLoadingAndInit";
	const timeout = 5000;
	const interval = 50;
	const startTime = Date.now();

	// Wait for the function to become available
	while (typeof initJS[fnName] !== "function") {
		if (Date.now() - startTime > timeout) {
			console.error(`❌ Timeout: ${fnName} not available after ${timeout}ms`);
			throw new Error(`Function ${fnName} not available`);
		}
		await new Promise((resolve) => setTimeout(resolve, interval));
	}

	mmm("✅ initJS.firstInit done");
	// eReXgistryJS.use(event, "initJS.firstInit");
	initJS.overseeLoadingAndInit();
};

initJS.overseeLoadingAndInit = async function () {
	// z•zz();
	console.log("🎬 Starting initJS.overseeLoadingAndInit()");
	initJS.initStarted = true;

	try {
		await initJS.injectStylesheetsOrdered();
		await initJS.injectScriptsParallel();
		await initJS.loadDeferredHtmlAndWait();
		await initJS.waitForFullVisualReadiness();
	} catch (err) {
		console.error("💥 Early-stage load/init failed:", err);
		throw err;
	}

	const initList = [
		{ ns: eRegistryJS }, // global registry first
		{ ns: handlersJS }, // global handlers
		{
			ns: multimixerJS, // needs data
			ready: () =>
				multimixerJS.trackData && Array.isArray(multimixerJS.trackData[1]),
		},
		{ ns: samplerJS }, // sample players
		{ ns: contactJS }, // contact form
		{ ns: explainerJS }, // hover explainer
		{ ns: splashJS }, // splash & intro
		{ ns: lockJS }, // audio unlock
		{ ns: audiomanagerJS }, // audio manager
		{ ns: utilsJS }, // utilities
	];

	const results = await Promise.all(
		initList.map(({ ns, ready }) => utilsJS.safeInit(ns, ready))
	);

	console.log("Init results:", results);

	initJS.updateComponentSizeVars();

	// Force one layout pass
	void document.body.offsetHeight;

	// c•onsole.log("🟢 All inits complete, about to start splash");

	try {
		await splashJS.startSplashAnimation(event);
		// c•onsole.log("🎬 Splash animation finished");
	} catch (err) {
		console.error("❌ splashJS.startSplashAnimation failed:", err);
		// optionally allow it to continue anyway
	}

	mmm("✅ initJS.overseeLoadingAndInit done");
	return; // "✅ initJS.overseeLoadingAndInit done";
};

// Utility function to inject a stylesheet
initJS.injectStylesheetsOrdered = async function () {
	// z•zz();
	// eReXgistryJS.use(event, "initJS.injectStylesheetsOrdered");
	// c•onsole.log("🎬 Starting initJS.injectStylesheetsOrdered()");

	const cssHref = `/hc-static-css/hc-static-css-styles.css`;

	return new Promise((resolve, reject) => {
		const link = document.createElement(`link`);
		link.rel = `stylesheet`;
		link.href = cssHref;

		link.onload = () => {
			// c•onsole.log(`🎨 Loaded stylesheet: ${cssHref}`);
			resolve();
		};

		link.onerror = () => {
			console.warn(`❌ Failed to load stylesheet: ${cssHref}`);
			reject(new Error(`Stylesheet failed: ${cssHref}`));
		};

		document.head.appendChild(link);
		// c•onsole.log("✅ initJS.injectStylesheetsOrdered done");
	});
};

initJS.injectScriptsParallel = async function () {
	// z•zz();
	// eReXgistryJS.use(event, "initJS.injectScriptsParallel");
	// c•onsole.log("🎬 Starting initJS.injectScriptsParallel()");

	const scriptList = [
		`/hc-static-js/hc-static-js-debug.js`,
		`/hc-static-js/hc-static-js-utils.js`,
		`/hc-static-js/hc-static-js-lock.js`,
		`/hc-static-js/hc-static-js-state.js`,
		`/hc-static-js/hc-static-js-handlers.js`,
		`/hc-static-js/hc-static-js-scripts.js`,
		`/hc-static-js/hc-static-js-audiomanager.js`,
		`/hc-static-js/hc-static-js-contact.js`,
		`/hc-static-js/hc-static-js-explainer.js`,
		`/hc-static-js/hc-static-js-multimixer.js`,
		`/hc-static-js/hc-static-js-sampler.js`,
		`/hc-static-js/hc-static-js-splash.js`,
	];

	const promises = scriptList.map((src) => {
		return new Promise((resolve, reject) => {
			const script = document.createElement(`script`);
			script.src = src;
			script.onload = () => {
				// console.log(`✅ LOADED: ${src}`);
				resolve();
			};
			script.onerror = () => {
				console.warn(`❌ FAILED: ${src}`);
				reject(new Error(`Failed to load script: ${src}`));
			};
			document.body.appendChild(script);
		});
	});

	// c•onsole.log("✅ initJS.injectScriptsParallel done");

	return Promise.all(promises); // Resolves when ALL are loaded
};

initJS.loadDeferredHtmlAndWait = async function () {
	// z•zz();
	// eReXgistryJS.use(event, "initJS.loadDeferredHtmlAndWait");
	// c•onsole.log("🎬 Starting initJS.loadDeferredHtmlAndWait()");

	try {
		const res = await fetch(`/full`);

		if (!res.ok) {
			throw new Error(`Server returned ${res.status}`);
		}

		const html = await res.text();
		const container = document.createElement(`div`);
		container.innerHTML = html;
		document.body.appendChild(container);
		utilsJS.runInlineScripts(container);

		// c•onsole.log("✅ initJS.loadDeferredHtmlAndWait done");
		return "✅ initJS.loadDeferredHtmlAndWait done";
	} catch (err) {
		console.error("❌ Error loading full page:", err);
		throw err; // ⬅️ propagate error to caller
	}
};

initJS.waitForFullVisualReadiness = async function () {
	// z•zz();
	// eReXgistryJS.use?.(event, "initJS.waitForFullVisualReadiness");
	// c•onsole.log("🎬 Starting initJS.waitForFullVisualReadiness()");

	const checksPassed = {
		documentReady: false,
		headerReady: false,
		logoReady: false,
		imagesDecoded: false,
		requestIdle: false,
	};

	try {
		// 1. Document Ready
		if (document.readyState === "complete") {
			checksPassed.documentReady = true;
		} else {
			await new Promise((resolve) => {
				document.addEventListener("readystatechange", function onReady() {
					// if (!event.index) event = eRegistryJS.register(event);
					if (document.readyState === "complete") {
						document.removeEventListener("readystatechange", onReady);
						// c•onsole.log("✅ document.readyState reached 'complete'");
						resolve();
					}
				});
			});
			checksPassed.documentReady = true;
		}

		// 2. #header-contents
		if (!splashJS.hasHeaderContents) {
			const el = await utilsJS.waitForElement("#header-contents");
			if (el) {
				// c•onsole.log("✅ #header-contents exists");
				splashJS.hasHeaderContents = true;
			}
		}
		checksPassed.headerReady = splashJS.hasHeaderContents;

		// 3. #splash-text-logo
		if (await utilsJS.waitForElement("#splash-text-logo")) {
			// c•onsole.log("✅ #splash-text-logo exists");
			checksPassed.logoReady = true;
		}

		// 4. All images decoded
		const images = Array.from(document.images);
		if (images.length === 0) {
			// c•onsole.log("✅ No images to decode");
			checksPassed.imagesDecoded = true;
		} else {
			await Promise.all(images.map((img) => img.decode?.().catch(() => {})));
			// c•onsole.log("✅ All images decoded");
			checksPassed.imagesDecoded = true;
		}

		// 5. Browser idle
		await new Promise((resolve) => {
			if ("requestIdleCallback" in window) {
				requestIdleCallback(() => {
					// c•onsole.log("✅ Browser idle");
					resolve();
				});
			} else {
				setTimeout(() => {
					// c•onsole.log("✅ Timeout fallback for idle");
					resolve();
				}, 200);
			}
		});
		checksPassed.requestIdle = true;

		// c•onsole.log("🟢 All readiness checks passed:", checksPassed);

		window.area = document.getElementById("audio-hover-area");

		return true;
	} catch (err) {
		console.error("❌ waitForFullVisualReadiness failed:", err);
		throw err;
	}
};

// set all custom variables in <html> element = documentElement
initJS.updateComponentSizeVars = function () {
	// z•zz();

	let effectiveWidth;
	if (window.PLATFORM.isMobile !== null && window.PLATFORM.isMobile) {
		effectiveWidth =
			window.initialMobileWidth || document.documentElement.clientWidth;
		// m•mm(`Using mobile width - effectiveWidth:${effectiveWidth}`);
	} else {
		effectiveWidth = window.innerWidth;
		// m•mm(`Using desktop width: - effectiveWidth: ${effectiveWidth}`);
	}

	const sectionWidth =
		Math.min(effectiveWidth, 1500) *
		(Math.min(Math.max((1500 - Math.min(effectiveWidth, 1500)) / 900, 0), 1) *
			0.9 +
			Math.min(Math.max((Math.min(effectiveWidth, 1500) - 600) / 900, 0), 1) *
				0.75);
	const yPad = sectionWidth / 17.5417; // vertical pad top and bottom of sections
	const pixelSize = sectionWidth * 0.002;
	const headerHeight = effectiveWidth * 0.43;
	// c•onsole.log(`calculated: - headerHeight: ${headerHeight}`);
	const headerPadBottom = window.innerHeight - headerHeight * 0.8;
	// c•onsole.log(`calculated: - headerPadBottom: ${headerPadBottom}`);
	const trackHeight = Math.max(sectionWidth * 0.06, 52);
	const btnSize = Math.max(sectionWidth * 0.055, 48);
	const dialSize = Math.max(sectionWidth * 0.05, 48);
	const sliderHeight = Math.max(sectionWidth * 0.0125, 12);
	const labelWidth = window.calculateLabelWidth() * sectionWidth * 0.013;
	const samplerBorderWidth = sectionWidth * 0.0032;
	const samplerTrackHeight = trackHeight * 1.1;
	const samplerSliderWidth = Math.max(sectionWidth * 0.125, 100);
	const samplerVolumeIconSize = btnSize * 0.65;
	const samplerLine2Width =
		samplerSliderWidth + samplerVolumeIconSize + pixelSize * 10;
	const samplerCanvasWidth = sectionWidth - btnSize - samplerLine2Width;
	const samplerLine1Width = sectionWidth - samplerLine2Width;

	document.documentElement.style.setProperty(
		`--effective-width`,
		`${Number(effectiveWidth.toFixed(4))}px`
	);
	document.documentElement.style.setProperty(
		`--section-width`,
		`${Number(sectionWidth.toFixed(4))}px`
	);
	document.documentElement.style.setProperty(
		`--y-pad`,
		`${Number(yPad.toFixed(4))}px`
	);
	document.documentElement.style.setProperty(
		`--px`,
		`${Number(pixelSize.toFixed(4))}px`
	);

	document.documentElement.style.setProperty(
		`--header-height`,
		`${Number(headerHeight.toFixed(4))}px`
	);
	document.documentElement.style.setProperty(
		`--header-pad-bottom`,
		`${Number(headerPadBottom.toFixed(4))}px`
	);
	const splashTextLogo = document.getElementById(`splash-text-logo`);
	// const headerStyles = window.getComputedStyle(splashTextLogo);

	splashTextLogo.style.marginBottom = headerPadBottom;

	document.documentElement.style.setProperty(
		`--track-height`,
		`${Number(trackHeight.toFixed(4))}px`
	);
	document.documentElement.style.setProperty(
		`--sampler-border-width`,
		`${Number(samplerBorderWidth.toFixed(4))}px`
	);
	document.documentElement.style.setProperty(
		`--sampler-slider-width`,
		`${Number(samplerSliderWidth.toFixed(4))}px`
	);
	document.documentElement.style.setProperty(
		`--sampler-volume-icon-size`,
		`${Number(samplerVolumeIconSize.toFixed(4))}px`
	);
	document.documentElement.style.setProperty(
		`--sampler-canvas-width`,
		`${Number(samplerCanvasWidth.toFixed(4))}px`
	);
	document.documentElement.style.setProperty(
		`--sampler-line-1-width`,
		`${Number(samplerLine1Width.toFixed(4))}px`
	);
	document.documentElement.style.setProperty(
		`--sampler-line-2-width`,
		`${Number(samplerLine2Width.toFixed(4))}px`
	);
	document.documentElement.style.setProperty(
		`--sampler-track-height`,
		`${Number(samplerTrackHeight.toFixed(4))}px`
	);
	document.documentElement.style.setProperty(
		`--btn-size`,
		`${Number(btnSize.toFixed(4))}px`
	);
	document.documentElement.style.setProperty(
		`--dial-size`,
		`${Number(dialSize.toFixed(4))}px`
	);
	document.documentElement.style.setProperty(
		`--slider-height`,
		`${Number(sliderHeight.toFixed(4))}px`
	);
	document.documentElement.style.setProperty(
		`--label-width`,
		`${Number(labelWidth.toFixed(4))}px`
	);
	document.documentElement.style.setProperty(`section-width-set`, true);
	multimixerJS.calculateTimelineOffset; // margin between player border and timeline

	// Update sampler elements after CSS properties are set
	requestAnimationFrame(() => {
		// 	updateSamplerHeights();
	});
	// });
};

window.addEventListener(`resize`, () => {
	// if (!event.index) event = eRegistryJS.register(event);
	// Skip resize recalculation on mobile (prevents zoom issues)
	if (window.PLATFORM.isMobile !== null && window.PLATFORM.isMobile) {
		mmm(`🚫 Mobile resize ignored (likely zoom)`);
		return;
	}
	initJS.updateComponentSizeVars();
	// const headerElement = document.getElementById(`header-contents`);
	// const headerStyles = window.getComputedStyle(headerElement);
	// c•onsole.log(`headerHeight: ${headerStyles.getPropertyValue(`height`)}, headerPadBottom: ${headerStyles.getPropertyValue(`padding-bottom`)}`);
});

// Run firstInit as soon as the DOM is parsed.
// If the DOM is already parsed (common with <script defer>), start immediately.
(function () {
	function startInit(eventType) {
		console.log(
			`✅ startInit(eventType:${eventType}) — starting initJS.firstInit`
		);
		initJS.firstInit();
	}

	if (document.readyState === "loading") {
		document.addEventListener(
			"DOMContentLoaded",
			() => startInit("DOMContentLoaded"),
			{ once: true }
		);
	} else {
		// DOM already parsed; safe to start now
		startInit("defer-ready");
	}
})();

// catch duplicates
// === Probe: log duplicate pointer/touch/mouse listener registrations (DEV) ===
/*
(() => {
	if (window.__listenerDedupeProbeInstalled_v2) return;
	window.__listenerDedupeProbeInstalled_v2 = true;

	const origAdd = EventTarget.prototype.addEventListener;
	// target -> type -> (listener -> (optKey -> count))
	const reg = new WeakMap();

	function getCapture(options) {
		return typeof options === "boolean"
			? options
			: !!(options && options.capture);
	}

	EventTarget.prototype.addEventListener = function (type, listener, options) {
		if (/^(pointer|touch|mouse)/.test(type) && typeof listener === "function") {
			let byTypeMap = reg.get(this);
			if (!byTypeMap) {
				byTypeMap = new Map();
				reg.set(this, byTypeMap);
			}

			let byListenerMap = byTypeMap.get(type);
			if (!byListenerMap) {
				byListenerMap = new WeakMap();
				byTypeMap.set(type, byListenerMap);
			}

			let byOptMap = byListenerMap.get(listener);
			if (!byOptMap) {
				byOptMap = new Map();
				byListenerMap.set(listener, byOptMap);
			}

			const capture = getCapture(options);
			const optKey = capture ? "capture" : "bubble";

			const prev = byOptMap.get(optKey) || 0;
			byOptMap.set(optKey, prev + 1);

			if (prev >= 1) {
				console.warn(
					`⚠️ Duplicate listener x${prev + 1} → ${type} [${listener.name || "anon"} | ${optKey}]`,
					this
				);
				console.trace("↪︎ duplicate added here");
			}
		}
		return origAdd.call(this, type, listener, options);
	}; 
})(); 
*/

/*
		["pointerdown", "pointerup"].forEach((type) => {
			window.area.addEventListener(type, (event) => {
				// if (!e•vent.index) event = eRegistryJS.register(event);
				mmm(`🧪 ${type},
						Event from audio-hover-area = window.area
						time: ${performance.now()},
						pointerType: ${event.pointerType},
						inside: ${explainerJS.isInsideHoverArea(event)},
						isPlaying: ${explainerJS.state.isPlaying},`);
			});
		});
		*/
