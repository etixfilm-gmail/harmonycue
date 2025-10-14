/* eslint-env browser */

// hc-static-js-splash.js gets loaded by hc-views/layout/index.ejs
// as a <script> element at the bottom of the <body>
// c•onsole.log(`hc-static-js-splash.js LOADED`);

let splashStarted = false;

function startSplashAnimation() {
	if (splashStarted) return;
	splashStarted = true;

	const pageContent = document.getElementById("page-content");
	const headerContents = document.getElementById("header-contents");
	const coverImage = document.getElementById("cover-image");
	// const introDarkBar = document.getElementById("intro-dark-bar");

	if (!coverImage || !pageContent || !headerContents) {
		console.warn("Splash animation aborted — missing DOM elements.");
		return;
	}

	coverImage.style.opacity = "0";

	// Set initial bottom margin dynamically
	// Temporarily disable transition
	headerContents.style.transition = "none";
	// Apply initial layout
	applyBottomOffsetToElement(headerContents, headerContents, 2); // push with extra 5vh
	// Force layout to apply immediately
	void headerContents.offsetHeight;
	// Re-enable transition (lets animations work from now on)
	headerContents.style.transition = "";

	// c•onsole.log("after setting marginBottom : " + headerContents.style.marginBottom);

	// Begin fade and margin collapse
	setTimeout(() => {
		coverImage.remove();
		document.getElementById("page-content")?.classList.add("show");

		// unlock scrolling freeze
		setTimeout(() => {
			document.documentElement.classList.remove("scroll-lock");
			document.body.classList.remove("scroll-lock");
		}, 300);

		// Animate in the header
		headerContents.classList.add("show");

		// Animate the bottom margin to 0
		requestAnimationFrame(() => {
			headerContents.style.marginBottom = "0";
			// c•onsole.log("requestAnimationFrame marginBottom: " +headerContents.style.marginBottom);
		});
	}, 1000);

	// c•onsole.log("after animation marginBottom : " + headerContents.style.marginBottom);
}

function applyBottomOffsetToElement(
	element,
	referenceElement,
	extraOffsetVH = 2
) {
	// c•onsole.log("function applyBottomOffsetToElement");
	const windowHeight = window.innerHeight;
	const referenceHeight = referenceElement.offsetHeight;
	const offset = windowHeight * (1 + extraOffsetVH / 100) - referenceHeight;
	element.style.marginBottom = `${offset}px`;
}
