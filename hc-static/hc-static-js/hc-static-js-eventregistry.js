// hc-static-js-eventregistry.js gets loaded by hc-views/layout/main-loader.ejs
// as a <script> element within the <body>
mmm(`✅ LOADED hc-static-js-eventregistry.js`);

const eRegistryJS = (window.eRegistryJS = window.eRegistryJS || {});

// Back-compat global alias
// Prefer `eRegistryJS`, but allow callers that use `eventRegistryJS` to work.
// This does not overwrite an existing different object if one was already set.
window.eventRegistryJS = window.eventRegistryJS || window.eRegistryJS;

eRegistryJS.init = async function () {
	// m•mm("🎬 Starting eRegistryJS.init()");
	mmm("✅ eRegistryJS initialized");
};

eRegistryJS.events = [];
eRegistryJS.nextIndex = 0;

// 📝 Register a new event (called once per event)
eRegistryJS.register = function (event) {
	// Check if this event is already registered
	// c•onsole.log("register event:", event);

	if (!event.timeStamp) {
		console.log(`⚠️ no event.timeStamp`);
	}

	if (event.passkey) {
		console.log(`⚠️ EVENT ALREADY REGISTERED`);
		return event;
	}

	let newPasskey;
	if (event.detail?.customPasskey) {
		console.log(`⚠️ CUSTOM EVENT RECEIVED `);
		newPasskey = event.detail.customPasskey;
	} else {
		newPasskey = eRegistryJS._passkeyFor(event);
	}

	const existingEntry = eRegistryJS.findByPasskey(newPasskey);
	if (existingEntry) {
		console.log(`⚠️ IGNORING DUPLICATE PASSKEY`);
		return existingEntry;
	}

	const pointerType = event.pointerType || event.detail?.pointerType || "none";
	const pointerId = event.pointerId || event.detail?.pointerId || "none";
	// c•onsole.log(`event?.clientX:${event?.clientX} || event.detail?.x:${event.detail?.x} = ${event?.clientX || event.detail?.x}`);
	const hasValidCoordinates = utilsJS.hasValidCoordinates(event);

	// Create new entry
	const entry = {
		index: eRegistryJS.nextIndex++,
		eventReference: event,
		target: event.target,
		passkey: newPasskey,
		useCount: 0,
		type: event.type,
		pointerType: pointerType,
		pointerId: pointerId,
		timeStamp: event.timeStamp,
		hasValidCoordinates: hasValidCoordinates,
		clientX: event.clientX,
		clientY: event.clientY,
		handlers: [],
		registeredAt: Math.round(performance.now()),
	};

	// c•onsole.log("New Entry: ", entry);

	eRegistryJS.events.push(entry);
	mmm(
		`📋 Registered [Event:${entry.index}] ${entry.type}|${entry.pointerType} passkey:${entry.passkey}`
	);
	return entry;
};

// 📈 Increment use count (called by each handler)
eRegistryJS.use = function (incomingEvent, handlerName = "unknown") {
	// c•onsole.log(`✅✅✅ incomingEvent.passkey: ${incomingEvent.passkey || "none"}`);
	let useEvent = incomingEvent;
	if (!incomingEvent.passkey) useEvent = eRegistryJS.register(incomingEvent);

	if (!useEvent.passkey) {
		console.log(`⚠️ Event registry failed: No passkey.`);
		return;
	}

	/*
	if (useEvent.type.includes("move") && explainerJS.state.isMoving) {
		if (explainerJS?.state?.isMoving) {
			explainerJS.state.isMoving = false;
			mmm(`✅ set explainerJS.state.isMoving to false.`);
		}
		return useEvent;
	}
	*/

	let entry = eRegistryJS.findByPasskey(useEvent.passkey);

	// c•onsole.log("entry:", entry);
	if (entry.index >= 0) {
		entry.useCount++;
		entry.handlers.push({
			name: handlerName,
			timestamp: Date.now(),
		});
		mmm(
			`📊 [Event:${entry.index}] ${entry.type}|${entry.pointerType}: used by ${handlerName} (total uses: ${entry.useCount})`
		);
		return entry;
	} else {
		console.warn("⚠️ Tried to use unregistered event:", useEvent);
		return null;
	}
};

