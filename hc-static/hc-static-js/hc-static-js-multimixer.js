// hc-static-js-multimixer.js gets loaded by initJS.injectScriptsParallel
// as a <script> element within the <body>// as part of hc-static-js/hc-static-js-init.js
mmm(`✅ LOADED hc-static-js-multimixer.js`);

const multimixerJS = (window.multimixerJS = window.multimixerJS || {});

// --- App State ---
multimixerJS.mxrLastPreset = `none`; // ✅ Default mode
multimixerJS.mxrAudioCtx = null;
multimixerJS.mxrIsPlaying = false;
multimixerJS.mxrStartTime = 0;
multimixerJS.mxrPauseTime = 0;

multimixerJS.mxrMaxPanRadians = 0.75 * Math.PI;
multimixerJS.mxrActiveDial = null;
multimixerJS.mxrActiveElement = null;
multimixerJS.mxrActiveTargetType = null;
multimixerJS.mxrActiveTrackIndex = -1;
multimixerJS.mxrActiveVolumeSlider = null;
multimixerJS.mxrPointerHandlersAttached = false;

// Default presets for mxrTrack types
multimixerJS.defaultPresets = {
	voice: {
		init: { angle: 0, pan: 0, gain: 0.5, mute: false },
		stereo: { angle: 2.3562, pan: 1, gain: 0.5, mute: false }, // Will be overridden for selected voice
		partpre: { angle: 0, pan: 0, gain: 0.25, mute: false }, // Will be overridden for selected voice
	},
	instr: {
		init: { angle: 0, pan: 0, gain: 0.5, mute: false },
		stereo: { angle: 0, pan: 0, gain: 0.6, mute: false },
		partpre: { angle: 0, pan: 0, gain: 0.4, mute: false },
	},
	tech: {
		init: { angle: 0, pan: 0, gain: 0.5, mute: false },
		stereo: { angle: 0, pan: 0, gain: 0.3, mute: true },
		partpre: { angle: 0, pan: 0, gain: 0.3, mute: true },
	},
	unknown: {
		init: { angle: 0, pan: 0, gain: 0.5, mute: false },
		stereo: { angle: 0, pan: 0, gain: 0.5, mute: false },
		partpre: { angle: 0, pan: 0, gain: 0.5, mute: false },
	},
};

multimixerJS.setupTrackListFromJSON = function () {
	// Extract song name from the JSON and store it

	multimixerJS.songName = JSON.stringify(multimixerJS.trackData[0]);

	// return multimixerJS.trackData[1].map((t, index) => {
	return multimixerJS.trackData[1].map((t, index) => {
		// Create the mxrTrack object with all needed properties
		return {
			index: index,
			element: document.getElementById(`mxr-track-${index}`),
			label: t.descr?.name || t.src.replace(/\.[^/.]+$/, ``),
			src: t.src,
			trackType: t.descr?.type || `unknown`,
			btnLetter: t.descr?.btnletter || t.descr?.name?.charAt(0) || `?`,
			presets: t.descr?.presets || `default`,
			buffer: null,
			gainValue: 0.5,
			panValue: 0.0,
			dialAngle: 0.0,
			isMuted: false,
		};
	});
};

// -- Timeline Slider State --
multimixerJS.mxrTimelineSlider = {
	element: null,
	isDragging: false,
	updateRequest: null,
	position: null,
	offsetLeft: null,
};

// -- Initialize all parts of multimixer
multimixerJS.init = async function () {
	//z•zz();
	mmm("🎬 Starting multimixerJS.init()");

	// Process raw data if it exists
	if (multimixerJS.rawTrackData && multimixerJS.songName) {
		multimixerJS.mxrTrackList = multimixerJS.setupTrackListFromJSON(
			multimixerJS.songName,
			multimixerJS.rawTrackData
		);
	}

	// Check if we have tracks to work with
	if (!multimixerJS.mxrTrackArray || multimixerJS.mxrTrackArray.length === 0) {
		console.error(
			`No tracks available in mxrTrackArray. Cannot initialize multimixer.`
		);
		return; // Exit early
	}

	// multimixerJS.initMxrTracks();
	await multimixerJS.initMxrBuffers();
	// multimixerJS.initMxrTracks();
	multimixerJS.setupVoiceRadios(); // Set up radios based on actual tracks
	multimixerJS.initPlaybackBtns();
	multimixerJS.initTimelineSeekAndDrag();
	multimixerJS.initMuteButtons();
	multimixerJS.initPanDials();
	multimixerJS.initVolumeSliders();
	multimixerJS.initPresetButtons();
};

/////////////// INIT FUNCTIONS /////////////////

multimixerJS.initVolumeSliders = function () {
	// Get all volume sliders
	const volumeSliders = document.querySelectorAll(`.mxr-volume-slider`);

	volumeSliders.forEach((slider, index) => {
		// Set initial value based on mxrTrack gainValue
		const mxrTrack = multimixerJS.mxrTrackArray[index];
		if (mxrTrack) {
			multimixerJS.setVolumeSlider(index, mxrTrack.gainValue);
		}

		// Add input event listener for real-time updates
		slider.addEventListener(`input`, (event) => {
			window.EventRegistry.register(event);
			const slider = event.target;

			const volume = parseFloat(slider.value);
			const trackIndex = multimixerJS.getTrackIndex(slider);

			multimixerJS.setVolumeSlider(trackIndex, volume);
		});
	});
};

multimixerJS.initPanDials = function () {
	// Get all dial containers
	const dialContainers = document.querySelectorAll(`.mxr-dial`);

	// Initialize each dial
	for (
		i = 0, len = document.querySelectorAll(`.mxr-dial`).length;
		i < len;
		i++
	) {
		multimixerJS.setPanDial(i, 0);
	}
};

multimixerJS.initActivePanDialX = function (mxrDial) {
	const trackIndex = multimixerJS.getTrackIndex(mxrDial);
	// Set initial dial position based on mxrTrack's panValue
	const mxrTrack = multimixerJS.mxrTrackArray[trackIndex];
	const indicator = document.getElementById(`.mxr-indicator-` + trackIndex);

	if (indicator && mxrTrack) {
		// Set initial rotation based on mxrTrack panValue
		// mxrTrack.dialAngle = mxrTrack.panValue * multimixerJS.mxrMaxPanRadians;
		mxrTrack.panValue = multimixerJS.calculatePanValue(mxrTrack.dialAngle);

		/* indicator.style.transform = `translate(-50%, -150%) rotate(${angle}rad)`;
		mxrDial.dataset.panValue = mxrTrack.panValue;
		
		multimixerJS.setPanOnIndex(trackIndex, mxrDial.dataset.panValue); */
	}
};

multimixerJS.initMxrBuffers = async function () {
	if (!multimixerJS.mxrAudioCtx) {
		multimixerJS.mxrAudioCtx = new (window.AudioContext ||
			window.webkitAudioContext)();
	}

	// Check if mxrTrackArray exists and has items
	if (
		!multimixerJS.mxrTrackArray ||
		!Array.isArray(multimixerJS.mxrTrackArray) ||
		multimixerJS.mxrTrackArray.length === 0
	) {
		console.error(
			`mxrTrackArray is not properly initialized:`,
			multimixerJS.mxrTrackArray
		);
		return; // Exit early to prevent errors
	}

	const mxrBufferPromises = multimixerJS.mxrTrackArray.map((mxrTrack) =>
		multimixerJS.mxrLoadTrack(`/hc-static-media/${mxrTrack.src}`)
	);

	const mxrBuffers = await Promise.all(mxrBufferPromises);

	mxrBuffers.forEach((buffer, index) => {
		multimixerJS.mxrTrackArray[index].buffer = buffer;
		// multimixerJS.mxrTrackArray[index].dataset.trackIndex = index;
	});
};

