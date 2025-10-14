/* eslint-env browser */

// hc-static-js-debug.js gets loaded by initJS.injectScriptsParallel
// as part of hc-static-js/hc-static-js-init.js
// m•mm(`✅ LOADED hc-static-js-debug.js`);
// REMOVE FOR DEPLOY

/////////////////// DEBUGGING /////////////////////////////////
//                                                           //
//                                                           //

const debugJS = (window.debugJS = window.debugJS || {});

debugJS.debugConstant = null;

debugJS.init = function () {
	//z•zz(); Placeholder function
	mmm("🎬 debugJS.init() starting");
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

//                                                           //
//                                                           //
//////////////// END DEBUGGING ////////////////////////////////