// 🔍 Search functions
eRegistryJS.findByReference = function (eventRef) {
	// z•zz();
	if (eventRef.passkey) {
		mmm(`⚠️ skipping duplicate`);
		return eventRef;
	}
	return { index: null, type: "none", pointerType: "none" };
};

// 🔑 Make a stable passkey for an event (type + pointer + target + coarse timestamp)
eRegistryJS._passkeyFor = function (event) {
	// c•onsole.log("eRegistryJS._passkeyFor: ", event);
	if (!event) return "";
	if (event?.detail?.customPasskey) {
		return event.detail.customPasskey;
	}
	if (!event.passkey) {
		const type = event.type || "unknown";
		const pid = event.pointerId ?? "";
		const tgt = event.currentTarget?.id || event.target?.id || "";
		const ts =
			typeof event.timeStamp === "number" ? Math.round(event.timeStamp) : 0;
		// c•onsole.log(`>>>>>>>>> new passkey ${type}|${pid}|${tgt}|${ts}`);
		return `${type}|${pid}|${tgt}|${ts}`;
	}
};

eRegistryJS.findIndex = function (eventRef) {
	const existing = eRegistryJS.findByReference(eventRef);
	// if (existing) {
	return existing.index; // Return existing index
	// }
};

eRegistryJS.findByIndex = function (index) {
	if (index === -1) {
		console.warn(`⚠️ index out of range:${index}`);
	}
	return eRegistryJS.events.find((e) => e.index === index);
};

eRegistryJS.findByPasskey = function (passkey) {
	return eRegistryJS.events.find((e) => e.passkey === passkey);
};

eRegistryJS.findByType = function (eventType) {
	return eRegistryJS.events.filter((entry) => entry.type === eventType);
};

eRegistryJS.findByPointerType = function (pointerType) {
	return eRegistryJS.events.filter(
		(entry) => entry.pointerType === pointerType
	);
};

eRegistryJS.findOverused = function (threshold = 3) {
	return eRegistryJS.events.filter((entry) => entry.useCount > threshold);
};

eRegistryJS.findUnused = function () {
	return eRegistryJS.events.filter((entry) => entry.useCount === 0);
};

// 📊 Analysis functions
eRegistryJS.getStats = function () {
	return {
		totalEvents: eRegistryJS.events.length,
		totalUses: eRegistryJS.events.reduce(
			(sum, entry) => sum + entry.useCount,
			0
		),
		averageUses:
			eRegistryJS.events.length > 0
				? (
						eRegistryJS.events.reduce((sum, entry) => sum + entry.useCount, 0) /
						eRegistryJS.events.length
					).toFixed(2)
				: 0,
		typeBreakdown: eRegistryJS.getTypeBreakdown(),
		overusedEvents: eRegistryJS.findOverused().length,
		unusedEvents: eRegistryJS.findUnused().length,
	};
};

eRegistryJS.getTypeBreakdown = function () {
	const breakdown = {};
	eRegistryJS.events.forEach((entry) => {
		const passkey = `${entry.type}/${entry.pointerType || "none"}`;
		breakdown[passkey] = (breakdown[passkey] || 0) + 1;
	});
	return breakdown;
};

// 🧹 Utility functions
eRegistryJS.clear = function () {
	eRegistryJS.events = [];
	eRegistryJS.nextIndex = 0;
	// c•onsole.log("🧹 Event registry cleared");
};

// 📋 Display event registry
eRegistryJS.logAll = function () {
	console.table(
		eRegistryJS.events.map((entry) => ({
			index: entry.index,
			passkey: entry.passkey,
			type: entry.type,
			pointerType: entry.pointerType,
			useCount: entry.useCount,
			handlerCount: entry.handlers.length,
		}))
	);
};

eRegistryJS.logEvent = function (index) {
	// z•zz();
	const entry = eRegistryJS.findByIndex(index);
	if (entry) {
		mmm(`📋 [Event:${index} Details:`, {
			type: entry.type,
			pointerType: entry.pointerType,
			useCount: entry.useCount,
			source: entry.source,
			handlers: entry.handlers,
			reference: entry.eventReference,
		});
	} else {
		// c•onsole.log(`⚠️ [Event:${index} not found`);
	}
};