multimixerJS.initMuteButtons = function () {
	// Get all mute buttons
	const muteButtons = document.querySelectorAll("[id^=`mxr-mute-btn-`]");

	muteButtons.forEach((button, index) => {
		button.addEventListener(`click`, (event) => {
			window.EventRegistry.register(event);
			const mxrTrack = multimixerJS.mxrTrackArray[index];
			const mxrTrackElement = button.closest(`.mxr-track`);

			// Toggle mute state
			mxrTrack.isMuted = !mxrTrack.isMuted;

			// Update UI
			if (mxrTrack.isMuted) {
				button.classList.add(`mute`);
				mxrTrackElement.classList.add(`muted`);

				// Store current gain value before muting
				if (mxrTrack.gainNode) {
					mxrTrack.prevGainValue = mxrTrack.gainNode.gain.value;
					mxrTrack.gainNode.gain.value = 0;
				}
			} else {
				button.classList.remove(`mute`);
				mxrTrackElement.classList.remove(`muted`);

				// Restore audio gain from the mxrTrack's current gainValue
				if (mxrTrack.gainNode) {
					mxrTrack.gainNode.gain.value = mxrTrack.gainValue; // Use the current slider value
				}
			}
		});
	});
};

multimixerJS.initPresetButtons = function () {
	// Get preset buttons
	const customBtn = document.getElementById(`mxr-custom-btn`);
	const stereoSplitBtn = document.getElementById(`mxr-split-btn`);
	const partPredomBtn = document.getElementById(`mxr-predominant-btn`);

	// Get voice selection radio buttons
	const voiceRadios = document.querySelectorAll("input[name=`voice`]");

	// Initialize - Manual Mix active, radios disabled
	customBtn.classList.add(`btn-on`);
	multimixerJS.mxrLastPreset = `init`;
	multimixerJS.enableVoiceRadios(false);

	// Manual Mix Button - default state
	customBtn.addEventListener(`click`, (event) => {
		window.EventRegistry.register(event);
		// c•onsole.log(`customBtn(`click`, ()`);
		// Update button states
		updateButtonStates(customBtn);

		// Disable voice selection
		multimixerJS.enableVoiceRadios(false);

		// Do NOT apply any preset - just update the mode
		multimixerJS.mxrLastPreset = `init`;
	});

	// Stereo Split Button
	stereoSplitBtn.addEventListener(`click`, (event) => {
		window.EventRegistry.register(event);
		// c•onsole.log(`stereoSplitBtn(`click`, ()`);
		// Update button states
		updateButtonStates(stereoSplitBtn);

		// Enable voice selection, select default voice
		multimixerJS.enableVoiceRadios(true);
		selectDefaultVoice(voiceRadios);

		// Apply preset with selected voice
		applyPreset(`stereo`, multimixerJS.getSelectedVoice());

		multimixerJS.mxrLastPreset = `stereo`;
	});

	// Part Predominant Button
	partPredomBtn.addEventListener(`click`, (event) => {
		window.EventRegistry.register(event);
		// c•onsole.log(`partPredomBtn(`click`, ()`);
		// Update button states
		updateButtonStates(partPredomBtn);

		// Enable voice selection, select default voice
		multimixerJS.enableVoiceRadios(true);
		selectDefaultVoice(voiceRadios);

		// Apply preset with selected voice
		applyPreset(`partpre`, multimixerJS.getSelectedVoice());

		multimixerJS.mxrLastPreset = `partpre`;
	});

	// Voice radio selection
	voiceRadios.forEach((radio) => {
		radio.addEventListener(`change`, (event) => {
			window.EventRegistry.register(event);
			selectedVoice = event.target.value;

			// Apply current preset with new voice
			if (multimixerJS.mxrLastPreset !== `init`) {
				applyPreset(multimixerJS.mxrLastPreset, selectedVoice);
			}
		});
	});

	// Add listeners to detect manual changes to controls
	// When user manually changes controls, switch to custom mode
	const dialContainers = document.querySelectorAll(`.mxr-dial`);
	const volumeSliders = document.querySelectorAll(`.mxr-volume-slider`);
	const muteButtons = document.querySelectorAll("[id^=`mxr-mute-btn-`]");

	// Only switch to custom mode if we're in a preset mode
	const switchToManualMode = () => {
		if (multimixerJS.mxrLastPreset !== `init`) {
			updateButtonStates(customBtn);
			multimixerJS.enableVoiceRadios(false);
			multimixerJS.mxrLastPreset = `init`;
		}
	};

	// Add event listeners to controls
	dialContainers.forEach((dial) => {
		dial.addEventListener(`pointerdown`, (event) => {
			window.EventRegistry.register(event);
			// Only register after the drag begins
			document.addEventListener(`pointermove`, switchToManualMode, {
				once: true,
			});
		});
	});

	volumeSliders.forEach((slider) => {
		slider.addEventListener(`input`, switchToManualMode);
	});

	muteButtons.forEach((button) => {
		button.addEventListener(`click`, switchToManualMode);
	});

	// Helper function to update button states
	function updateButtonStates(activeButton) {
		[customBtn, stereoSplitBtn, partPredomBtn].forEach((btn) => {
			if (btn === activeButton) {
				btn.classList.add(`btn-on`);
			} else {
				btn.classList.remove(`btn-on`);
			}
		});
	}

	// Helper function to select default voice
	function selectDefaultVoice(radios) {
		// Select first radio by default if none selected
		let hasChecked = false;

		radios.forEach((radio) => {
			if (radio.checked) hasChecked = true;
		});

		if (!hasChecked && radios.length > 0) {
			radios[0].checked = true;
		}
	}

	// Helper function to apply preset with selected voice
	function applyPreset(presetName, selectedVoice) {
		multimixerJS.mxrTrackArray.forEach((mxrTrack, index) => {
			// Get the appropriate preset for this mxrTrack
			let settings;

			// Check if mxrTrack is the selected voice
			const isSelectedVoice = selectedVoice && mxrTrack.label === selectedVoice;

			if (isSelectedVoice) {
				// Special handling for selected voice
				if (presetName === `stereo`) {
					settings = { angle: -2.3562, gain: 0.8, mute: false };
				} else if (presetName === `partpre`) {
					settings = { angle: 0, gain: 1.0, mute: false };
				} else {
					settings = { angle: 0, gain: 0.5, mute: false };
				}
			} else {
				// Use mxrTrack's custom presets if available

				if (
					typeof mxrTrack.presets === `object` &&
					mxrTrack.presets[presetName]
				) {
					settings = mxrTrack.presets[presetName];
				} else if (mxrTrack.presets === `default`) {
					// Use default presets based on mxrTrack type
					const trackType = mxrTrack.trackType || `unknown`;
					settings =
						multimixerJS.defaultPresets[trackType]?.[presetName] ||
						multimixerJS.defaultPresets.unknown[presetName];
				} else {
					// Fallback for any unrecognized preset configuration
					console.warn(
						`No preset ${presetName} found for mxrTrack ${mxrTrack.label}`
					);
					settings = { angle: 0, gain: 0.5, mute: false };
				}
			}

			// Apply settings
			mxrTrack.dialAngle = settings.angle;
			mxrTrack.gainValue = settings.gain;

			// multimixerJS.setPanOnIndex(index, mxrTrack.panValue);

			// Handle mute state separately since we have UI classes to update
			const muteBtn = document.getElementById(`mxr-mute-btn-${index}`);
			const mxrTrackElement = muteBtn?.closest(`.mxr-track`);

			if (settings.mute) {
				mxrTrack.isMuted = true;

				// Store current gain value before muting
				mxrTrack.prevGainValue = mxrTrack.gainValue;

				// Update UI
				if (muteBtn) muteBtn.classList.add(`mute`);
				if (mxrTrackElement) mxrTrackElement.classList.add(`muted`);

				// Set audio gain to 0 if playing
				if (mxrTrack.gainNode) {
					mxrTrack.gainNode.gain.value = 0;
				}
			} else {
				mxrTrack.isMuted = false;

				// Update UI
				if (muteBtn) muteBtn.classList.remove(`mute`);
				if (mxrTrackElement) mxrTrackElement.classList.remove(`muted`);

				// Restore audio gain if playing
				if (mxrTrack.gainNode) {
					mxrTrack.gainNode.gain.value = mxrTrack.gainValue;
				}
			}

			// Update UI
			updateTrackUI(mxrTrack, index);
		});
	}

	// Helper function to update mxrTrack UI
	function updateTrackUI(mxrTrack, index) {
		// read pan and gain values from mxrTrack and updates dial and slider
		// Update pan dial

		const dial = document.querySelectorAll(`.mxr-dial`)[index];
		if (dial) {
			// multimixerJS.setPanOnIndex(index, mxrTrack.panValue);
			multimixerJS.setPanDial(index, mxrTrack.dialAngle);
		}

		// Update volume slider
		const slider = document.querySelectorAll(`.mxr-volume-slider`)[index];
		if (slider) {
			slider.value = mxrTrack.gainValue;
		}
	}
};

