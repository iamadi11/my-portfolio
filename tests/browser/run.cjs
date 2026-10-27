// Runs every browser suite in this folder, one after another, against LEARN_BASE_URL (default http://localhost:3201).
// Exits non-zero if any suite fails. Usage: `npm run test:browser` (see README.md here).
const { spawnSync } = require('child_process');
const path = require('path');

const { BASE } = require('./config.cjs');

const SUITES = ['web-request.cjs', 'client-server.cjs', 'ip-and-ports.cjs', 'js-budget.cjs'];

(async () => {
    try {
        const res = await fetch(BASE + '/learn');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
        console.error(
            `No build is answering at ${BASE} (${e.message}). Start one first: npm run build && npm run start -- -p 3201`
        );
        process.exit(2);
    }
    const summary = [];
    for (const suite of SUITES) {
        console.log(`\n=== ${suite} ===`);
        const r = spawnSync(process.execPath, [path.join(__dirname, suite)], { stdio: 'inherit' });
        summary.push(`${r.status === 0 ? 'PASS' : 'FAIL'}  ${suite}`);
    }
    console.log(`\n=== summary ===\n${summary.join('\n')}`);
    process.exit(summary.some((s) => s.startsWith('FAIL')) ? 1 : 0);
})();
