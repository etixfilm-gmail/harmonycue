/* eslint-env browser */

// hc-static-js-debug.js gets loaded by initJS.injectScriptsParallel
// as part of hc-static-js/hc-static-js-init.js
mmm(`✅ LOADED hc-static-js-debug.js`);
// REMOVE FOR DEPLOY

/////////////////// DEBUGGING /////////////////////////////////
//                                                           //
//                                                           //

const debugJS = (window.debugJS = window.debugJS || {});

// Storage for hop counts per eventId
debugJS._hops = debugJS._hops || new Map();

debugJS.debugConstant = null;

// Private-ish storages on the namespace (initialized once)
debugJS._eventIdMap = debugJS._eventIdMap || new WeakMap();
debugJS._eventIdNext = debugJS._eventIdNext || 1;

debugJS.init = function () {
	//z•zz(); Placeholder function
	mmm("🎬 debugJS.init() starting");
};

debugJS._phaseName = function (evt) {
	// 0: NONE (custom), 1: CAPTURE, 2: TARGET, 3: BUBBLE
	return evt?.eventPhase === 1
		? "CAPTURE"
		: evt?.eventPhase === 2
			? "TARGET"
			: evt?.eventPhase === 3
				? "BUBBLE"
				: "NONE";
};

/**
 * Mark one hop for this event and log a compact trace.
 * Call this at the START of any listener/handler that touches the event.
 */
debugJS.markHop = function markHop(evt, where) {
	const id = debugJS.eventId(evt); // from Step 1
	const n = (debugJS._hops.get(id) || 0) + 1;
	debugJS._hops.set(id, n);

	const phase = debugJS._phaseName(evt);
	const tgt = evt?.target?.id || evt?.target?.tagName || "(no target)";
	console.log(
		`↪︎ evt#${id} hop ${n} @ ${where} [${phase}] target=${tgt} isTrusted:${!!evt.isTrusted}`
	);

	if (n > 1) console.trace(`trace for evt#${id} hop ${n} @ ${where}`);
};

/**
 * Return a stable ID for this exact event object without mutating it.
 * - Uses WeakMap so entries auto-GC when the event becomes unreachable.
 * - Safe for all Event types (PointerEvent, MouseEvent, CustomEvent, etc.)
 */
debugJS.eventId = function eventId(evt) {
	if (!evt) return 0;
	const map = debugJS._eventIdMap;
	if (map.has(evt)) return map.get(evt);
	const id = debugJS._eventIdNext++;
	map.set(evt, id);
	return id;
};

debugJS.showEvent = function (event) {
	return `📊 [Event:${window.EventRegistry.findIndex(event)}] ${event.type}|${event.pointerType}`;
};

debugJS.inspectEvent = function (event, label = "Event") {
	console.group(`🔍 ${label} Inspection`);

	// Basic properties
	console.log("Type:", event.type);
	console.log("Pointer Type:", event.pointerType);
	console.log("Time Stamp:", event.timeStamp);
	console.log("Pointer ID:", event.pointerId);
	console.log("Coordinates:", `(${event.clientX}, ${event.clientY})`);
	console.log("Target:", event.target?.tagName, event.target?.id);

	// Custom properties (if any)
	if (event.customId) console.log("Custom ID:", event.customId);
	if (event.handlerCount) console.log("Handler Count:", event.handlerCount);

	// Object reference info
	console.log("Object Type:", Object.prototype.toString.call(event));
	console.log("Constructor:", event.constructor.name);

	// Show all enumerable properties
	console.log(
		"All Properties:",
		Object.getOwnPropertyNames(event).slice(0, 20)
	); // First 20

	console.groupEnd();
};

debugJS.listNamespaces = function ({ suffix = "JS", withInit = false } = {}) {
	const out = [];
	const names = Object.getOwnPropertyNames(window);
	for (const k of names) {
		if (!k.endsWith(suffix)) continue;
		const v = window[k];
		if (!v || typeof v !== "object") continue;
		if (withInit && typeof v.init !== "function") continue;
		out.push(k);
	}
	return out.sort();
};

// debugJS.listObjects = function ({ withInit = false } = {}) {
debugJS.listObjects = function () {
	const out = [];
	const names = Object.getOwnPropertyNames(window);
	names.forEach((k, index) => {
		const listItem = { index: index, name: k };
		const v = window[k];
		if (!v || typeof v !== "object") {
			// do nothing
		} else {
			out.push({ listItem });
		}
	});
	// for (const k of names) {
	// 	const v = window[k];
	// 	if (!v || typeof v !== "object") continue;
	// 	if (withInit && typeof v.init !== "function") continue;
	// 	out.push(k);
	// }
	return out.sort();
};

debugJS.getNamespaceName = function (obj, opts) {
	if (!obj) return "(unknown)";
	const found = debugJS
		.listNamespaces(opts || {})
		.find((k) => window[k] === obj);
	return found || "(unknown)";
};