// Helper function to get selected voice
multimixerJS.getSelectedVoice = function () {
	const checkedRadio = document.querySelector("input[name=`voice`]:checked");

	return checkedRadio ? checkedRadio.value : null;
};

// Setup voice radios based on mxrTrack metadata
multimixerJS.setupVoiceRadios = function () {
	const voiceRadios = document.querySelectorAll("input[name=`voice`]");
	const voicePartLabels = document.querySelectorAll(`.mxr-voice-letter`);

	// Identify vocal tracks
	const vocalTracks = multimixerJS.mxrTrackArray.filter(
		(mxrTrack) => mxrTrack.trackType === `voice`
	);

	// Update radio buttons to match available vocal parts
	vocalTracks.forEach((mxrTrack, i) => {
		if (i < voiceRadios.length) {
			voiceRadios[i].value = mxrTrack.label;

			// Update label text using the btnLetter from metadata
			if (voicePartLabels[i]) {
				voicePartLabels[i].textContent =
					mxrTrack.btnLetter || mxrTrack.label.charAt(0);
			}
		}
	});

	// Hide any extra radio buttons if we have fewer vocal parts than buttons
	for (let i = vocalTracks.length; i < voiceRadios.length; i++) {
		const radioLabel = voiceRadios[i].closest(`.mxr-radio`);
		if (radioLabel) {
			radioLabel.style.display = `none`;
		}
	}

	// Show all buttons that are being used
	for (let i = 0; i < vocalTracks.length && i < voiceRadios.length; i++) {
		const radioLabel = voiceRadios[i].closest(`.mxr-radio`);
		if (radioLabel) {
			radioLabel.style.display = ``;
		}
	}

	// Disable all by default (Manual Mix is the default state)
	multimixerJS.enableVoiceRadios(false);
};

// Helper method to enable/disable voice radio buttons
multimixerJS.enableVoiceRadios = function (enable) {
	const radios = document.querySelectorAll("input[name=`voice`]");
	radios.forEach((radio) => {
		radio.disabled = !enable;
		if (!enable) {
			radio.checked = false;
		}
	});
};

/////////////// HELPER FUNCTIONS /////////////////

multimixerJS.calculateDialAngle = function (xM, yM, xD, yD, snapMode) {
	const xU = xM - xD;
	const yU = yD - yM;

	const dU = Math.sqrt(xU * xU + yU * yU);

	if (dU === 0) {
		return 0;
	}

	// clips angle at multimixerJS.mxrMaxPanRadians
	let angle = Math.min(
		Math.acos(yU / dU),
		multimixerJS.mxrMaxPanRadians
	).toFixed(4);

	if (snapMode) {
		// snap to 135 || 0
		angle = angle > 1.178097 ? multimixerJS.mxrMaxPanRadians : 0;
	}

	if (xU < 0) {
		angle = angle * -1;
	}

	return angle;
};

multimixerJS.calculatePanValue = function (dialAngle) {
	// dialAngle is in radians
	return (dialAngle / multimixerJS.mxrMaxPanRadians).toFixed(4);
};

// multimixerJS.setPanDialOld = function (xM, yM, xD, yD, snapMode) {

// };

multimixerJS.mxrLoadTrack = async function (url) {
	const response = await fetch(url);
	const mxrArrayBuffer = await response.arrayBuffer();
	return multimixerJS.mxrAudioCtx.decodeAudioData(mxrArrayBuffer);
};

multimixerJS.calculateTimelineOffset = function () {
	const mxrTimelineRect = document
		.querySelector(`.mxr-timeline`)
		.getBoundingClientRect();

	const mxrPlayerRect = document
		.getElementById(`mxr-player`)
		.getBoundingClientRect();

	multimixerJS.mxrTimelineSlider.offsetLeft =
		mxrTimelineRect.left - mxrPlayerRect.left;
};

multimixerJS.startPlayback = function () {
	const mxrCtx = multimixerJS.mxrAudioCtx;
	const pauseOffset = multimixerJS.mxrPauseTime;
	multimixerJS.mxrStartTime = mxrCtx.currentTime - pauseOffset;
	let endedTracksCount = 0;
	const totalTracks = multimixerJS.mxrTrackArray.length;

	multimixerJS.mxrTrackArray.forEach((mxrTrack, index) => {
		// mxrTrack.element = document.getElementById(`mxr-track-${index}`);
		if (!mxrTrack.buffer) {
			console.warn(`❌ No buffer found for ${mxrTrack.label}`);
			return;
		}

		const source = mxrCtx.createBufferSource();
		source.buffer = mxrTrack.buffer;
		mxrTrack.source = source;
		const timelineSliderData = multimixerJS.mxrTimelineSlider;
		const timelineSlider = timelineSliderData.element;

		source.onended = function () {
			if (multimixerJS.mxrIsPaused) endedTracksCount = 0;
			endedTracksCount++;

			if (endedTracksCount === totalTracks) {
				multimixerJS.resetTimeline();
				multimixerJS.mxrIsPaused = false;
				multimixerJS.mxrIsPlaying = false;
				if (multimixerJS.mxrPlayBtn.classList.contains(`btn-on`)) {
					multimixerJS.mxrPlayBtn.classList.remove(`btn-on`);
					timelineSlider.classList.remove(`on`);
				}
			}
		};

		const gainNode = mxrCtx.createGain();
		// Apply the current gain value (respect muted state)
		gainNode.gain.value = mxrTrack.isMuted ? 0 : mxrTrack.gainValue;

		const panNode = mxrCtx.createStereoPanner();
		// panNode.panValue = 0;

		source.connect(gainNode).connect(panNode).connect(mxrCtx.destination);

		source.start(0, pauseOffset);

		mxrTrack.source = source;
		mxrTrack.gainNode = gainNode;
		mxrTrack.panNode = panNode;

		// Apply the current angle & panValue
		multimixerJS.setPanDial(index, mxrTrack.dialAngle);
	});

	multimixerJS.mxrIsPlaying = true;
	multimixerJS.animateTimeline();
};

multimixerJS.startPlaybackX = function () {
	const mxrCtx = multimixerJS.mxrAudioCtx;
	const pauseOffset = multimixerJS.mxrPauseTime;
	multimixerJS.mxrStartTime = mxrCtx.currentTime - pauseOffset;
	let endedTracksCount = 0;
	const totalTracks = multimixerJS.mxrTrackArray.length;

	multimixerJS.mxrTrackArray.forEach((mxrTrack) => {
		if (!mxrTrack.buffer) {
			console.warn(`❌ No buffer found for ${mxrTrack.label}`);
			return;
		}

		const source = mxrCtx.createBufferSource();
		source.buffer = mxrTrack.buffer;
		mxrTrack.source = source;

		source.onended = function () {
			if (multimixerJS.mxrIsPaused) endedTracksCount = 0;
			endedTracksCount++;

			if (endedTracksCount === totalTracks) {
				// multimixerJS.pauseAudio();

				multimixerJS.resetTimeline();
				multimixerJS.mxrIsPaused = false;
				multimixerJS.mxrIsPlaying = false;
				if (multimixerJS.mxrPlayBtn.classList.contains(`btn-on`)) {
					multimixerJS.mxrPlayBtn.classList.remove(`btn-on`);
					timelineSlider.classList.remove(`on`);
				}
			}
		};

		const newGainNode = mxrCtx.createGain();
		newGainNode.gain.value = mxrTrack.gainValue ?? 0.5;

		const newPanNode = mxrCtx.createStereoPanner();
		newPanNode.pan.setValueAtTime(mxrTrack.panValue ?? 0.0, mxrCtx.currentTime);

		source.connect(newGainNode).connect(newPanNode).connect(mxrCtx.destination);

		source.start(0, pauseOffset);

		mxrTrack.source = source;
		mxrTrack.gainNode = newGainNode;
		mxrTrack.panNode = newPanNode;
	});

	multimixerJS.mxrIsPlaying = true;
	multimixerJS.animateTimeline();
};

