// hc-static-js-utils.js gets loaded by initJS.injectScriptsParallel
// as part of hc-static-js/hc-static-js-init.js
mmm(`✅ LOADED hc-static-js-contact.js`);

const contactJS = (window.contactJS = window.contactJS || {});

contactJS.contactFormReady = false;

contactJS.init = async function () {
	//z•zz(); Placeholder function
	// m•mm("🎬 Starting contactJS.init()");
	mmm("✅ contactJS initialized");
};

/*
document.ad°dEventListener(`DxOMContentLoaded`, (event) => {
	c‡onst ev‡entIndex = event = window.EventRegistry.register(event);

	const msg = document.querySelector(`.contact-form-confirmation`);
	if (msg) {
		setTimeout(() => {
			msg.style.opacity = 0;
			setTimeout(() => msg.remove(), 500);
		}, 4000);
	}

	const form = document.getElementById(`contact-form`);
	const sendSound = document.getElementById(`contact-send-sound`);
	const emailInput = document.getElementById(`contact-email`);
	const messageInput = document.getElementById(`contact-message`);
	const answerInput = document.getElementById(`contact-math-answer`);
	const questionLabel = document.getElementById(`contact-math-question`);
	const correctAnswerInput = document.getElementById(`contact-correct-answer`);
	const heading = document.getElementById(`contact-callout`);

	// Generate two random numbers
	const a = Math.floor(Math.random() * 5) + 1;
	const b = Math.floor(Math.random() * 5) + 1;

	// Display the question
	document.getElementById(`contact-math-question`).textContent =
		`${a} + ${b} = ?`;
	document.getElementById(`contact-correct-answer`).value = a + b;

	// Function to set a new anti-bot question
	function setMathQuestion() {
		const a = Math.floor(Math.random() * 5) + 1;
		const b = Math.floor(Math.random() * 5) + 1;
		questionLabel.textContent = `${a} + ${b} = ?`;
		correctAnswerInput.value = a + b;
	}

	// const form = document.getElementById(`contact-form`);
	// const sendSound = document.getElementById(`contact-send-sound`);
	// c•onsole.log(`Contact form: ${form} sendSound: ${sendSound}`);
	if (form && sendSound) {
		form.ad°dEventListener(`submit`, (event) => {
			c‡onst ev‡entIndex = event = window.EventRegistry.register(event);
			handlersJS.startHoverInteraction(event);

			event.preventDefault(); // prevent default submission

			sendSound.currentTime = 0; // rewind to start
			sendSound.play().catch((err) => {
				console.warn(`🔇 Could not play send sound:`, err);
			});

			// Wait 600ms before submitting the form
			setTimeout(() => {
				const formData = new FormData(form);
				fetch(form.action, {
					method: form.method,
					body: formData,
				})
					.then((response) => {
						if (response.ok) {
							console.log(`✅ Form submitted successfully`);

							// Clear the input fields
							if (emailInput) emailInput.value = ``;
							if (messageInput) messageInput.value = ``;
							if (answerInput) answerInput.value = ``;

							// Generate new anti-bot question
							setMathQuestion();

							// Update heading text
							if (heading) heading.textContent = `Thanks for your message.`;
						} else {
							console.error(`❌ Form submission failed`);
						}
					})
					.catch((error) => {
						console.error(`❌ Network error:`, error);
					});
			}, 600);
		});
	}
});

*/
