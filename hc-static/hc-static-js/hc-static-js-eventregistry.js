// hc-static-js-eventregistry.js gets loaded by hc-views/layout/main-loader.ejs
// as a <script> element within the <body>
console.log(`✅ LOADED hc-static-js-eventregistry.js`);

const eRegistryJS = (window.eRegistryJS = window.eRegistryJS || {});

eRegistryJS.init = async function () {
	mmm("🎬 Starting eRegistryJS.init()");
};

eRegistryJS.events = [];
eRegistryJS.nextIndex = 0;

// 📝 Register a new event (called once per event)
eRegistryJS.register = function (event) {
	// Check if this event is already registered
	console.log("register event:", event);
	if (!event.index) {
		console.log(`NO INDEX, NEW EVENT`);
	} else {
		return event;
	}

	// Create new entry
	const entry = {
		index: eRegistryJS.nextIndex++,
		eventReference: event,
		key: eRegistryJS._keyFor(event), // <-- store key
		useCount: 0,
		type: event.type,
		pointerType: event.pointerType,
		timeStamp: event.timeStamp,
		pointerId: event.pointerId,
		handlers: [],
		registeredAt: Date.now(),
	};

	eRegistryJS.events.push(entry);
	mmm(
		`📋 Registered [Event:${entry.index}] ${entry.type}|${entry.pointerType} key:${entry.key}`
	);
	return entry;
};

// 📈 Increment use count (called by each handler)
eRegistryJS.use = function (event, handlerName = "unknown") {
	console.log(
		`✅✅✅ use(event.type:${event.type}; handlerName:${handlerName})`
	);
	if (!event.index) event = eRegistryJS.register(event);
	if (!event.index) console.log(`Why no new event.index?`);
	console.log("✅✅✅ use event:", event);

	if (event.type.includes("move") && explainerJS.state.isMoving) {
		if (explainerJS?.state?.isMoving) {
			explainerJS.state.isMoving = false;
			mmm(`✅ set explainerJS.state.isMoving to false.`);
		}
		return event;
	}

	console.log(
		`event.type:${event.type} === "hc:audio-unlocked"? ${event.type === "hc:audio-unlocked"}`
	);
	if (event.type === "hc:audio-unlocked") {
		console.log(`event.type:${event.index} event.key:${event.key}`);
	}
	let entry;
	if (event.type === "hc:audio-unlocked") {
		entry = eRegistryJS.findByKey(event.detail.customKey);
	} else {
		entry = eRegistryJS.findByKey(event.key);
	}

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
		// return entry.index;
	} else {
		console.warn("⚠️ Tried to use unregistered event:", event);
		return null;
	}
	// }
};

// 🔍 Search functions
eRegistryJS.findByReference = function (eventRef) {
	// z•zz();
	// c•onsole.log("findByReference eventRef:", eventRef);
	console.log("findByReference called with:", typeof eventRef, eventRef);

	if (eventRef.key) {
		mmm(`❌ skipping duplicate`);
		return eventRef;
	}
	return { index: -1, type: "none", pointerType: "none" };
};

// 🔑 Make a stable key for an event (type + pointer + target + coarse timestamp)
eRegistryJS._keyFor = function (event) {
	if (!event) return "";
	if (!event.detail) {
		const type = event.type || "unknown";
		const pid = event.pointerId ?? "";
		const tgt = event.currentTarget?.id || event.target?.id || "";
		const ts =
			typeof event.timeStamp === "number" ? Math.round(event.timeStamp) : 0;
		console.log(`>>>>>>>>> new key ${type}|${pid}|${tgt}|${ts}`);
		return `${type}|${pid}|${tgt}|${ts}`;
	} else {
		return event.detail.customKey;
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

eRegistryJS.findByKey = function (key) {
	// c•onsole.log(`findByKey(key:${key})`);
	return eRegistryJS.events.find((e) => e.key === key);
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
		const key = `${entry.type}/${entry.pointerType || "none"}`;
		breakdown[key] = (breakdown[key] || 0) + 1;
	});
	return breakdown;
};

// 🧹 Utility functions
eRegistryJS.clear = function () {
	eRegistryJS.events = [];
	eRegistryJS.nextIndex = 0;
	// c•onsole.log("🧹 Event registry cleared");
};

// 📋 Display functions
eRegistryJS.logAll = function () {
	console.table(
		eRegistryJS.events.map((entry) => ({
			index: entry.index,
			key: entry.key,
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
		// c•onsole.log(`❌ [Event:${index} not found`);
	}
};