/////////////// BUTTONS, SLIDERS, UI /////////////////

multimixerJS.pointerDownHandler = function (event) {
	window.EventRegistry.use(event, "multimixerJS.pointerDownHandler");
	const activeElement = event.target;
	multimixerJS.mxrActiveElement = activeElement;
	const index = multimixerJS.getTrackIndex(activeElement);
	multimixerJS.mxrActiveTrackIndex = index;
	const targetType = multimixerJS.getTargetType(event);
	multimixerJS.mxrActiveTargetType = targetType;
	multimixerJS.calculateTimelineOffset();

	// add a pointermove event listener to mxr-player
	document
		.getElementById(`mxr-player`)
		.addEventListener(`pointermove`, multimixerJS.pointerMoveHandler);

	if (targetType === `timeline`) {
		// Don't capture events on mute buttons or other controls
		if (
			activeElement.closest(`.mxr-control-btn`) ||
			activeElement.closest(`.mxr-volume-slider`) ||
			activeElement.closest(`.mxr-dial-container`)
		) {
			return;
		}
		// Check if click is in timeline area
		const seek = multimixerJS.calculateSeek(event);
		if (!seek) return;

		document.body.style.cursor = `grab`;

		if (multimixerJS.mxrIsPlaying) {
			multimixerJS.mxrIsPaused = true;
			multimixerJS.pauseAudio();
		}

		const timelineSliderData = multimixerJS.mxrTimelineSlider;
		timelineSliderData.isDragging = true;
		activeElement.classList.add(`dragging`);
		activeElement.setPointerCapture(event.pointerId);
		multimixerJS.mxrPauseTime = seek.newTime;
		timelineSliderData.element.classList.add(`on`);
		timelineSliderData.element.stylevent.left = `${seek.sliderX}px`;

		// multimixerJS.showStoredData();
		// timelineSliderData.element.setPointerCapture(event.pointerId);
	}

	if (targetType === `dial`) {
		// multimixerJS.mxrActiveDial = event.target;

		const mxrDial = activeElement;
		const mxrDialRect = mxrDial.getBoundingClientRect();
		const centerX = mxrDialRect.x + mxrDialRect.width / 2;
		const centerY = mxrDialRect.y + mxrDialRect.height / 2;
		mxrDial.dataset.centerX = centerX.toFixed(4);
		mxrDial.dataset.centerY = centerY.toFixed(4);
		// Visually disable other dials
		document.querySelectorAll(`.mxr-dial`).forEach((d) => {
			if (d !== mxrDial) d.classList.add(`dial-disabled`);
		});

		mxrDial.classList.add(`dragging`);

		const angle = multimixerJS.calculateDialAngle(
			event.clientX,
			event.clientY,
			parseFloat(mxrDial.dataset.centerX),
			parseFloat(mxrDial.dataset.centerY),
			event.ctrlKey || event.metaKey
		);

		multimixerJS.setPanDial(index, angle);

		mxrDial.setPointerCapture(event.pointerId);

		mxrDial.addEventListener(`contextmenu`, (event) => {
			window.EventRegistry.register(event);
			event.preventDefault(); // ✅ This one actually blocks the context menu
		});
	}

	if (targetType === `slider`) {
		multimixerJS.mxrActiveVolumeSlider = event.target;
		const slider = multimixerJS.mxrActiveVolumeSlider;
		// set pointer capture
		slider.setPointerCapture(event.pointerId);

		multimixerJS.setVolumeSlider(index, parseFloat(slider.value));
	}

	if (targetType === `mute`) {
	}

	multimixerJS.showStoredData();
};

multimixerJS.pointerMoveHandler = function (event) {
	// move type event, no register
	const activeElement = multimixerJS.mxrActiveElement;
	if (!activeElement) {
		return;
	}

	if (!activeElement.className.includes(`dragging`)) {
		return;
	}

	const index = multimixerJS.mxrActiveTrackIndex;
	const targetType = multimixerJS.mxrActiveTargetType;

	if (targetType === `timeline`) {
		// Check if click is in timeline area
		const seek = multimixerJS.calculateSeek(event);
		if (!seek) return;

		const timelineSliderData = multimixerJS.mxrTimelineSlider;
		if (!timelineSliderData.isDragging) return;

		multimixerJS.mxrPauseTime = seek.newTime;
		timelineSliderData.element.style.left = `${seek.sliderX}px`;
		return;
	}

	if (targetType === `dial`) {
		const mxrDial = activeElement;

		const angle = multimixerJS.calculateDialAngle(
			event.clientX,
			event.clientY,
			parseFloat(mxrDial.dataset.centerX),
			parseFloat(mxrDial.dataset.centerY),
			event.ctrlKey || event.metaKey
		);

		multimixerJS.setPanDial(index, angle);
	}
};

multimixerJS.pointerUpHandler = function (event) {
	window.EventRegistry.use(event, "multimixerJS.pointerUpHandler");
	// remove pointermove event listener from mxr-player

	document
		.getElementById(`mxr-player`)
		.removeEventListener(`pointermove`, multimixerJS.pointerMoveHandler);

	const index = multimixerJS.mxrActiveTrackIndex;
	const targetType = multimixerJS.mxrActiveTargetType;
	const activeElement = multimixerJS.mxrActiveElement;

	if (targetType === `timeline`) {
		// Check if click is in timeline area
		const seek = multimixerJS.calculateSeek(event);
		if (!seek) return;

		document.body.style.cursor = `default`;

		if (
			multimixerJS.mxrIsPaused &&
			!multimixerJS.mxrPauseBtn.classList.contains(`btn-on`)
		) {
			multimixerJS.startPlayback();
			multimixerJS.mxrIsPaused = false;
			multimixerJS.mxrIsPlaying = true;
		}

		const timelineSliderData = multimixerJS.mxrTimelineSlider;
		if (!timelineSliderData.isDragging) return;
		timelineSliderData.isDragging = false;
		multimixerJS.mxrPauseTime = seek.newTime;

		timelineSliderData.element.style.left = `${seek.sliderX}px`;
	}

	if (targetType === `dial`) {
		const mxrDial = activeElement;

		const angle = multimixerJS.calculateDialAngle(
			event.clientX,
			event.clientY,
			parseFloat(mxrDial.dataset.centerX),
			parseFloat(mxrDial.dataset.centerY),
			event.ctrlKey || event.metaKey
		);

		multimixerJS.setPanDial(index, angle);
	}

	if (targetType === `slider`) {
		// );
		const slider = multimixerJS.mxrActiveVolumeSlider;

		// Release pointer capture
		if (slider.hasPointerCapture?.(event.pointerId)) {
			slider.releasePointerCapture(event.pointerId);
		}

		multimixerJS.setVolumeSlider(index, parseFloat(slider.value));
		multimixerJS.mxrActiveVolumeSlider = null;
	}

	if (targetType === `mute`) {
	}

	if (targetType === `timeline`) {
		const timelineSliderData = multimixerJS.mxrTimelineSlider;
		if (!timelineSliderData.isDragging) return;

		timelineSliderData.isDragging = false;

		// Release pointer capture
		// if (timelineSliderData.element.hasPointerCapture?.(event.pointerId)) {
		// timelineSliderData.element.releasePointerCapture(event.pointerId);
		// }

		// if (
		// multimixerJS.mxrIsPaused &&
		// !multimixerJS.mxrPauseBtn.classList.contains(`btn-on`)
		// ) {
		// multimixerJS.startPlayback();
		// multimixerJS.mxrIsPaused = false;
		// multimixerJS.mxrIsPlaying = true;
		// }
	}

	// Release pointer capture from activeElement
	if (activeElement.hasPointerCapture?.(event.pointerId)) {
		activeElement.releasePointerCapture(event.pointerId);
	}

	// reset stored data
	multimixerJS.mxrActiveTrackIndex = -1;
	multimixerJS.mxrActiveTargetType = null;
	multimixerJS.mxrActiveElement = null;

	multimixerJS.showStoredData();
};

