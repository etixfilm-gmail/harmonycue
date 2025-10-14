/* eslint-env browser */
// @ts-nocheck

// hc-static-js-splash.js gets loaded by initJS.injectScriptsParallel()
// as part of hc-static-js/hc-static-js-init.js
mmm(`✅ LOADED hc-static-js-splash.js`);

const splashJS = (window.splashJS = window.splashJS || {});

splashJS.coverContents = null;
splashJS.coverImage = null;
splashJS.coverImageReady = false;
splashJS.hasHeaderContents = false;
splashJS.splashStarted = false;

// audio and unlock constants //
splashJS.audioPrompt = null;
splashJS.promptRemoved = false;

splashJS.startSplashAnimation = async function () {
	// z•zz();
	mmm("🎬 splashJS.startSplashAnimation() starting");
	if (splashJS.splashStarted) return;
	splashJS.splashStarted = true;

	const pageContent = document.getElementById(`page-content`);
	const headerContents = document.getElementById(`header-contents`);
	const splashTextLogo = document.getElementById(`splash-text-logo`);
	const splashPad = document.getElementById(`splash-pad`);
	const backgroundImageUrl = `/hc-static-images/hc-static-images-music-wallpaper-light.webp`;

	if (!splashJS.coverImage || !pageContent || !headerContents) {
		console.warn(`❌ Required DOM elements missing, retrying splash in 50ms`);
		await new Promise((r) => setTimeout(r, 50));
		return splashJS.startSplashAnimation();
	}

	headerContents.style.transition = `none`;
	void headerContents.offsetHeight;
	headerContents.style.transition = ``;

	// Fade out cover once background image loads (or immediately if it fails)
	await new Promise((resolve) => {
		const img = new Image();

		img.onload = () => {
			console.log(`✅ Background loaded`);
			headerContents.classList.add(`show`);
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					splashJS.coverImage.classList.add(`cover-fading`);
					setTimeout(() => {
						splashPad.classList.add(`animate-padding`);
						splashTextLogo.classList.add(`logo-drop`);
					}, 300);
				});
			});
			resolve();
		};

		img.onerror = () => {
			console.warn(`⚠️ Background failed to load, proceeding anyway`);
			headerContents.classList.add(`show`);
			splashJS.coverImage.classList.add(`cover-fading`);
			setTimeout(() => {
				splashPad.classList.add(`animate-padding`);
				splashTextLogo.classList.add(`logo-drop`);
			}, 300);
			resolve();
		};

		img.src = backgroundImageUrl;
	});

	// Wait for animation to finish or fallback timeout
	await new Promise((resolve) => {
		let finished = false;

		function cleanup() {
			if (finished) return;
			finished = true;
			pageContent.classList.add(`show`);
			setTimeout(() => {
				document.documentElement.classList.remove(`scroll-lock`);
				document.body.classList.remove(`scroll-lock`);
			}, 1200);
			resolve();
		}

		splashJS.coverImage.addEventListener(
			"animationend",
			(event) => {
				if (!event.index) event = eRegistryJS.register(event);
				console.log("✅ Animation finished (animationend)");
				handlersJS.removeCoverImage(event);
				cleanup();
			},
			{ once: true }
		);

		setTimeout(() => {
			if (splashJS.coverImage?.parentNode) {
				console.log(`⚠️ Fallback: removing cover after timeout`);
				splashJS.coverImage.remove();
				cleanup();
			}
		}, 1500);
	});
};

splashJS.initSplashSequence = async function () {
	// z•zz();
	mmm("🎬 splashJS.initSplashSequence() starting");
	// Wait for splash image flag
	if (!window.splashJS.coverImageReady) {
		console.log(`⏳ Waiting for image to be readyelispsis`);
		await new Promise((resolve) => {
			const checkImage = setInterval(() => {
				if (window.splashJS.coverImageReady) {
					console.log(`✅ Image now ready`);
					clearInterval(checkImage);
					resolve();
				}
			}, 50);
		});
	} else {
		console.log(`✅ Image already ready`);
	}

	// Wait for header-contents to appear
	if (!splashJS.hasHeaderContents) {
		const theElement = await utilsJS.waitForElement("#header-contents");
		if (theElement) {
			console.log("✅ #header-contents exists");
			splashJS.hasHeaderContents = true;
		}
	}

	// Final step
	initJS.updateComponentSizeVars();
	splashJS.startSplashAnimation();
};

splashJS.init = async function () {
	// z•zz();
	mmm("🎬 Starting splashJS.init()");

	try {
		splashJS.coverImage = document.getElementById("cover-image");

		if (splashJS.coverImage) {
			await utilsJS.waitForImage(splashJS.coverImage);
			console.log("✅ splashJS.coverImage loaded");
			splashJS.coverImageReady = true;
		} else {
			console.warn("❌ splashJS.init(): cover image not found");
		}

		const splashTextLogo = document.getElementById("splash-text-logo");
		const headerContents = document.getElementById("header-contents");
		if (!splashTextLogo || !headerContents) {
			console.warn("❌ splashTextLogo or headerContents missing");
			return false;
		}

		document.body.classList.add("ready");
		return true;
	} catch (err) {
		console.error("❌ splashJS.init() failed:", err);
		throw err;
	}
};
