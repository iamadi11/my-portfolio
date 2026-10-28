// JavaScript budgets, measured in the browser as the compressed bytes of script bodies (response headers excluded).
// First-load: every script fetched before the page's load event. `/` keeps CLAUDE.md §10.4's ≤ 120 kB; the course
// has its own budget (owner, 2026-10-28; docs/system-design/COURSE_STATE.md): ≤ 150 kB first-load per /learn route,
// and ≤ 400 kB more fetched on demand while the reader scrolls the whole page (figures, and any library they need,
// load in their own chunks as they near the viewport). Prefetches by next/link are not counted.
const { chromium } = require('playwright');

const { BASE } = require('./config.cjs');

const ROUTES = ['/', '/learn', '/learn/web-request', '/learn/client-server', '/learn/ip-and-ports'];
const isCourse = (route) => route.startsWith('/learn');
const FIRST_LOAD = (route) => (isCourse(route) ? 150_000 : 120_000);
const ON_DEMAND = 400_000;

/** Counts script body bytes on a page: `first` before `markLoaded()`, `later` after. */
async function scriptMeter(page) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Network.enable');
    const m = { first: 0, later: 0, firstCount: 0, count: 0, loaded: false };
    const headers = new Map();
    cdp.on('Network.responseReceived', (e) => {
        if (e.type === 'Script') headers.set(e.requestId, e.response.encodedDataLength);
    });
    cdp.on('Network.loadingFinished', (e) => {
        if (!headers.has(e.requestId)) return;
        const body = e.encodedDataLength - headers.get(e.requestId);
        m.count++;
        if (m.loaded) {
            m.later += body;
        } else {
            m.first += body;
            m.firstCount++;
        }
    });
    return m;
}

/** Scrolls the whole page in steps so every lazy figure nears the viewport and loads. */
async function scrollAll(page) {
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y <= height; y += 600) {
        await page.evaluate((top) => window.scrollTo(0, top), y);
        await page.waitForTimeout(120);
    }
    await page.waitForLoadState('networkidle');
}

const report = (ok, route, what, bytes, scripts, limit) => {
    console.log(
        `${ok ? 'PASS' : 'FAIL'}  ${route} ${what} JS ${(bytes / 1000).toFixed(1)} kB (${scripts} scripts) ≤ ${limit / 1000} kB`
    );
    return ok;
};

/** Measures one route; returns the number of failed checks. */
async function measure(browser, route) {
    const page = await browser.newPage();
    const m = await scriptMeter(page);
    await page.goto(BASE + route, { waitUntil: 'load' });
    m.loaded = true;
    let failed = 0;
    const limit = FIRST_LOAD(route);
    if (!report(m.first > 0 && m.first <= limit, route, 'first-load', m.first, m.firstCount, limit)) failed++;
    if (isCourse(route)) {
        await scrollAll(page);
        const lazy = m.count - m.firstCount;
        if (!report(m.later <= ON_DEMAND, route, 'on-demand', m.later, lazy, ON_DEMAND)) failed++;
    }
    await page.close();
    return failed;
}

(async () => {
    const browser = await chromium.launch();
    let failed = 0;
    for (const route of ROUTES) failed += await measure(browser, route);
    await browser.close();
    const checks = ROUTES.length + ROUTES.filter(isCourse).length;
    console.log(`\n${checks - failed}/${checks} passed`);
    process.exit(failed ? 1 : 0);
})();
