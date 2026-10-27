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

module.exports = { BASE, OUT, AXE, SIZES };
