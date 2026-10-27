// Shared settings for the browser suites in this folder (see README.md here).
/** axe-core's script (its `source` export) from the pinned devDependency, injected into each page under test. */
const AXE = require('axe-core').source;
const fs = require('fs');
const path = require('path');

/** The production build under test. Start it first: `npm run build && npm run start -- -p 3201`. */
const BASE = (process.env.LEARN_BASE_URL || 'http://localhost:3201').replace(/\/$/, '');

/** Screenshots for reading by eye; git-ignored. */
const OUT = path.join(__dirname, '..', '..', 'test-results', 'browser');
fs.mkdirSync(OUT, { recursive: true });

/** The six device sizes CLAUDE.md §10.5 requires. */
const SIZES = [
    [375, 812],
    [402, 874],
    [768, 1024],
    [1280, 800],
    [1440, 900],
    [1920, 1080],
];

/** Collects a page's console errors and uncaught exceptions; read the array after the page has been used. */
function pageErrors(page) {
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(String(e)));
    return errors;
}

module.exports = { BASE, OUT, AXE, SIZES, pageErrors };