multimixerJS.setPanOnTrackX = function (mxrTrack, panValue) {
	mxrTrack.panValue = panValue;

	if (!mxrTrack.panNode) {
		mxrTrack.panNode = multimixerJS.mxrAudioCtx.createStereoPanner();
	}
	mxrTrack.panNode.pan.setValueAtTime(
		mxrTrack.panValue,
		multimixerJS.mxrAudioCtx.currentTime
	);

	mxrTrack.element.getElementsByClassName(`mxr-dial`)[0].dataset.panValue =
		mxrTrack.panValue;
	const angle = panValue * multimixerJS.mxrMaxPanRadians;
	const indicator = mxrTrack.element.getElementsByClassName(`mxr-indicator`)[0];
	indicator.style.transform = `translate(-50%, -150%) rotate(${angle}rad)`;
};

multimixerJS.setPanDial = function (index, angle) {
	// sets dialAngle, panValue, and panNode.pan on mxrTrack
	// sets dataset.panValue and dataset.dialAngle on dial
	// moves pan indicator on dial to angle
	if (!isNaN(index) && !isNaN(angle)) {
		const panValue = multimixerJS.calculatePanValue(angle);
		const mxrTrack = multimixerJS.mxrTrackArray[index];
		if (mxrTrack) {
			const mxrDial = document.getElementById(`mxr-dial-` + index);
			mxrTrack.dialAngle = angle;
			mxrTrack.panValue = panValue;
			mxrDial.dataset.dialAngle = angle;
			mxrDial.dataset.panValue = panValue;

			// Update audio panValue node if playing
			if (mxrTrack.panNode) {
				mxrTrack.panNode.pan.setValueAtTime(
					mxrTrack.panValue,
					multimixerJS.mxrAudioCtx.currentTime
				);
			}
		}
		const indicator = document.getElementById(`mxr-indicator-${index}`);
		indicator.style.transform = `translate(-50%, -150%) rotate(${angle}rad)`;
	}
};

multimixerJS.setVolumeSlider = function (index, volume) {
	// Set gain value on mxrTrack gainValue
	if (!isNaN(index) && !isNaN(volume)) {
		const mxrTrack = multimixerJS.mxrTrackArray[index];
		// set slider.value to volume
		document.querySelectorAll(`.mxr-volume-slider`)[index].value = volume;
		if (mxrTrack) {
			mxrTrack.gainValue = volume;
			// Update gain node if playing
			if (mxrTrack.gainNode) {
				// If mxrTrack is muted, store the value but don't apply it
				if (mxrTrack.isMuted) {
					mxrTrack.prevGainValue = volume;
				} else {
					mxrTrack.gainNode.gain.value = volume;
				}
			}
		}
	}
};

multimixerJS.resetTimeline = function () {
	multimixerJS.mxrPauseTime = 0;
	if (!multimixerJS.mxrTimelineSlider.offsetLeft)
		multimixerJS.calculateTimelineOffset();
	multimixerJS.mxrTimelineSlider.element.style.left =
		multimixerJS.mxrTimelineSlider.offsetLeft;
};

multimixerJS.animateTimeline = function () {
	const timelineSlider = multimixerJS.mxrTimelineSlider.element;
	if (!timelineSlider || !multimixerJS.mxrIsPlaying) return;
	if (!multimixerJS.mxrTimelineSlider.offsetLeft) {
		multimixerJS.calculateTimelineOffset();
	}
	const totalWidth = document
		.querySelector(`.mxr-timeline`)
		.getBoundingClientRect().width;
	const currentTime = multimixerJS.mxrAudioCtx.currentTime;
	const elapsed = currentTime - multimixerJS.mxrStartTime;

	// Duration from buffer
	const duration = multimixerJS.mxrTrackArray[0]?.buffer?.duration || 1;
	const progress = Math.max(Math.min(elapsed / duration, 1), 0);
	const x = totalWidth * progress + multimixerJS.mxrTimelineSlider.offsetLeft;

	timelineSlider.style.left = `${x}px`;

	if (progress < 1) {
		timelineSlider.updateRequest = requestAnimationFrame(
			multimixerJS.animateTimeline
		);
	} else {
		multimixerJS.pauseAudio();
		timelineSlider.classList.remove(`on`);
	}
};

multimixerJS.pauseAudio = function () {
	// Stop active sources
	multimixerJS.mxrTrackArray.forEach((mxrTrack) => {
		if (mxrTrack.source) {
			try {
				mxrTrack.source.stop();
			} catch (event) {
				console.warn(`Source already stopped:`, e);
			}
			mxrTrack.source = null;
		}
	});
	multimixerJS.mxrIsPlaying = false;
	cancelAnimationFrame(multimixerJS.mxrTimelineSlider.updateRequest);
};

