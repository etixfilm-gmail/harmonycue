/* eslint-env browser */

// hc-static-js-sampler.js gets loaded by initJS.injectScriptsParallel
// as part of hc-static-js/hc-static-js-init.js
mmm(`✅ LOADED hc-static-js-sampler.js`);

const samplerJS = (window.samplerJS = window.samplerJS || {});

/**
 * Attach event listener to #sampler-section after it is in the DOM
 */
samplerJS.setupSamplerEvents = function () {
	zzz();
	utilsJS.waitForElement(`#sampler-section`).then((section) => {
		// c•onsole.log(`🎯 Attaching sampler play-start listener`);

		section.addEventListener(`play-start`, (event) => {
			eRegistryJS.register(event);

			// xxx(event);
			const activePlayer = event.target;
			activePlayer.samplerTimelineSlider.classList.add(`on`);

			section.querySelectorAll(`audio-player`).forEach((player) => {
				if (
					player !== activePlayer &&
					player.samplerTimelineSlider.classList.contains(`on`)
				) {
					player.samplerTimelineSlider.classList.remove(`on`);
				}

				if (
					player !== activePlayer &&
					player.isPlaying?.() &&
					typeof player.resetPlayBtn === `function`
				) {
					player.togglePlay?.();
					player.resetPlayBtn();
				}
			});
		});
	});
};

samplerJS.init = async function () {
	//z•zz();
	mmm("🎬 Starting samplerJS.init()");
	// Optionally call post-injection handlers
	if (samplerJS?.setupSamplerEvents) samplerJS.setupSamplerEvents();
};

