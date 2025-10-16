# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HarmonyCue.com is a choral rehearsal tracks demo web application. It's a single-page application (SPA) with server-side rendering that provides an interactive audio mixing interface ("multimixer") and audio sampler for choral music tracks.

## Critical Requirements

**Cross-Device Compatibility:**
The application MUST work on both desktop and mobile devices. All UI interactions must support:
- **Mouse events** (desktop: click, mousedown, mouseup, mousemove, etc.)
- **Touch events** (mobile: touchstart, touchend, touchmove, etc.)

When implementing or modifying interactive UI elements, always ensure dual event support. The `window.PLATFORM` object (defined in hc-static-js-init.js) provides device detection:
```javascript
window.PLATFORM.isMobile    // true if mobile device
window.PLATFORM.isIOS       // true if iOS device
window.PLATFORM.isAndroid   // true if Android device
window.PLATFORM.supportsTouch // true if touch supported
```

Example pattern for dual event handling:
```javascript
element.addEventListener('mousedown', handler);
element.addEventListener('touchstart', handler);
```

**Web Audio API & Browser Compatibility:**
The audio UI relies heavily on the Web Audio API for multi-track mixing and playback. All audio-related features and controls MUST be tested across:
- **Safari** (desktop and iOS) - Note: iOS Safari has strict autoplay policies
- **Chrome** (desktop and Android)
- **Firefox** (desktop)

Audio playback requires user interaction to unlock the audio context on mobile browsers. Be aware of browser-specific quirks in Web Audio API implementations.

## Development Commands

### Running the Application
```bash
npm start              # Start production server
npm run dev            # Start dev server with auto-restart (ignores feedback.json)
npm run dev:watch      # Start dev server + browser-sync proxy
npm run restart        # Kill existing server process and restart
npm run stop           # Stop the running server
```

### Code Quality
```bash
npx eslint .           # Run ESLint on all files
npx prettier --write . # Format all files with Prettier
```

The server runs on `PORT` environment variable (default: 3000) and binds to `HOST` (default: 0.0.0.0) for deployment compatibility.

## Architecture

### Server-Side (Node.js/Express)

**Entry Point:** `server.js`
- Express server with EJS templating
- Uses cookie-session for session management
- Serves static files from `hc-static/` with cache control for images (1 year max-age)
- Routes defined in `hc-routes/`
- Business logic in `hc-services/`
- Data stored as JSON in `hc-data/`

**Key Routes:**
- `/` - Main loader page (renders `layout/main-loader.ejs`)
- `/full` - Deferred HTML content (renders `layout/deferred-html.ejs`)
- `/contact` - POST endpoint for contact form with nodemailer integration

**Services Pattern:**
Services in `hc-services/` are dependency-injected into routes:
```javascript
const params = { multimixerService, samplerService };
app.use(`/`, routes(params));
```

- `hc-services-multimixer.js` - Reads track data from `hc-data/hc-data-multimixer.json`
- `hc-services-sampler.js` - Reads sampler data from `hc-data/hc-data-sampler.json`

### Client-Side (Browser JavaScript)

**Loading Strategy:**
The app uses a two-stage loading approach:
1. `main-loader.ejs` - Initial loader with splash screen
2. Deferred HTML content loaded asynchronously via `/full` endpoint

**JavaScript Modules (in `hc-static/hc-static-js/`):**
All client-side JS uses global namespace pattern with `window.{name}JS` objects:

- `hc-static-js-init.js` - Entry point, manages loading sequence and initialization
- `hc-static-js-eventregistry.js` - Global event registry (eRegistryJS)
- `hc-static-js-state.js` - Global state management (stateJS)
- `hc-static-js-handlers.js` - Global event handlers (handlersJS)
- `hc-static-js-utils.js` - Utility functions (utilsJS)
- `hc-static-js-audiomanager.js` - Audio playback management
- `hc-static-js-multimixer.js` - Multi-track audio mixer interface
- `hc-static-js-sampler.js` - Audio sampler interface
- `hc-static-js-splash.js` - Splash screen logic
- `hc-static-js-explainer.js` - Explainer section logic
- `hc-static-js-contact.js` - Contact form logic
- `hc-static-js-lock.js` - UI locking mechanisms
- `hc-static-js-scripts.js` - Section-specific scripts
- `hc-static-js-debug.js` - Debug utilities

**Global Utilities:**
- `mmm()` - Debug logging function
- `zzz()` - Debug breakpoint function
- `window.PLATFORM` - Device detection object (frozen at init)

**Initialization Flow:**
1. `initJS.firstInit()` called on page load
2. `initJS.overseeLoadingAndInit()` orchestrates:
   - Inject stylesheets (ordered)
   - Inject scripts (parallel)
   - Load deferred HTML from `/full`
   - Wait for visual readiness
3. Each module's `.init()` method called in sequence

### View Structure (EJS Templates)

**Layout:**
- `hc-views/layout/main-loader.ejs` - Initial page shell
- `hc-views/layout/deferred-html.ejs` - Wrapper for deferred content

**Pages:** (in `hc-views/pages/`)
- `splash.ejs` - Landing splash screen
- `intro.ejs` - Introduction section
- `explainer.ejs` - Feature explanation
- `multimixer.ejs` - Audio mixer interface
- `sampler.ejs` - Audio sampler interface
- `contact.ejs` - Contact form
- `cover.ejs` - Cover page

**Partials:** (in `hc-views/partials/`)
- `header.ejs`
- `footer.ejs`