multimixerJS.initPlaybackBtns = function () {
	multimixerJS.mxrPlayBtn = document.getElementById(`mxr-play-btn`);
	multimixerJS.mxrPauseBtn = document.getElementById(`mxr-pause-btn`);
	multimixerJS.mxrRewindBtn = document.getElementById(`mxr-rewind-btn`);
	multimixerJS.mxrDownloadBtn = document.getElementById(`mxr-download-btn`);
	multimixerJS.mxrTransportBtnList = [
		multimixerJS.mxrPlayBtn,
		multimixerJS.mxrPauseBtn,
		multimixerJS.mxrRewindBtn,
	];
	multimixerJS.mxrAudioTrackList =
		document.querySelectorAll(`.mxr-audio-track`);
	multimixerJS.mxrTimelineSlider.element =
		document.getElementById(`mxr-timeline-slider`);
	const timelineSliderData = multimixerJS.mxrTimelineSlider;
	const timelineSlider = timelineSliderData.element;

	multimixerJS.mxrIsPlaying = false;
	multimixerJS.mxrIsPaused = false;
	timelineSliderData.isDragging = false;

	multimixerJS.mxrPauseBtn.classList.add(`inop`);
	multimixerJS.mxrRewindBtn.classList.add(`inop`);

	function setTransportEnabledX(enabled) {
		multimixerJS.mxrTransportBtnList.forEach((mxrBtn) => {
			if (enabled) {
				mxrBtn.classList.remove(`inop`);
			} else {
				mxrBtn.classList.add(`inop`);
			}
		});
	}

	function handleStartPlayback() {
		multimixerJS.startPlayback(); // sets up nodes, starts audio

		// Clean up any prior animation
		cancelAnimationFrame(timelineSliderData.updateRequest);

		// Begin timeline slider animation
		multimixerJS.animateTimeline();
	}

	multimixerJS.mxrPlayBtn.addEventListener(`click`, (event) => {
		window.EventRegistry.register(event);
		// c•onsole.log(`multimixerJS.mxrPlayBtn(`click`, ()`);
		document.querySelectorAll(`.mxr-dial-container`).forEach((dialcon, i) => {
			const rect = dialcon.getBoundingClientRect();
		});
		document.querySelectorAll(`.mxr-dial`).forEach((dial, i) => {
			const rect = dial.getBoundingClientRect();
		});

		if (multimixerJS.mxrIsPlaying) {
			// 🔁 Already playing → stop and reset
			timelineSliderData.element.classList.remove(`on`);
			multimixerJS.pauseAudio();
			multimixerJS.resetTimeline();
			multimixerJS.mxrPlayBtn.classList.remove(`btn-on`);
			multimixerJS.mxrPauseBtn.classList.add(`inop`);
			multimixerJS.mxrIsPlaying = false;
		} else {
			// ▶️ Fresh start or resume from pause
			handleStartPlayback();
			multimixerJS.mxrPlayBtn.classList.add(`btn-on`);
			multimixerJS.mxrPauseBtn.classList.remove(`inop`);
			multimixerJS.mxrPauseBtn.classList.remove(`btn-on`);
			multimixerJS.mxrRewindBtn.classList.remove(`inop`);
			timelineSliderData.element.classList.add(`on`);
			multimixerJS.mxrIsPlaying = true;
		}
		// qqBtns();

		setTimeout(() => {
			document.querySelectorAll(`.mxr-dial-container`).forEach((dialcon, i) => {
				const rect = dialcon.getBoundingClientRect();
			});
			document.querySelectorAll(`.mxr-dial`).forEach((dial, i) => {
				const rect = dial.getBoundingClientRect();
			});
		}, 100);
	});

	multimixerJS.mxrPauseBtn.addEventListener(`click`, (event) => {
		window.EventRegistry.register(event);
		// c•onsole.log(`multimixerJS.mxrPauseBtn(`click`, ()`);
		if (multimixerJS.mxrIsPlaying) {
			const now = multimixerJS.mxrAudioCtx.currentTime;
			multimixerJS.mxrPauseTime = now - multimixerJS.mxrStartTime;
			multimixerJS.pauseAudio();
			multimixerJS.mxrPlayBtn.classList.remove(`btn-on`);
			multimixerJS.mxrPauseBtn.classList.add(`btn-on`);
			multimixerJS.mxrIsPlaying = false;
			multimixerJS.mxrIsPaused = true;
		} else {
			multimixerJS.mxrPlayBtn.classList.add(`btn-on`);
			multimixerJS.mxrPauseBtn.classList.remove(`btn-on`);
			multimixerJS.mxrIsPlaying = true;
			multimixerJS.mxrIsPaused = false;
			handleStartPlayback();
		}
		multimixerJS.mxrPauseBtn.classList.remove(`inop`);
		// qqBtns();
	});

	multimixerJS.mxrRewindBtn.addEventListener(`click`, (event) => {
		window.EventRegistry.register(event);
		// c•onsole.log(`multimixerJS.mxrRewindBtn(`click`, ()`);
		multimixerJS.resetTimeline();
		activeBtn = multimixerJS.mxrPauseBtn;
		restart = false;
		if (multimixerJS.mxrIsPlaying) {
			restart = true;
			// Stop any existing sources before restart
			multimixerJS.pauseAudio();
		}
		if (multimixerJS.mxrPlayBtn.classList.contains(`btn-on`)) {
			activeBtn = multimixerJS.mxrPlayBtn;
		}
		if (multimixerJS.mxrPauseBtn.classList.contains(`btn-on`)) {
			timelineSliderData.element.style.left = `${timelineSliderData.offsetLeft}px`;
		}

		// Briefly light the rewind button
		multimixerJS.mxrRewindBtn.classList.add(`btn-on`);
		setTimeout(() => {
			multimixerJS.mxrRewindBtn.classList.remove(`btn-on`);
			if (restart) {
				handleStartPlayback();
				activeBtn.classList.add(`btn-on`);
				timelineSliderData.element.classList.add(`on`);
			}
		}, 300);

		// qqBtns();
	});

	// Add this to hc-static-js-multimixer.js
	// Replace the existing download button event listener

	multimixerJS.mxrDownloadBtn.addEventListener(`click`, async (event) => {
		window.EventRegistry.register(event);
		// c•onsole.log(`multimixerJS.mxrDownloadBtn(`click`, ()`);
		// Disable all controls during processing
		multimixerJS.pauseAudio();
		multimixerJS.mxrDownloadBtn.classList.add(`btn-on`);
		multimixerJS.mxrPlayBtn.classList.remove(`btn-on`);
		multimixerJS.mxrPauseBtn.classList.remove(`btn-on`);
		multimixerJS.mxrRewindBtn.classList.remove(`btn-on`);
		multimixerJS.mxrTimelineSlider.element.classList.remove(`on`);

		// Disable transport controls
		multimixerJS.mxrTransportBtnList.forEach((btn) => {
			btn.classList.add(`inop`);
		});

		try {
			const mixedAudioBuffer = await multimixerJS.createMixedAudio();
			multimixerJS.downloadAudioBuffer(
				mixedAudioBuffer,
				multimixerJS.generateDownloadFilename()
			);
		} catch (error) {
			console.error(`❌ Download failed:`, error);
			alert(`Download failed. Please try again.`);
		} finally {
			// Re-enable controls
			multimixerJS.mxrDownloadBtn.classList.remove(`btn-on`);
			multimixerJS.mxrTransportBtnList.forEach((btn) => {
				btn.classList.remove(`inop`);
			});
		}
	});

	// Create mixed audio buffer based on current settings
	multimixerJS.createMixedAudio = async function () {
		const ctx = multimixerJS.mxrAudioCtx;

		// Get the longest track duration

		const maxDuration = Math.max(
			...multimixerJS.mxrTrackArray.map((track) =>
				track.buffer ? track.buffer.duration : 0
			)
		);

		if (maxDuration === 0) {
			throw new Error(`No audio tracks loaded`);
		}

		// Create offline audio context for rendering
		const sampleRate = ctx.sampleRate;
		const frameCount = Math.ceil(maxDuration * sampleRate);
		const offlineCtx = new OfflineAudioContext(2, frameCount, sampleRate); // Stereo output

		// Create master gain for final mix
		const masterGain = offlineCtx.createGain();
		masterGain.connect(offlineCtx.destination);

		// Process each track
		multimixerJS.mxrTrackArray.forEach((track, index) => {
			if (!track.buffer) {
				return;
			}

			// Get current settings from UI
			const volumeSlider =
				document.querySelectorAll(`.mxr-volume-slider`)[index];
			const muteBtn = document.getElementById(`mxr-mute-btn-${index}`);
			const dialElement = document.getElementById(`mxr-dial-${index}`);

			const volume = volumeSlider ? parseFloat(volumeSlider.value) : 1.0;
			const isMuted = muteBtn ? muteBtn.classList.contains(`mute`) : false;
			const panValue = dialElement
				? parseFloat(dialElement.dataset.panValue || 0)
				: 0;

			// Skip muted tracks
			if (isMuted) {
				return;
			}

			// Create audio source
			const source = offlineCtx.createBufferSource();
			source.buffer = track.buffer;

			// Create gain node for volume
			const gainNode = offlineCtx.createGain();
			gainNode.gain.value = volume;

			// Create panner for stereo positioning
			const panNode = offlineCtx.createStereoPanner();
			panNode.pan.value = Math.max(-1, Math.min(1, panValue)); // Clamp to [-1, 1]

			source.connect(gainNode).connect(panNode).connect(masterGain);

			// Start the source
			source.start(0);
		});

		const renderedBuffer = await offlineCtx.startRendering();

		return renderedBuffer;
	};

	multimixerJS.downloadAudioBuffer = function (buffer, filename) {
		const wavBlob = multimixerJS.audioBufferToWav(buffer);
		const url = URL.createObjectURL(wavBlob);

		// Create download link
		const downloadLink = document.createElement(`a`);
		downloadLink.href = url;
		downloadLink.download = filename;
		downloadLink.style.display = `none`;

		// Trigger download
		document.body.appendChild(downloadLink);
		downloadLink.click();
		document.body.removeChild(downloadLink);

		// Clean up
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	};

	multimixerJS.audioBufferToWav = function (buffer) {
		const length = buffer.length;
		const numberOfChannels = buffer.numberOfChannels;
		const sampleRate = buffer.sampleRate;
		const bitsPerSample = 16;
		const bytesPerSample = bitsPerSample / 8;
		const blockAlign = numberOfChannels * bytesPerSample;
		const byteRate = sampleRate * blockAlign;
		const dataSize = length * blockAlign;
		const bufferSize = 44 + dataSize; // WAV header is 44 bytes

		const arrayBuffer = new ArrayBuffer(bufferSize);
		const view = new DataView(arrayBuffer);

		// WAV Header
		let offset = 0;

		// RIFF chunk descriptor
		writeString(view, offset, `RIFF`);
		offset += 4;
		view.setUint32(offset, bufferSize - 8, true);
		offset += 4; // File size - 8
		writeString(view, offset, `WAVE`);
		offset += 4;

		// fmt sub-chunk
		writeString(view, offset, `fmt `);
		offset += 4;
		view.setUint32(offset, 16, true);
		offset += 4; // Sub-chunk size
		view.setUint16(offset, 1, true);
		offset += 2; // Audio format (PCM)
		view.setUint16(offset, numberOfChannels, true);
		offset += 2;
		view.setUint32(offset, sampleRate, true);
		offset += 4;
		view.setUint32(offset, byteRate, true);
		offset += 4;
		view.setUint16(offset, blockAlign, true);
		offset += 2;
		view.setUint16(offset, bitsPerSample, true);
		offset += 2;

		// data sub-chunk
		writeString(view, offset, `data`);
		offset += 4;
		view.setUint32(offset, dataSize, true);
		offset += 4;

		// Write audio data
		const channels = [];
		for (let i = 0; i < numberOfChannels; i++) {
			channels.push(buffer.getChannelData(i));
		}

		let sampleOffset = offset;
		for (let i = 0; i < length; i++) {
			for (let channel = 0; channel < numberOfChannels; channel++) {
				const sample = Math.max(-1, Math.min(1, channels[channel][i]));
				const intSample = Math.floor(sample * 0x7fff);
				view.setInt16(sampleOffset, intSample, true);
				sampleOffset += 2;
			}
		}

		return new Blob([arrayBuffer], { type: `audio/wav` });

		function writeString(view, offset, string) {
			for (let i = 0; i < string.length; i++) {
				view.setUint8(offset + i, string.charCodeAt(i));
			}
		}
	};
};

