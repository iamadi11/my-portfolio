// First-load JavaScript budget (CLAUDE.md §10.4: ≤ 120 kB per route), measured in the browser: the compressed bytes
// of every script body fetched before the page's load event (response headers excluded). Later prefetches by
// next/link are not first-load JS and are not counted.
const { chromium } = require('playwright');

const { BASE } = require('./config.cjs');

const BUDGET_BYTES = 120_000;
const ROUTES = ['/', '/learn', '/learn/web-request', '/learn/client-server'];

(async () => {
    const browser = await chromium.launch();
    let failed = 0;
    for (const route of ROUTES) {
        const page = await browser.newPage();
        const cdp = await page.context().newCDPSession(page);
        await cdp.send('Network.enable');
        let bytes = 0;
        let done = false;
        const headerBytes = new Map();
        cdp.on('Network.responseReceived', (e) => {
            if (e.type === 'Script') headerBytes.set(e.requestId, e.response.encodedDataLength);
        });
        cdp.on('Network.loadingFinished', (e) => {
            if (!done && headerBytes.has(e.requestId))
                bytes += e.encodedDataLength - headerBytes.get(e.requestId);
        });
        await page.goto(BASE + route, { waitUntil: 'load' });
        done = true;
        const ok = bytes > 0 && bytes <= BUDGET_BYTES;
        if (!ok) failed++;
        console.log(
            `${ok ? 'PASS' : 'FAIL'}  ${route} first-load JS ${(bytes / 1000).toFixed(1)} kB (${headerBytes.size} scripts) ≤ ${BUDGET_BYTES / 1000} kB`
        );
        await page.close();
    }
    await browser.close();
    console.log(`\n${ROUTES.length - failed}/${ROUTES.length} passed`);
    process.exit(failed ? 1 : 0);
})();
