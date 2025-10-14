// hc-static-js-audiomanager.js gets loaded by initJS.injectScriptsParallel()
// as part of hc-static-js/hc-static-js-init.js
mmm(`✅ LOADED hc-static-js-audiomanager.js`);

// HarmonyCue Unified Audio Manager
// Coordinates all audio playback across components with single AudioContext
const audiomanagerJS = (window.audiomanagerJS = window.audiomanagerJS || {});

// Core state management
audiomanagerJS.audioCtx = null;
audiomanagerJS.currentPlayer = null;
audiomanagerJS.players = new Map();
audiomanagerJS.isInitialized = false;
audiomanagerJS.globalVolume = 1.0;
audiomanagerJS.globalMute = false;
audiomanagerJS.audioIsPlaying = false;
audiomanagerJS.audioStartTimeX = 0;
audiomanagerJS.playStartTime = 0; // When play started
audiomanagerJS.audioPauseTimeX = 0;
audiomanagerJS.pauseStartTime = 0; // When pause began
audiomanagerJS.pausePosition = 0; // Where audio paused
audiomanagerJS.lastPauseTime = 0;

audiomanagerJS.init = async function () {
	if (this.isInitialized) {
		// c•onsole.log("AudioManager already initialized");
		return this.getAudioCtx();
	}
	// m•mm("🎬 Starting audiomanagerJS.init()");

	try {
		this.audioCtx = this.getAudioCtx();
		this.isInitialized = true;
		// m•mm(`📊 AudioContext state: ${this.audioCtx.state}`);
		// return this.audioCtx;
	} catch (err) {
		console.log("⚠️ AudioContext creation failed:", err);
		return false;
	}

	mmm("✅ audiomanagerJS initialized");
};

// Get or create the global audio context
audiomanagerJS.getAudioCtx = function () {
	// m•mm(`🎬 audiomanagerJS.getAudioCtx()`);
	// If we don't already have a context or it's closed, create one
	if (!this.audioCtx || this.audioCtx.state === "closed") {
		try {
			this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
			// m•mm("🎵 AudioContext created in manager");
		} catch (err) {
			console.log("⚠️ audiomanagerJS: failed to create AudioContext", err);
			this.audioCtx = null;
		}
	}

	return this.audioCtx;
};

// Register a player component with the manager
audiomanagerJS.register = function (playerName, config) {
	if (!config || !config.element) {
		console.log(`⚠️ Invalid config for player: ${playerName}`);
		return false;
	}

	const player = {
		name: playerName,
		element: config.element,
		playFn: config.playFn || null,
		stopFn: config.stopFn || null,
		pauseFn: config.pauseFn || null,
		setupNodesFn: config.setupNodesFn || null,
		isPlaying: false,
		isPaused: false,
		volume: config.volume || 1.0,
		nodes: null,
		...config,
	};

	this.players.set(playerName, player);
	// m•mm(`🎯 Registered player: ${playerName}`);
	// m•mm(`📋 Total players: ${this.players.size}`);

	return player;
};

// Central play method - ensures single playback
audiomanagerJS.play = async function (playerName, ...args) {
	if (!this.isInitialized) {
		console.log(
			"⚠️ AudioManager not initialized - call audiomanagerJS.init() first"
		);
		return false;
	}

	const player = this.players.get(playerName);
	if (!player) {
		console.log(`⚠️ Player not found: ${playerName}`);
		return false;
	}

	// m•mm(`🎯 Play request: ${playerName}`);
	// c•onsole.log(`🎯 Play request: ${playerName}, ${JSON.stringify(player)}`);

	try {
		// Stop all other players first
		this.stopAllExcept(playerName);

		// Ensure AudioContext is ready
		if (this.audioCtx.state === "suspended") {
			// m•mm("🔄 Resuming AudioContext...");
			await this.audioCtx.resume();
		}

		// Apply global mute/volume settings
		if (this.globalMute) {
			// m•mm("🔇 Global mute is active - audio will be silent");
		}

		// Delegate to component's play function or use default HTML5 play
		let playResult;
		if (player.playFn) {
			mmm(`▶️ player.playFn audio started: ${playerName}`);
			playResult = await player.playFn.call(this, ...args);
		} else {
			// Default HTML5 audio play
			player.element.volume =
				player.volume * this.globalVolume * (this.globalMute ? 0 : 1);
			playResult = await player.element.play();
			mmm(`▶️ Default HTML5 audio started: ${playerName}`);
		}

		if (playResult !== false) {
			player.isPlaying = true;
			player.isPaused = false;
			this.currentPlayer = playerName;
			// m•mm(`▶️ Audio started: ${playerName}`);

			// Setup Web Audio nodes if component provides setupNodesFn
			if (player.setupNodesFn && !player.nodes) {
				player.nodes = player.setupNodesFn(this.audioCtx, player.element);
				// m•mm(`🔗 Web Audio nodes created for: ${playerName}`);
			}

			return true;
		} else {
			console.log(`⚠️ Play failed for: ${playerName}`);
			return false;
		}
	} catch (err) {
		console.log(`⚠️ Play error for ${playerName}:`, err);
		return false;
	}
};

// Stop specific player
audiomanagerJS.stop = function (playerName) {
	const player = this.players.get(playerName);
	if (!player || !player.isPlaying) return;

	try {
		if (player.stopFn) {
			player.stopFn.call(this);
		} else {
			// Default HTML5 stop
			player.element.pause();
			player.element.currentTime = 0;
		}

		player.isPlaying = false;
		player.isPaused = false;

		if (this.currentPlayer === playerName) {
			this.currentPlayer = null;
		}

		// m•mm(`⏹️ Audio stopped: ${playerName}`);
	} catch (err) {
		console.log(`⚠️ Stop error for ${playerName}:`, err);
	}
};