### Data Files (JSON in `hc-data/`)

- `hc-data-multimixer.json` - Track definitions with metadata (type, name, btnletter, presets)
- `hc-data-sampler.json` - Sampler audio clip definitions
- `hc-data-splash.json` - Splash screen configuration

### Static Assets

- `hc-static/hc-static-css/` - CSS stylesheets
- `hc-static/hc-static-js/` - JavaScript modules
- `hc-static/hc-static-images/` - Images (webp, jpg, png)
- `hc-static/hc-static-media/` - Audio files (mp3)
- `hc-static/static-fonts/` - Web fonts

## ESLint Configuration

The project uses flat config (`eslint.config.mjs`) with separate rules for:
- **Browser-side:** `hc-static/hc-static-js/**/*.js` - sourceType: "script", browser globals + custom namespace globals
- **Server-side:** `server.js`, `hc-routes/**/*.js`, `hc-services/**/*.js` - sourceType: "commonjs", node globals

Special rules:
- `no-redeclare: off` for files matching `hc-static-js-*.js` (allows namespace pattern)
- `no-empty: ["error", { allowEmptyCatch: true }]`

## Email Configuration

Contact form uses nodemailer with SMTP:
- Server: `secure302.inmotionhosting.com:465`
- Credentials: `process.env.EMAIL_USER` and `process.env.EMAIL_PASS`
- Sends to: `eric@harmonycue.com`
- Auto-reply from: `info@harmonycue.com`
- Includes honeypot field (`address`) and math CAPTCHA validation

## Deployment

Configured for Render deployment:
- Binds to `process.env.PORT || 3000`
- Binds to `process.env.HOST || "0.0.0.0"`
- `.gitignore` excludes: `node_modules/`, `.env`, `.DS_Store`, `*.log`, `feedback.json`
- GitHub Actions workflow in `.github/` for GitHub Pages deployment

## File Naming Convention

All project files use prefixed naming:
- `hc-routes/hc-routes-*.js`
- `hc-services/hc-services-*.js`
- `hc-static-js/hc-static-js-*.js`
- `hc-static-css/hc-static-css-*.css`
- `hc-static-images/hc-static-images-*.*`
- `hc-views/hc-views-*.ejs`
- `hc-data/hc-data-*.json`

This convention makes file purposes immediately clear and avoids naming conflicts.

## Key Patterns

### Service Module Pattern
```javascript
module.exports = {
  async getSomething() {
    const filePath = path.join(__dirname, `../hc-data/hc-data-name.json`);
    const data = await fs.readFile(filePath, `utf-8`);
    return JSON.parse(data);
  }
};
```

### Client-Side Namespace Pattern
```javascript
const nameJS = (window.nameJS = window.nameJS || {});

nameJS.init = function() {
  // initialization code
};

nameJS.someMethod = function() {
  // method code
};
```

### Route Module Pattern
```javascript
module.exports = ({ multimixerService, samplerService }) => {
  router.get(`/route`, async (req, res) => {
    const data = await multimixerService.getTracksList();
    res.render(`layout/template`, { data });
  });
  return router;
};
```

### Event Listener Management Pattern

The application uses a standardized, multi-layered system to track and control event listeners. This provides centralized listener management with gating/flags to enable/disable listeners dynamically.

**Adding Event Listeners:**
ALL event listeners must be added using `utilsJS.addListener()` instead of direct `addEventListener()` calls.

```javascript
utilsJS.addListener(eventArgs);
```

**eventArgs Object Structure:**
```javascript
const eventArgs = {
  DOMElement,      // The DOM element to attach the listener to
  eventType,       // Event type string (e.g., "click", "audiounlock", "pointerenter")
  fnCall,          // Named function reference (NOT anonymous)
  listenerFlags,   // Object containing boolean flags for this listener group
  flagKey          // Property name within listenerFlags to check
};
```

**Example eventArgs:**
```javascript
const eventArgs = {
  DOMElement: hoverArea,
  eventType: "audiounlock",
  fnCall: explainerJS.onUnlockTest,
  listenerFlags: explainerJS.hoverListenerFlags,
  flagKey: "audiounlock"
};

utilsJS.addListener(eventArgs);
```

**Note:** `eventType` and `flagKey` are currently redundant. This is a known issue to be cleaned up in the future.

**Listener Flags Pattern:**
Each namespace maintains its own listener flags object to gate event handlers:

```javascript
// Define listener flags for a namespace
somenamespaceJS.hoverListenerFlags = {
  audiounlock: false,
  pointerenter: false,
  pointerleave: false
  // etc...
};
```

**Event Handler Pattern with Registry:**
Every event handler function must:
1. Be a named function (not anonymous)
2. Register the event with `eRegistryJS.register()`
3. Track usage with `eRegistryJS.use()`
4. Check the listener flag before executing logic

```javascript
somenamespaceJS.fnName = function (event) {
  // Reference to the listener flag list
  const flags = somenamespaceJS.hoverListenerFlags;

  // Register this event in the global registry
  event = eRegistryJS.register(event);

  // Track which method is using this event
  eRegistryJS.use(event, "somenamespaceJS.fnName");

  // Check if this listener is allowed to execute
  if (!flags.audiounlock) return;

  // ... actual event handler logic ...
};
```

**Why This Pattern:**
- **Centralized tracking:** All events flow through the registry for debugging
- **Dynamic control:** Enable/disable listeners by toggling flags
- **Named functions:** Easier debugging and stack traces
- **Consistency:** Uniform approach across the entire codebase