// Generate descriptive filename for download
multimixerJS.generateDownloadFilename = function () {
	// Get the base song name (you might want to make this configurable)
	// Get current date in YYYYMMDD format
	const now = new Date();
	const dateString =
		String(now.getFullYear() - 2000) +
		String(now.getMonth() + 1).padStart(2, `0`) +
		String(now.getDate()).padStart(2, `0`);

	// Get the active preset
	const activePreset = multimixerJS.mxrLastPreset;

	// Get selected voice for presets that use it

	let filename = multimixerJS.songName.split("`")[1];

	const selectedVoice = multimixerJS.getSelectedVoice();
	switch (activePreset) {
		case `stereo`:
			// Format: Gloria_Soprano_Left_20250101
			if (selectedVoice) {
				filename += `_${selectedVoice}_Left_${dateString}`;
			} else {
				filename += `_StereoSplit_${dateString}`;
			}
			break;

		case `partpre`:
			// Format: Gloria_Soprano_Forward_20250101
			if (selectedVoice) {
				filename += `_${selectedVoice}_Predominant_${dateString}`;
			} else {
				filename += `_PartPredominant_${dateString}`;
			}
			break;

		case `init`:
		default:
			// Format: Gloria_CustomMix_20250101
			filename += `_CustomMix_${dateString}`;
			break;
	}

	return filename + `.wav`;
};

multimixerJS.initTimelineSeekAndDrag = function () {
	const mxrPlayer = document.getElementById(`mxr-player`);
	multimixerJS.mxrTimelineSlider.element =
		document.getElementById(`mxr-timeline-slider`);

	//const timelineSliderData = multimixerJS.mxrTimelineSlider;
	const timelineSlider = multimixerJS.mxrTimelineSlider.element;

	const firstTimeline = document.getElementById(`mxr-timeline-0`);

	if (!mxrPlayer || !timelineSlider || !firstTimeline) return;

	const timelineContainer = document.getElementsByClassName(
		`mxr-timeline-container`
	)[0];

	// if (!timelineContainer) return;

	// Set up mxrPlayer group event listeners
	mxrPlayer.addEventListener(`pointerdown`, (event) => {
		window.EventRegistry.register(event);
		multimixerJS.pointerDownHandler(event);
	});
	mxrPlayer.addEventListener(`pointerup`, (event) => {
		window.EventRegistry.register(event);
		multimixerJS.pointerUpHandler(event);
	});
};

multimixerJS.calculateSeek = function (event) {
	window.EventRegistry.use(event, "multimixerJS.calculateSeek");
	const mxrPlayer = document.getElementById(`mxr-player`);

	const timelineSliderData = multimixerJS.mxrTimelineSlider;
	const timelineSlider = timelineSliderData.element;
	const firstTimeline = document.getElementById(`mxr-timeline-0`);

	if (!mxrPlayer || !timelineSlider || !firstTimeline) return;

	const timelineContainer = document.getElementsByClassName(
		`mxr-timeline-container`
	)[0];
	if (!timelineContainer) return;

	// Calculate if click is within the timeline area
	const timelineRect = timelineContainer.getBoundingClientRect();
	const playerRect = mxrPlayer.getBoundingClientRect();

	// Check if the click is in the timeline area (left of dials)
	const clickBox = {
		left: timelineRect.left,
		right: timelineRect.right + 2,
		top: playerRect.top,
		bottom: playerRect.bottom,
	};

	// Check if click is inside timeline bounds
	if (
		event.clientY < clickBox.top ||
		event.clientY > clickBox.bottom ||
		event.clientX > clickBox.right // ||
		// event.clientX < clickBox.left
	)
		return null;

	const x = event.clientX - clickBox.left;
	// stay inside x-bounds of clickBox
	const percent = Math.min(Math.max(x / timelineRect.width, 0), 1);
	const duration = multimixerJS.mxrTrackArray[0]?.buffer?.duration || 1;
	const newTime = Math.min(percent, 1) * duration;

	return {
		percent,
		newTime,
		sliderX:
			percent * timelineRect.width + (timelineSliderData.offsetLeft || 0),
	};
};

multimixerJS.getTargetType = function (event) {
	window.EventRegistry.use(event, "multimixerJS.getTargetType");
	// check the type of event.target
	const eTarget = `${event.target.id || `no-id`}.${event.target.className}`;

	if (eTarget.includes(`mxr-dial`)) return `dial`;
	if (eTarget.includes(`mxr-volume-slider`)) return `slider`;
	if (eTarget.includes(`mxr-mute`)) return `mute`;
	// otherwise, default is timeline
	return `timeline`;
};

multimixerJS.getTrackIndex = function (element) {
	// bubbles up through heirarchy to find an element with dataset.trackIndex
	// returns -1 if nothing found
	trackIndex = -1;
	if (element) {
		if (element.id !== `multimixer`) {
			if (element.dataset.trackIndex) {
				trackIndex = parseInt(element.dataset.trackIndex);
			} else {
				multimixerJS.getTrackIndex(element.parentElement);
			}
		}
	}

	return trackIndex;
};

multimixerJS.showStoredData = function () {};

// Minimal Touch Detection Test
// Add this single function to your hc-static-js-multimixer.js file

multimixerJS.isTouchDevice = function () {
	return `onpointerdown` in window || navigator.maxTouchPoints > 0;
};