// Stop all players
audiomanagerJS.stopAll = function () {
	if (this.players.size === 0) return;

	let stoppedCount = 0;

	// Iterate through all registered players
	this.players.forEach((player, playerName) => {
		if (!player.isPlaying) return; // Skip non-playing

		try {
			if (player.stopFn) {
				player.stopFn.call(this);
			} else {
				// Default HTML5 stop
				player.element.pause();
				player.element.currentTime = 0;
			}

			player.isPlaying = false;
			player.isPaused = false;
			stoppedCount++;
		} catch (err) {
			console.log(`⚠️ Stop error for ${playerName}:`, err);
		}
	});

	// Clear current player
	this.currentPlayer = null;

	if (stoppedCount > 0) {
		// m•mm(`⏹️ Stopped ${stoppedCount} audio players`);
	}
};

audiomanagerJS.pause = function (playerName) {
	const player = this.players.get(playerName);
	if (!player) {
		console.log(`⚠️ Player "${playerName}" not found`);
		return false;
	}

	// Call player's pause function (which uses suspend)
	if (player.pauseFn) {
		player.pauseFn();
		return true;
	}

	return false;
};

audiomanagerJS.resume = function (playerName) {
	const player = this.players.get(playerName);
	if (!player) {
		console.log(`⚠️ Player "${playerName}" not found`);
		return false;
	}

	// Call player's resume function (which checks timer)
	if (player.resumeFn) {
		player.resumeFn();
		return true;
	}

	return false;
};

// Stop all players except specified one
audiomanagerJS.stopAllExcept = function (keepPlaying = null) {
	let stoppedCount = 0;

	this.players.forEach((player, name) => {
		if (name !== keepPlaying && (player.isPlaying || player.isPaused)) {
			this.stop(name);
			stoppedCount++;
		}
	});

	if (stoppedCount > 0) {
		console.log(`🛑 Stopped ${stoppedCount} other player(s)`);
	}
};

// Stop all audio
audiomanagerJS.stopAll = function () {
	this.stopAllExcept(null);
	this.currentPlayer = null;
};

// Global volume control
audiomanagerJS.setGlobalVolume = function (volume) {
	this.globalVolume = Math.max(0, Math.min(1, volume));
	// m•mm(`🔊 Global volume set to: ${this.globalVolume}`);

	// Apply to currently playing audio
	if (this.currentPlayer) {
		const player = this.players.get(this.currentPlayer);
		if (player && player.element) {
			player.element.volume =
				player.volume * this.globalVolume * (this.globalMute ? 0 : 1);
		}
	}
};

// Global mute control
audiomanagerJS.setGlobalMute = function (mute) {
	this.globalMute = !!mute;
	// m•mm(`🔇 Global mute: ${this.globalMute ? "ON" : "OFF"}`);

	// Apply to currently playing audio
	if (this.currentPlayer) {
		const player = this.players.get(this.currentPlayer);
		if (player && player.element) {
			player.element.volume =
				player.volume * this.globalVolume * (this.globalMute ? 0 : 1);
		}
	}
};

// Get current player info
audiomanagerJS.getCurrentPlayer = function () {
	if (!this.currentPlayer) return null;
	return this.players.get(this.currentPlayer);
};

// Get player info
audiomanagerJS.getPlayer = function (playerName) {
	return this.players.get(playerName);
};

// List all registered players
audiomanagerJS.listPlayers = function () {
	const playerList = [];
	this.players.forEach((player, name) => {
		playerList.push({
			name,
			isPlaying: player.isPlaying,
			isPaused: player.isPaused,
			volume: player.volume,
		});
	});
	return playerList;
};

// Debug information
audiomanagerJS.debug = function () {
	mmm("🐛 AudioManager Debug Info:");
	mmm(`- Initialized: ${this.isInitialized}`);
	mmm(`- Context State: ${this.audioCtx?.state || "none"}`);
	mmm(`- Current Player: ${this.currentPlayer || "none"}`);
	mmm(`- Global Volume: ${this.globalVolume}`);
	mmm(`- Global Mute: ${this.globalMute}`);
	mmm(`- Registered Players: ${this.players.size}`);

	this.players.forEach((player, name) => {
		mmm(`  - ${name}: playing=${player.isPlaying}, paused=${player.isPaused}`);
	});
};

// Integration helper - call this from unlock event handler
audiomanagerJS.handleUnlockEvent = function () {
	// m•mm("🔓 Audio unlock event received by audiomanagerJS.handleUnlockEvent()");

	// Initialize if not already done
	if (!this.isInitialized) {
		this.init();
	}

	// Resume context if suspended
	if (this.audioCtx?.state === "suspended") {
		return this.audioCtx.resume().then(() => {
			// m•mm("🎵 AudioContext resumed after user gesture");
		});
	}
	// m•mm("✅ AudioManager ready for playback");
	return Promise.resolve();
};

// Cleanup method
audiomanagerJS.destroy = function () {
	this.stopAll();

	if (this.audioCtx) {
		this.audioCtx.close();
		this.audioCtx = null;
	}

	this.players.clear();
	this.currentPlayer = null;
	this.isInitialized = false;

	// m•mm("🗑️ AudioManager destroyed");
};

/*
// Initialize unified AudioContext - call this after unlock event
audiomanagerJS.initX = function () {
	if (this.isInitialized) {
		console.log("AudioManager already initialized");
		return this.getAudioCtx();
	}

	try {
		this.audioCtx = this.getAudioCtx();
		this.isInitialized = true;
		mmm(`📊 AudioContext state: ${this.audioCtx.state}`);
		// return this.audioCtx;
	} catch (err) {
		console.error("⚠️ AudioContext creation failed:", err);
		return false;
	}
};
*/