{
	class AudioPlayer extends HTMLElement {
		playing = false;
		volume = 1;
		prevVolume = 1;
		initialized = false;
		barWidth = 3;
		barGap = 1;
		bufferPercentage = 75;
		nonAudioAttributes = new Set([
			`title`,
			`bar-width`,
			`bar-gap`,
			`buffer-percentage`,
		]);

		constructor() {
			super();
		}

		connectedCallback() {
			// c•onsole.log(`connectedCallback() {`);
			// c•onsole.log(`this.initialized ${this.initialized}`);
			if (!this.initialized) {
				this.render();
				this.initialized = true;
			}
		}

		static get observedAttributes() {
			return [
				// audio tag attributes
				// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio
				`src`,
				`muted`,
				`crossorigin`,
				`loop`,
				`preload`,
				`autoplay`,
				// the name of the audio
				`title`,
				// the size of the frequency bar
				`bar-width`,
				// the size of the gap between the bars
				`bar-gap`,
				// the percentage of the frequency buffer data to represent
				// if the dataArray contains 1024 data points only a percentage of data will
				// be used to draw on the canvas
				`buffer-percentage`,
			];
		}

		async attributeChangedCallback(name, oldValue, newValue) {
			switch (name) {
				case `src`:
					this.initialized = false;
					// c•onsole.log(`attributeChangedCallback this.render()`);
					this.render();
					this.initializeAudio();
					break;
				case `muted`:
					this.toggleMute(Boolean(this.audio?.getAttribute(`muted`)));
					break;
				case `title`:
					this.samplerAudioName.textContent = newValue;
					break;
				case `bar-width`:
					this.barWidth = Number(newValue) || 3;
					break;
				case `bar-gap`:
					this.barGap = Number(newValue) || 1;
					break;
				case `buffer-percentage`:
					this.bufferPercentage = Number(newValue) || 75;
					break;
				default:
			}

			this.updateAudioAttributes(name, newValue);
		}

		updateAudioAttributes(name, value) {
			// c•onsole.log(`this.attributes.getNamedItem: ` + name + `: ` + this.attributes.getNamedItem(name).value );
			if (!this.audio || this.nonAudioAttributes.has(name)) return;

			// if the attribute was explicitly set on the audio-player tag
			// set it otherwise remove it
			if (this.attributes.getNamedItem(name)) {
				this.audio.setAttribute(name, value ?? ``);
			} else {
				this.audio.removeAttribute(name);
			}
		}

		initializeAudio() {
			if (this.initialized) return;

			this.initialized = true;
			this.classList.add(`sample-audio-player`);
			this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
			this.gainNode = this.audioCtx.createGain();
			this.analyserNode = this.audioCtx.createAnalyser();

			this.track = this.audioCtx.createMediaElementSource(this.audio);

			this.analyserNode.fftSize = 2048;
			this.bufferLength = this.analyserNode.frequencyBinCount;
			this.dataArray = new Uint8Array(this.bufferLength);
			this.analyserNode.getByteFrequencyData(this.dataArray);

			this.track
				.connect(this.gainNode)
				.connect(this.analyserNode)
				.connect(this.audioCtx.destination);

			this.changeVolume();
		}

		clearCanvas() {
			this.samplerCanvasCtx.clearRect(
				0,
				0,
				this.samplerCanvas.width,
				this.samplerCanvas.height
			);
			this.samplerCanvasCtx.fillStyle = `rgba(0, 0, 0, 0)`;
			this.samplerCanvasCtx.fillRect(
				0,
				0,
				this.samplerCanvas.width,
				this.samplerCanvas.height
			);
			// this.// c•onsole.log.value = 0;
		}

		updateFrequency() {
			if (!this.playing || !this.samplerCanvasCtx || !this.analyserNode) return;
			this.analyserNode.getByteFrequencyData(this.dataArray);

			this.samplerCanvasCtx.clearRect(
				0,
				0,
				this.samplerCanvas.width,
				this.samplerCanvas.height
			);
			this.samplerCanvasCtx.fillStyle = `rgba(0, 0, 0, 0)`;
			this.samplerCanvasCtx.fillRect(
				0,
				0,
				this.samplerCanvas.width,
				this.samplerCanvas.height
			);

			const barCount =
				this.samplerCanvas.width / (this.barWidth + this.barGap) - this.barGap;
			const bufferSize = (this.bufferLength * this.bufferPercentage) / 100;
			let x = 0;

			// this is a loss representation of the frequency
			// some data are lost to fit the size of the canvas
			for (let i = 0; i < barCount; i++) {
				// get percentage of i value
				const iPerc = Math.round((i * 100) / barCount);
				// what the i percentage maps to in the frequency data
				const pos = Math.round((bufferSize * iPerc) / 100);
				const frequency = Math.pow(this.dataArray[pos] / 16, 2);
				// frequency value in percentage
				const frequencyPerc = (frequency * 100) / 255;
				// frequency percentage value in pixel in relation to the canvas height
				// const barHeight = (frequencyPerc * this.samplerCanvas.height) / 100;
				const barHeight = Math.max(
					2.25,
					(frequencyPerc * this.samplerCanvas.height) / 100
				);
				// flip the height so the bar is drawn from the bottom
				// const y = this.samplerCanvas.height - barHeight;
				const yLo = (this.samplerCanvas.height - barHeight) * 0.5;
				// barHue as a function of frequencyPerc, 200 < barHue
				const barHue = 200 + frequencyPerc; // + frequencyPerc * 50;
				this.samplerCanvasCtx.fillStyle = `hsl(${barHue}, 100%, 70%, 1.0)`;
				// this.samplerCanvasCtx.fillStyle = `rgba(${frequency}, 255, 100)`;
				this.samplerCanvasCtx.fillRect(x, yLo, this.barWidth, barHeight);
				// this.samplerCanvasCtx.fillRect(x, y, this.barWidth, barHeight);

				x += this.barWidth + this.barGap;
			}

			requestAnimationFrame(this.updateFrequency.bind(this));
		}

		animateTimeline() {
			// Lazy initialize if missing
			if (!this.samplerTimelineSlider) {
				// c•onsole.log(`Lazy initialize samplerTimelineSlider`);
				this.samplerTimelineSlider = this.querySelector(
					`.sampler-timeline-slider`
				);
			}
			if (!this.samplerCanvas) {
				// c•onsole.log(`Lazy initialize samplerCanvas`);
				this.samplerCanvas = this.querySelector(`.sampler-canvas`);
			}
			if (this.isDraggingTimeline) return;
			if (
				!this.playing ||
				!this.audioCtx ||
				!this.audio.duration ||
				!this.samplerTimelineSlider ||
				!this.samplerCanvas
			) {
				return;
			}
			const contextTime = this.audioCtx.getOutputTimestamp().contextTime;
			const elapsed = contextTime - this.audio.startTime;
			const progress = Math.max(0, Math.min(elapsed / this.audio.duration, 1));

			const canvasWidth = this.samplerCanvas.clientWidth;
			const x = canvasWidth * progress;

			this.samplerTimelineSlider.style.left = `${x}px`;
			// c•onsole.log(
			// 	`animateTimeline() this.samplerTimelineSlider.style.left = ${x}`
			// );
			requestAnimationFrame(this.animateTimeline.bind(this));
		}

		attachEvents() {
			// c•onsole.log(`attachEvents()`);
			// c•onsole.log(`✅ attachEvents() finished for`, this.id);
			// c•onsole.log(`✅ attachEvents() running after DOM`);
			// c•onsole.log(`📎 samplerBtn is:`, this.querySelector(`.sampler-btn`));

			this.samplerVolumeSlider.parentNode.addEventListener(
				`click`,
				(event) => {
					eRegistryJS.register(event);
					if (event.target === this.samplerVolumeSlider.parentNode) {
						this.toggleMute();
					}
				},
				false
			);

			this.samplerVolumeSlider.addEventListener(
				`input`,
				this.changeVolume.bind(this),
				false
			);

			this.audio.addEventListener(`loadedmetadata`, (event) => {
				eRegistryJS.register(event);
				// this.// c•onsole.log.max = this.audio.duration;
				this.samplerDuration.textContent = this.getTimeString(
					this.audio.duration
				);
				this.updateAudioTime();
			});

			this.audio.addEventListener(`error`, (event) => {
				eRegistryJS.register(event);
				this.samplerAudioName.textContent = this.audio.error.message;
				this.samplerBtn.disabled = true;
			});

			this.audio.addEventListener(`timeupdate`, () => {
				// eRegistryJS.register(event);
				this.updateAudioTime(this.audio.currentTime);
			});

			this.audio.addEventListener(
				`ended`,
				(event) => {
					eRegistryJS.register(event);
					// c•onsole.log(`ended () => {}`);
					// c•onsole.log(`this.id: ` + this.id);
					this.playing = false;
					this.resetPlayBtn();
					this.samplerTimelineSlider.classList.remove(`on`);
					this.seekTo(0);
					this.audio.currentTime = 0;
				},
				false
			);

			this.audio.addEventListener(
				`pause`,
				(event) => {
					eRegistryJS.register(event);
					// c•onsole.log(`pause () => {}`);
					// c•onsole.log(`this.id: ` + this.id);
					this.playing = false;
					this.resetPlayBtn();
					this.clearCanvas();
				},
				false
			);

			this.audio.addEventListener(
				`play`,
				(event) => {
					eRegistryJS.register(event);
					// c•onsole.log(`play () => {}`);
					// c•onsole.log(`this.id: ` + this.id);
					if (!this.playing) {
						this.dispatchEvent(
							new CustomEvent(`play-start`, {
								bubbles: true,
								composed: true,
							})
						);
					}
					this.audio.startTime =
						this.audioCtx.currentTime - this.audio.currentTime;
					// c•onsole.log(`this.audio.startTime: ${this.audio.startTime}`);
					// this.samplerTimelineSlider.classList.add(`on`);
					this.playing = true;
					this.samplerBtn.style.backgroundImage = `url("/hc-static-images/hc-static-images-btn-blue.webp")`;
					this.samplerBtn.innerHTML = `<img class="sampler-btn-icon" alt="Play" src="/hc-static-images/hc-static-images-pause-fill.svg"/>`;
					this.samplerBtn.classList.add(`playing`);
					this.samplerBtn.classList.add(`playing`);
					this.animateTimeline();
					this.updateFrequency();
				},
				false
			);

			if (this.samplerBtn) {
				this.samplerBtn.addEventListener(`click`, this.togglePlay.bind(this));
				this.samplerBtn.addEventListener(`click`, (event) => {
					eRegistryJS.register(event);
					console.log(`🟢 sampler-btn was clicked`);
				});
			} else {
				console.log(`this.samplerBtn: ${this.samplerBtn}`);
			}

			if (this.samplerCanvasContainer) {
				this.samplerCanvasContainer.addEventListener(
					`pointerdown`,
					this.onProgressDragStart.bind(this)
				);
				this.samplerCanvasContainer.addEventListener(`pointerdown`, (event) => {
					eRegistryJS.register(event);
					// c•onsole.log(`👆 sampler-canvas-container was clicked`);
				});
			} else {
				// c•onsole.log(
				// 	`this.samplerCanvasContainer: ${this.samplerCanvasContainer}`
				// );
			}

			// c•onsole.log(`END attachEvents()`);
		}

		async togglePlay() {
			// c•onsole.log(`togglePlay()`);
			// c•onsole.log(`this.id: ` + this.id);
			// this.samplerTimelineSlider.classList.toggle(`on`);

			if (this.audioCtx.state === `suspended`) {
				// this.samplerTimelineSlider.classList.toggle(`on`);
				await this.audioCtx.resume();
			}

			if (this.playing) {
				this.audio.pause();
			} else {
				this.audio.play();
			}
		}

		getTimeString(time) {
			const secs = `${parseInt(`${time % 60}`, 10)}`.padStart(2, `0`);
			const min = parseInt(`${(time / 60) % 60}`, 10);
			const timeString =
				parseInt(`${(time / 60) % 60}`, 10) +
				`:` +
				`${parseInt(`${time % 60}`, 10)}`.padStart(2, `0`);
			// c•onsole.log(
			// 	`timeString:${timeString} ==> ` + timeString.replaceAll(`0`, `O`)
			// );
			return timeString.replaceAll(`0`, `O`);
		}

		isPlaying() {
			return this.playing;
		}

		resetPlayBtn() {
			this.samplerBtn.innerHTML = `<img class="sampler-btn-icon" alt="Play" src="/hc-static-images/hc-static-images-play-fill.svg"/>`;
			this.samplerBtn.style.backgroundImage = `url("/hc-static-images/hc-static-images-btn-off.webp")`;
			this.samplerBtn.classList.remove(`playing`);
			this.playing = false;
		}

		changeVolume() {
			this.volume = Number(this.samplerVolumeSlider.value);
			// c•onsole.log(`this.volume: ${this.volume}`);
			let altLevel = `Hi`;
			let iconLevel = `hi`;
			if (Number(this.volume) < 0.667) {
				altLevel = `Lo`;
				iconLevel = `lo`;
			} else {
				if (Number(this.volume) < 1.333) {
					altLevel = `Med`;
					iconLevel = `med`;
				}
			}

			if (this.gainNode) {
				this.gainNode.gain.value = this.volume;
			}

			if (
				this.querySelector(`.sampler-volume-icon`).alt != `Volume ${altLevel}`
			) {
				// c•onsole.log(`Volume icon changed to ${iconLevel}`);
				this.samplerVolumeIconBox.innerHTML = `<img class="sampler-volume-icon" src="/hc-static-images/hc-static-images-volume-${iconLevel}-fill.svg" alt="Volume ${altLevel}" />`;
			}
		}

		toggleMute(muted = null) {
			this.samplerVolumeSlider.value =
				muted || this.volume === 0 ? this.prevVolume : 0;
			this.changeVolume();
		}

		seekTo(value) {
			this.audio.currentTime = value;
		}

		updateTimeline() {
			if (
				!this.playing ||
				!this.audioCtx ||
				!this.audio.duration ||
				!this.samplerTimelineSlider ||
				!this.samplerCanvas
			)
				return;

			const contextTime = this.audioCtx.getOutputTimestamp().contextTime;
			const elapsed = contextTime - this.audio.startTime;
			const progress = Math.min(elapsed / this.audio.duration, 1);

			const canvasWidth = this.samplerCanvas.clientWidth;
			const x = canvasWidth * progress;

			this.samplerTimelineSlider.style.left = `${x}px`;
			// c•onsole.log(`samplerTimelineSlider.style.left = ${x}px`);

			if (this.playing) {
				requestAnimationFrame(this.updateTimeline.bind(this));
			}
		}

		updateAudioTime() {
			if (!this.audioCtx || !this.audio) return;

			this.samplerCurrentTime.textContent = this.getTimeString(
				this.audio.currentTime
			);
		}

		onProgressDragStart(event) {
			eRegistryJS.register(event);
			event.preventDefault();
			this.isDraggingTimeline = true;

			// Optional: pause animation during drag
			this.wasPlayingBeforeDrag = this.playing;
			this.playing = false;

			this.seekFromEvent(event); // jump to clicked position immediately
			this.samplerTimelineSlider.classList.add(`on`);

			document.addEventListener(`pointermove`, this.onProgressDragging);
			document.addEventListener(`pointerup`, this.onProgressDragEnd);
		}

		onProgressDragging = (event) => {
			// move type event, not registered
			if (!this.isDraggingTimeline) return;
			this.seekFromEvent(event);

			// const rect = this.samplerCanvasContainer.getBoundingClientRect();
			// const x = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
			// const percent = x / rect.width;
			// const newTime = percent * this.audio.duration;

			// this.audio.currentTime = newTime;
			// this.samplerTimelineSlider.style.left = `${x}px`;
		};

		onProgressDragEnd = (event) => {
			eRegistryJS.register(event);
			this.isDraggingTimeline = false;

			document.removeEventListener(`pointermove`, this.onProgressDragging);
			document.removeEventListener(`pointerup`, this.onProgressDragEnd);

			// Set accurate playback offset for animation loop

			this.audio.startTime =
				this.audioCtx.getOutputTimestamp().contextTime - this.audio.currentTime;

			// c•onsole.log(
			// 	`getOutputTimestamp().contextTime: ${this.audioCtx.getOutputTimestamp().contextTime})`
			// );
			// c•onsole.log(`this.audio.startTime: ${this.audio.startTime})`);
			// c•onsole.log(`onProgressDragEnd(event.clientX: ${event.clientX})`);
			// c•onsole.log(
			// 	`this.samplerTimelineSlider.style.left: ${this.samplerTimelineSlider.style.left})`
			// );
			// Resume animation if audio is playing
			if (this.wasPlayingBeforeDrag) {
				this.playing = true;
				this.animateTimeline();
				this.updateFrequency(); // Restart the canvas animation loop
			} else {
				// shut of progress line if it's back to zero
				if (this.samplerTimelineSlider.style.left === `0px`) {
					// c•onsole.log(`shut off samplerTimelineSlider`);
					this.samplerTimelineSlider.classList.remove(`on`);
				}
			}
		};

		seekFromEvent(event) {
			// c•onsole.log(`seekFromEvent(event.clientX: ${event.clientX})`);
			const rect = this.samplerCanvasContainer.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const percent = Math.min(Math.max(x / rect.width, 0), 1);
			// c•onsole.log(
			// 	`percent: ${percent} = clientX: ${x} / rect.width: ${rect.width}`
			// );
			const seekTime = percent * this.audio.duration;
			this.audio.currentTime = seekTime;

			// Move the progress line visually (optional redundancy)
			const pixelOffset = rect.width * percent;
			this.samplerTimelineSlider.style.left = `${pixelOffset}px`;
		}

		render() {
			// c•onsole.log(`render()... this.innerHTML =`);
			this.innerHTML = `
            <figure class="sampler-player">
              <figcaption class="sampler-audio-name font-3 font-light"></figcaption>
              <audio class="sampler-audio" style="display: none"></audio>
              <div class="sampler-line-1">
                <button class="sampler-btn">
                  <img class="sampler-btn-icon" src="/hc-static-images/hc-static-images-play-fill.svg" alt="Play" />
                </button>
                <div class="sampler-track-timeline">
                  <div class="sampler-canvas-container">
                    <canvas class="sampler-canvas"></canvas>
                    <div class="sampler-timeline-slider"></div>
                  </div>
			      <div class="sampler-time-display">
                    <span class="sampler-current-time">0:00</span>
                    <span class="sampler-duration">0:00</span>
                  </div>
                </div>
              </div>

		      <div class="sampler-line-2">
                <input class="sampler-volume-slider" type="range" min="0" max="2" step="0.01" value="${this.volume}">
			    <div class="sampler-volume-icon-box">
		          <img class="sampler-volume-icon" src="/hc-static-images/hc-static-images-volume-med-fill.svg" alt="Volume" />
                </div>
		      </div>
            </figure>
          `;
			this.audio = this.querySelector(`audio`);
			// if (window.PLATFORM.isMobile == null) {
			// 	window.PLATFORM.isMobile = isMobileDevice();
			// }
			this.audio.preload = window.PLATFORM.isMobile ? "none" : "metadata";

			this.figure = this.querySelector(`figure`);
			this.figcaption = this.querySelector(`figcaption`);
			this.samplerTimelineSlider = this.querySelector(
				`.sampler-timeline-slider`
			);
			this.samplerCanvasContainer = this.querySelector(
				`.sampler-canvas-container`
			);
			this.samplerCanvas = this.querySelector(`.sampler-canvas`);
			this.samplerBtn = this.querySelector(`.sampler-btn`);
			this.samplerBtnIcon = this.querySelector(`.sampler-btn-icon`);
			this.samplerAudioName = this.querySelector(`.sampler-audio-name`);
			this.samplerVolumeSlider = this.querySelector(`.sampler-volume-slider`);
			this.samplerVolumeIconBox = this.querySelector(
				`.sampler-volume-icon-box`
			);
			this.samplerCurrentTime = this.querySelector(`.sampler-current-time`);
			// this.// c•onsole.log = this.querySelector(`.// c•onsole.log`);
			this.samplerDuration = this.querySelector(`.sampler-duration`);
			this.samplerCanvasCtx = this.samplerCanvas.getContext(`2d`);
			// support retina display on canvas=`samplerCanvas` for a more crispy/HD look
			const scale = window.devicePixelRatio;
			this.samplerCanvas.width = Math.floor(this.samplerCanvas.width * scale);
			this.samplerCanvas.height = Math.floor(this.samplerCanvas.height * scale);
			this.samplerAudioName.textContent = this.attributes.getNamedItem(`src`)
				? (this.attributes.getNamedItem(`title`).value ?? `untitled`)
				: `No Audio Source Provided`;
			this.samplerVolumeSlider.value = this.volume;

			// if rendering or re-rendering all audio attributes need to be reset
			for (let i = 0; i < this.attributes.length; i++) {
				const attr = this.attributes[i];
				this.updateAudioAttributes(attr.name, attr.value);
			}

			requestAnimationFrame(() => {
				// c•onsole.log(`requestAnimationFrame - outer`);
				requestAnimationFrame(() => {
					this.samplerTrackTimeline = this.querySelector(
						`.sampler-track-timeline`
					);
					// c•onsole.log(`requestAnimationFrame - inner`);

					// c•onsole.log(
					// 	`this.querySelector(`.sampler-canvas`).clientWidth: ${this.querySelector(`.sampler-canvas`).clientWidth}`
					// );
					// c•onsole.log(
					// 	`this.querySelector(`.sampler-canvas`).style.width: ${this.querySelector(`.sampler-canvas`).style.width}`
					// );
					// c•onsole.log(
					// 	`this.querySelector(`.sampler-track-timeline`).clientWidth: ${this.querySelector(`.sampler-track-timeline`).clientWidth}`
					// );
					// c•onsole.log(
					// 	`this.querySelector(`.sampler-track-timeline`).style.width: ${this.querySelector(`.sampler-track-timeline`).style.width}`
					// );
					// c•onsole.log(
					// 	`this.samplerTrackTimeline?.clientWidth: ${this.samplerTrackTimeline?.clientWidth}`
					// );
					// c•onsole.log(
					// 	`this.samplerTrackTimeline?.style.width: ${this.samplerTrackTimeline?.style.width}`
					// );
					// should be 300+
					// c•onsole.log(
					// 	`🎯 FINAL timeline width:`,
					// 	this.samplerTrackTimeline?.clientWidth
					// );
					// c•onsole.log(
					// 	`🎯 FINAL canvas width:`,
					// 	this.samplerCanvas?.clientWidth
					// );
				});
			});

			this.attachEvents();
		}
	}

	customElements.define(`audio-player`, AudioPlayer);
}

const el = document.getElementById(`sampler-section`);
// c•onsole.log(`sampler-section:`, el ? el : `NOT FOUND`);