// Log current state of all contexts
debugJS.logAllStates = function () {
	// c•onsole.log(`\n📊 All AudioContext States:`);
	this.contexts.forEach((context, name) => {
		console.log(`  ${name}: ${context.state}`);
	});
};

/* ===== HC DEBUG AUGMENTATION (safe, append-only) ===== */
(function () {
	const debugJS = (window.debugJS = window.debugJS || {});

	// 0=silent, 1=normal (mmm), 2=verbose (mmmzzz)
	if (typeof debugJS.level !== "number") debugJS.level = 1;

	// Controls (defined only if missing)
	debugJS.enable ??= function (mode = "normal") {
		debugJS.level = mode === "verbose" ? 2 : 1;
		console.log(`🟢 debugJS enabled (level ${debugJS.level})`);
	};
	debugJS.disable ??= function () {
		debugJS.level = 0;
		console.log("⚫ debugJS disabled");
	};
	debugJS.setLevel ??= function (n) {
		debugJS.level = Math.max(0, Math.min(2, Number(n) || 0));
		console.log(`🔧 debugJS level set to ${debugJS.level}`);
	};

	// Timing wrapper (sync/async)
	debugJS.time ??= async function (label, fn) {
		const t0 = performance.now();
		try {
			const rv = fn?.();
			const val = rv instanceof Promise ? await rv : rv;
			const t1 = performance.now();
			if (debugJS.level >= 1)
				console.log(`⏱️ ${label}: ${(t1 - t0).toFixed(2)}ms`);
			return val;
		} catch (err) {
			const t1 = performance.now();
			console.error(`💥 ${label} failed after ${(t1 - t0).toFixed(2)}ms:`, err);
			throw err;
		}
	};

	// Event registry helpers (safe if registry exists)
	debugJS.dumpEvents ??= function () {
		const reg = window.eRegistryJS || window.eventRegistryJS;
		if (reg?.logAll) reg.logAll();
		else console.warn("event registry not available");
	};
	debugJS.stats ??= function () {
		const reg = window.eRegistryJS || window.eventRegistryJS;
		const events = reg?.getStats ? reg.getStats() : null;
		return { events, platform: window.PLATFORM || null };
	};

	// Global log shims (don’t override if user already defined them)
	if (typeof window.mmm !== "function") {
		window.mmm = function (...args) {
			if (debugJS.level >= 1) console.log(...args);
		};
	}
	if (typeof window.zzz !== "function") {
		window.zzz = function (...args) {
			if (debugJS.level >= 2) console.debug(...args);
		};
	}
})();
/* ===== END HC DEBUG AUGMENTATION ===== */

/* ===== HC DEBUG: BIND EXISTING LOGGERS TO LEVEL ===== */
(function () {
	const dbg = (window.debugJS = window.debugJS || {});
	dbg._orig = dbg._orig || {};

	// capture originals once
	if (!dbg._orig.mmm && typeof window.mmm === "function")
		dbg._orig.mmm = window.mmm;
	if (!dbg._orig.zzz && typeof window.zzz === "function")
		dbg._orig.zzz = window.zzz;

	function makeWrapper(name, minLevel) {
		return function (...args) {
			const level = Number(dbg.level) || 0;
			if (level >= minLevel) {
				const orig = dbg._orig[name];
				if (typeof orig === "function") return orig.apply(this, args);
				// fallback if no original existed
				return (minLevel === 1 ? console.log : console.debug).apply(
					console,
					args
				);
			}
			// suppressed
		};
	}

	dbg.rebindLogs = function () {
		window.mmm = makeWrapper("mmm", 1);
		window.zzz = makeWrapper("zzz", 2);
	};

	// bind now (once)
	if (!dbg._bound) {
		dbg.rebindLogs();
		dbg._bound = true;
	}

	// rebind whenever level toggles
	const _setLevel = dbg.setLevel;
	dbg.setLevel = function (n) {
		const rv = _setLevel
			? _setLevel(n)
			: (dbg.level = Math.max(0, Math.min(2, Number(n) || 0)));
		dbg.rebindLogs();
		return rv;
	};

	const _enable = dbg.enable;
	dbg.enable = function (mode = "normal") {
		const rv = _enable
			? _enable(mode)
			: (dbg.level = mode === "verbose" ? 2 : 1);
		dbg.rebindLogs();
		return rv;
	};

	const _disable = dbg.disable;
	dbg.disable = function () {
		const rv = _disable ? _disable() : (dbg.level = 0);
		dbg.rebindLogs();
		return rv;
	};
})();
/* ===== END HC DEBUG: BIND EXISTING LOGGERS TO LEVEL ===== */

//                                                           //
//                                                           //
//////////////// END DEBUGGING ////////////////////////////////
