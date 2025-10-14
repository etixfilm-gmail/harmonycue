PROJECT CONTEXT

- Single-page EJS app; sections are namespaced (e.g., window.splashJS, window.explainerJS, window.multimixerJS, window.stateJS, window.utilsJS, window.eventRegistryJS, window.lockJS, etc.).
- DO NOT rename existing properties or functions. Prefer adapters/shims.
- Assume Web Audio API is already initialized by init flow; respect existing unlock logic.
- Respect CSS, HTML structure, and responsive helpers already in the repo.

CONTRACT (HARD RULES)

1. Only use these namespaces: window.stateJS, utilsJS, splashJS, explainerJS, samplerJS, multimixerJS, eventRegistryJS, lockJS, initJS. If you think a new helper is needed, put it under utilsJS and call it via utilsJS.newHelperName().
2. Do not add global variables. Do not change function signatures unless explicitly requested.
3. If you must touch other sections, do so through exported methods only (no DOM queries into another section’s internals).
4. Prefer small pure functions; no side effects during import.
5. Keep event wiring centralized: register through eventRegistryJS where applicable.

OUTPUT FORMAT (STRICT)
A) Summary: 3–7 bullets explaining the change and why it’s safe.
B) Touchpoints: list all existing functions you call (by namespace) and all DOM ids/classes you use.
C) Patch: Unified diff only (no full files). Include paths like hc-static-js-_.js or hc-views/pages/_.ejs.
D) Backward-compat: Note any shims you added (e.g., alias oldProp → newProp).
E) Tests: 3 quick manual checks (copy-paste steps) I can run in the browser console.