// Create a visual display for test results
multimixerJS.showTouchTest = function () {
	// Create a test display div
	const testDiv = document.createElement(`div`);
	testDiv.id = `touch-test-display`;
	testDiv.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-family: monospace;
        font-size: 12px;
        z-index: 10000;
        max-width: 300px;
    `;

	// Test results
	const isTouchDevice = multimixerJS.isTouchDevice();
	const hasOnpointerdown = `onpointerdown` in window;
	const maxTouchPoints = navigator.maxTouchPoints || 0;

	testDiv.innerHTML = `
        <strong>Touch Test Results:</strong><br>
        📱 Touch Device: ${isTouchDevice}<br>
        👆 onpointerdown: ${hasOnpointerdown}<br>
        🖐️ maxTouchPoints: ${maxTouchPoints}<br>
        🌐 User Agent: ${navigator.userAgent.substring(0, 50)}...<br>
        <small>Tap this box to hide</small>
    `;

	// Add click to hide
	testDiv.addEventListener(`click`, (event) => {
		window.EventRegistry.register(event);
		testDiv.remove();
	});

	testDiv.addEventListener(`pointerup`, (event) => {
		window.EventRegistry.register(event);
		event.preventDefault();
		testDiv.remove();
	});

	// document.body.appendChild(testDiv);

	// Also log to console (in case you can access it)
	console.log(`🔍 Touch device test:`, isTouchDevice);
	console.log(`🔍 onpointerdown in window:`, hasOnpointerdown);
	console.log(`🔍 navigator.maxTouchPoints:`, maxTouchPoints);
};

/*
// SHOW TOUCH TEST
// Show the test when DOM is ready
document.addEventListener(`DxOMContentLoaded`, (event) => {
	xxx(event);
	c‡onst ev‡entIndex = window.EventRegistry.register(event);
	multimixerJS.showTouchTest();
});
*/

// Prevent Double-Firing Test
// Replace your testTouchEvents function with this improved version

multimixerJS.testTouchEvents = function () {
	let touchCount = 0;

	// Create a test button to tap
	const testButton = document.createElement(`button`);
	testButton.id = `touch-test-button`;
	testButton.textContent = `TAP ME (Fixed)`;
	testButton.style.cssText = `
        position: fixed;
        top: 100px;
        left: 10px;
        background: #007AFF;
        color: white;
        border: none;
        padding: 15px 20px;
        border-radius: 8px;
        font-size: 16px;
        z-index: 10000;
        min-width: 120px;
        min-height: 44px;
        touch-action: manipulation;
    `;

	// Create display for results
	const resultDiv = document.createElement(`div`);
	resultDiv.id = `touch-results`;
	resultDiv.style.cssText = `
        position: fixed;
        top: 160px;
        left: 10px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-family: monospace;
        font-size: 12px;
        z-index: 10000;
        max-width: 300px;
    `;

	function updateResults(eventType) {
		touchCount++;
		resultDiv.innerHTML = `
            <strong>Touch Events (Fixed):</strong><br>
            Last event: ${eventType}<br>
            Total taps: ${touchCount}<br>
            Time: ${new Date().toLocaleTimeString()}<br>
            <small>Should increment by 1 now</small>
        `;
		console.log(`Touch event: ${eventType}, count: ${touchCount}`);
	}

	// Only use pointerup on touch devices, click on others
	if (multimixerJS.isTouchDevice()) {
		console.log(`Using touch events for button`);

		testButton.addEventListener(`pointerup`, (event) => {
			window.EventRegistry.register(event);
			event.preventDefault(); // Prevent click from firing
			event.stopPropagation(); // Stop event bubbling
			updateResults(`pointerup`);
		});

		// Optional: Add visual feedback on touch start
		testButton.addEventListener(`pointerdown`, (event) => {
			window.EventRegistry.register(event);
			testButton.style.transform = `scale(0.95)`;
		});

		testButton.addEventListener(`pointerup`, (event) => {
			window.EventRegistry.register(event);
			setTimeout(() => {
				testButton.style.transform = `scale(1)`;
			}, 100);
		});
	} else {
		console.log(`Using click events for button`);

		testButton.addEventListener(`click`, (event) => {
			window.EventRegistry.register(event);
			updateResults(`click`);
		});
	}

	// Initial display
	updateResults(`ready`);

	document.body.appendChild(testButton);
	// document.body.appendChild(resultDiv);

	// Auto-remove after 30 seconds
	setTimeout(() => {
		testButton.remove();
		resultDiv.remove();
	}, 30000);
};

// Real Play Button Touch Enhancement
// Add this to your multimixer code, call it after your existing initialization

multimixerJS.enhancePlayButtonTouch = function () {
	const playBtn = document.getElementById(`mxr-play-btn`);
	if (!playBtn) {
		console.log(`❌ Play button not found`);
		return;
	}

	console.log(`🎯 Enhancing real play button with touch...`);

	// Status display (temporary, for testing)
	const statusDiv = document.createElement(`div`);
	statusDiv.style.cssText = `
        position: fixed;
        top: 220px;
        left: 10px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 8px;
        border-radius: 5px;
        font-family: monospace;
        font-size: 11px;
        z-index: 10000;
        max-width: 200px;
    `;
	statusDiv.textContent = `Play button enhanced`;
	// document.body.appendChild(statusDiv);

	// Remove after 5 seconds
	// setTimeout(() => statusDiv.remove(), 5000);

	// Store the original functionality (from your existing code)
	const originalPlayAction = () => {
		console.log(`🎵 Play button activated`);

		if (multimixerJS.mxrIsPlaying) {
			// Stop playing (your existing logic)
			multimixerJS.mxrTimelineSlider.element.classList.remove(`on`);
			multimixerJS.pauseAudio();
			multimixerJS.resetTimeline();
			multimixerJS.mxrPlayBtn.classList.remove(`btn-on`);
			multimixerJS.mxrPauseBtn.classList.add(`inop`);
			multimixerJS.mxrIsPlaying = false;
		} else {
			// Start playing (your existing logic)
			multimixerJS.startPlayback();
			multimixerJS.mxrPlayBtn.classList.add(`btn-on`);
			multimixerJS.mxrPauseBtn.classList.remove(`inop`);
			multimixerJS.mxrPauseBtn.classList.remove(`btn-on`);
			multimixerJS.mxrRewindBtn.classList.remove(`inop`);
			multimixerJS.mxrTimelineSlider.element.classList.add(`on`);
			multimixerJS.mxrIsPlaying = true;
		}
	};

	// Enhanced button styling for touch
	playBtn.style.touchAction = `manipulation`;
	playBtn.style.webkitTapHighlightColor = `rgba(0,0,0,0)`;

	// Remove existing event listeners by cloning the button
	const newPlayBtn = playBtn.cloneNode(true);
	playBtn.parentNode.replaceChild(newPlayBtn, playBtn);

	// Also add these CSS properties right after you create newPlayBtn:
	newPlayBtn.style.webkitUserSelect = `none`;
	newPlayBtn.style.userSelect = `none`;
	newPlayBtn.style.webkitTouchCallout = `none`;
	newPlayBtn.style.touchAction = `manipulation`;

	// Update the reference
	multimixerJS.mxrPlayBtn = newPlayBtn;

	// Add touch-aware event handling
	if (multimixerJS.isTouchDevice()) {
		console.log(`📱 Adding touch events to play button`);

		// Fix the pointerdown handler to not break pointerup
		// Update your pointerdown handler:

		// Touch start - visual feedback (DON'T prevent default here)
		newPlayBtn.addEventListener(`pointerdown`, (event) => {
			window.EventRegistry.register(event);
			// Don't prevent default on pointerdown - it breaks pointerup
			// event.preventDefault(); // Remove this line

			newPlayBtn.style.transform = `scale(0.95)`;
			newPlayBtn.style.transition = `transform 0.1s`;
		}); // Remove { passive: false } since we're not preventing default

		// Update your pointerup handler to prevent click instead:
		newPlayBtn.addEventListener(
			`pointerup`,
			(event) => {
				window.EventRegistry.register(event);
				event.preventDefault(); // Prevent click from firing (keep this)
				event.stopPropagation(); // Keep this too

				// Reset visual feedback
				newPlayBtn.style.transform = `scale(1)`;

				// Execute the play/pause action
				originalPlayAction();
			},
			{ passive: false }
		); // Keep this since we are preventing default

		// Keep the CSS properties (these prevent text selection without breaking events):
		newPlayBtn.style.webkitUserSelect = `none`;
		newPlayBtn.style.userSelect = `none`;
		newPlayBtn.style.webkitTouchCallout = `none`;
		newPlayBtn.style.touchAction = `manipulation`;

		// Touch cancel - reset visual feedback
		newPlayBtn.addEventListener(`touchcancel`, (event) => {
			window.EventRegistry.register(event);
			newPlayBtn.style.transform = `scale(1)`;
		});
	} else {
		console.log(`🖱️ Adding click events to play button`);

		// Desktop - use click
		newPlayBtn.addEventListener(`click`, originalPlayAction);
	}

	console.log(`✅ Play button touch enhancement complete`);
	return newPlayBtn;
};

/*
// Call this after your existing multimixer initialization
// Add this line to test:
document.addEventListener(`DxOMContentLoaded`, (event) => {
	c‡onst ev‡entIndex = window.EventRegistry.register(event);
	// Wait for your existing init to complete
	setTimeout(() => {
		if (window.multimixerJS && document.getElementById(`mxr-play-btn`)) {
			multimixerJS.enhancePlayButtonTouch();
		}
	}, 2000); // Wait 2 seconds for existing init
});
*/
