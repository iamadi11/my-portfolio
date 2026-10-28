// Browser checks for /learn/ip-and-ports (Chapter 3) and the routes it touches, against a production build.
// Run with `npm run test:browser` (see README.md in this folder).
const path = require('path');
const { chromium } = require('playwright');

const { AXE, BASE, OUT, SIZES, pageErrors } = require('./config.cjs');

const ROUTE = '/learn/ip-and-ports';
const results = [];
const log = (name, ok, detail = '') => {
    results.push({ name, ok });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};
const axeRun = async (page) => {
    await page.addScriptTag({ content: AXE });
    return page.evaluate(() =>
        axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] })
    );
};
/** A fresh 1280 × 900 page on the chapter. */
async function open(browser) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + ROUTE, { waitUntil: 'networkidle' });
    return { ctx, page };
}
const fig = (page, n) => page.locator(`figure[aria-labelledby="fig${n}-h"]`);
/** Figs. 2 and 3 load as the reader nears them: scroll there and wait for the real figure (it has a Run button). */
async function reach(page, n) {
    await fig(page, n).scrollIntoViewIfNeeded();
    await fig(page, n).getByRole('button', { name: 'Run', exact: true }).waitFor({ timeout: 10000 });
}
/** Pick a radio by its group legend and its label (labels repeat across groups, e.g. "443"). */
const pick = (page, n, legend, name) =>
    fig(page, n)
        .locator('fieldset', { has: page.locator('legend', { hasText: legend }) })
        .getByRole('radio', { name, exact: typeof name === 'string' })
        .check();
const live = (page, n) => fig(page, n).locator('p.sr-only[aria-live=polite]').allTextContents();
/** Step a run to its end with Next (works with and without reduced motion). */
async function toEnd(page, n) {
    const next = fig(page, n).getByRole('button', { name: 'Next', exact: true });
    for (let i = 0; i < 40 && (await next.getAttribute('aria-disabled')) !== 'true'; i++) await next.click();
}
async function demux(page, { from, to = /this server/, proto, port, firewall = 'Off' }) {
    await pick(page, 2, 'From', from);
    await pick(page, 2, 'To address', to);
    await pick(page, 2, 'Protocol', proto);
    await pick(page, 2, 'To port', port);
    await pick(page, 2, 'Server firewall', firewall);
    await fig(page, 2).getByRole('button', { name: 'Run', exact: true }).click();
    await toEnd(page, 2);
    return fig(page, 2).locator('[data-result]').innerText();
}
async function network(page, { event, transport = 'UDP', service }) {
    await pick(page, 3, 'On the way', event);
    if (service) await pick(page, 3, 'R2–R4 needs', service);
    await pick(page, 3, 'Transport', transport);
    await fig(page, 3).getByRole('button', { name: 'Run', exact: true }).click();
    await toEnd(page, 3);
    const dd = fig(page, 3).locator('.ln-out dd');
    return {
        arrived: await dd.nth(0).innerText(),
        read: await dd.nth(1).innerText(),
        result: await fig(page, 3).locator('[data-result]').innerText(),
        table: await fig(page, 3).locator('table.ln-compare tbody').innerText(),
    };
}

// 1. Sizes: no horizontal scroll before and after runs, no console errors, screenshots of each figure.
async function section1(browser) {
    for (const [w, h] of SIZES) {
        const ctx = await browser.newContext({ viewport: { width: w, height: h } });
        const page = await ctx.newPage();
        const errors = pageErrors(page);
        await page.goto(BASE + ROUTE, { waitUntil: 'networkidle' });
        const over = () =>
            page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        const o1 = await over();
        await reach(page, 2);
        await demux(page, { from: /^50003/, proto: 'TCP', port: '443' });
        await reach(page, 3);
        await network(page, { event: 'Link R2–R4 fails', transport: 'TCP' });
        const o2 = await over();
        log(`${w}x${h} no horizontal scroll before and after runs`, o1 <= 0 && o2 <= 0, `${o1}px / ${o2}px`);
        log(`${w}x${h} no console errors`, errors.length === 0, errors.join(' | '));
        // The skip link waits just above the viewport; captures of tall figures would draw that strip, so hide it there.
        for (const n of [1, 2, 3])
            await fig(page, n).screenshot({
                path: path.join(OUT, `ip-${w}x${h}-fig${n}.png`),
                style: 'a[href="#main-content"] { visibility: hidden; }',
            });
        await ctx.close();
    }
}

// 2. axe WCAG A/AA at 375 and 1280: on load (answers open) and after both labs ran.
async function section2(browser) {
    for (const w of [375, 1280]) {
        const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
        const page = await ctx.newPage();
        await page.goto(BASE + ROUTE, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)));
        let r = await axeRun(page);
        log(
            `${w}px axe on load (answers open)`,
            r.violations.length === 0,
            r.violations.map((v) => `${v.id}: ${v.nodes[0]?.target}`).join(' | ') ||
                `${r.incomplete.length} need review`
        );
        await reach(page, 2);
        await demux(page, { from: /^50002/, proto: 'UDP', port: '9000', firewall: /^On/ });
        await reach(page, 3);
        await network(page, { event: 'R2–R4 congested', service: '3 ticks' });
        await fig(page, 3).locator('details summary').click();
        r = await axeRun(page);
        log(
            `${w}px axe after both labs ran`,
            r.violations.length === 0,
            r.violations.map((v) => `${v.id}: ${v.nodes[0]?.target}`).join(' | ') ||
                `${r.incomplete.length} need review`
        );
        await ctx.close();
    }
}

// 3. Lazy loading and Fig. 1 (explore, no script).
async function section3(browser) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await page.goto(BASE + ROUTE, { waitUntil: 'networkidle' });
    log(
        'Fig. 3 starts as its waiting card (its code is not loaded with the page)',
        /loads as you reach it/.test(await fig(page, 3).innerText()) &&
            (await fig(page, 3).getByRole('button', { name: 'Run' }).count()) === 0
    );
    await reach(page, 3);
    log(
        'Fig. 3 becomes the interactive figure when reached',
        (await fig(page, 3).locator('svg').count()) === 1
    );
    const roles = {
        Name: /What we seek/,
        Address: /Which machine/,
        Protocol: /Which transport/,
        Port: /Which program/,
        Program: /Who receives it/,
    };
    for (const [label, re] of Object.entries(roles)) {
        await fig(page, 1).getByRole('radio', { name: label, exact: true }).check();
        await page.waitForTimeout(300); // the 200 ms stroke transition
        const shown = await fig(page, 1).locator('.ln-role:visible').allInnerTexts();
        const heavy = await fig(page, 1).evaluate(
            (f, part) =>
                [...f.querySelectorAll(`[data-part="${part}"]`)].filter((el) => {
                    const node = el.tagName === 'g' ? el.querySelector('rect') : el;
                    return node && parseFloat(getComputedStyle(node).strokeWidth) >= 2.3;
                }).length,
            label.toLowerCase()
        );
        log(
            `Fig. 1: ${label} shows its role and draws its part heavy`,
            shown.length === 1 && re.test(shown[0]) && heavy >= 1,
            `${heavy} heavy`
        );
    }
    await ctx.close();
}

// 4. No answer leak before Run, nothing before the run ends, and a change after a run clears it.
async function section4(browser) {
    const { ctx, page } = await open(browser);
    await reach(page, 2);
    await reach(page, 3);
    const text = (n) =>
        page.evaluate((k) => {
            const c = document.querySelector(`figure[aria-labelledby="fig${k}-h"]`).cloneNode(true);
            c.querySelectorAll('.ln-seg').forEach((el) => el.remove());
            return c.textContent;
        }, n);
    log(
        'Fig. 2 on load: no outcome, no reply, no verdict, no steps',
        !/Sender gets back|right\.|not quite|Step 1/.test(await text(2))
    );
    log(
        'Fig. 3 on load: no reads, no verdict, no comparison',
        !/has read|right\.|not quite|Last read|Same network/.test(await text(3))
    );
    log(
        'live regions empty on load',
        [...(await live(page, 2)), ...(await live(page, 3))].every((t) => t === '')
    );
    await pick(page, 3, 'On the way', 'Link R2–R4 fails');
    await fig(page, 3).getByRole('button', { name: 'Run', exact: true }).click();
    await fig(page, 3).getByRole('button', { name: 'Pause' }).click();
    log(
        'Fig. 3 mid-run: the outcome and comparison wait for the end of the run',
        (await fig(page, 3).locator('[data-result]').count()) === 0 &&
            (await fig(page, 3).locator('table.ln-compare').count()) === 0 &&
            (await live(page, 3))[0] === ''
    );
    await toEnd(page, 3);
    log(
        'Fig. 3 at the end: the outcome appears',
        /Some missing\./.test(await fig(page, 3).locator('[data-result]').innerText())
    );
    await pick(page, 3, 'Transport', 'TCP');
    log(
        'Fig. 3: changing an input after a run clears the result and the live text',
        (await fig(page, 3).locator('[data-result]').count()) === 0 &&
            (await live(page, 3)).every((t) => t === '')
    );
    await demux(page, { from: /^50001/, proto: 'TCP', port: '443' });
    await pick(page, 2, 'Protocol', 'UDP');
    log(
        'Fig. 2: changing the packet after a run clears the result, the steps and the highlight',
        (await fig(page, 2).locator('.ln-steps').count()) === 0 &&
            (await live(page, 2)).every((t) => t === '') &&
            (await fig(page, 2).locator('svg .ln-node-on').count()) === 0
    );
    await ctx.close();
}

// 5. Every outcome agrees with the models, and the numbers the page quotes.
async function section5(browser) {
    const { ctx, page } = await open(browser);
    await reach(page, 2);
    const cases = [
        [{ from: /^50001/, proto: 'TCP', port: '443' }, /^Web server, connection 1\./],
        [{ from: /^50002/, proto: 'TCP', port: '443' }, /^Web server, connection 2\./],
        [{ from: /^50003/, proto: 'TCP', port: '443' }, /^Web server, as a new connection\./],
        [{ from: /^50001/, proto: 'UDP', port: '8125' }, /^Metrics collector\./],
        [{ from: /^50003/, proto: 'UDP', port: '8125' }, /^Metrics collector\./],
        [{ from: /^50001/, proto: 'UDP', port: '443' }, /^Nobody: ICMP Port Unreachable comes back\./],
        [{ from: /^50001/, proto: 'TCP', port: '9000' }, /^Nobody: a TCP reset comes back\./],
        [
            { from: /^50001/, proto: 'TCP', port: '9000', firewall: /^On/ },
            /^Dropped by the firewall: nothing comes back\./,
        ],
        [{ from: /^50002/, proto: 'TCP', port: '443', firewall: /^On/ }, /^Web server, connection 2\./],
        [
            { from: /^50001/, to: /another machine/, proto: 'TCP', port: '443' },
            /^Never reaches this server\./,
        ],
    ];
    for (const [packet, want] of cases) {
        const got = await demux(page, packet);
        log(
            `Fig. 2: ${packet.proto} ${packet.port} from ${packet.from.source}${packet.firewall ? ', firewall on' : ''}${packet.to ? ', other address' : ''}`,
            want.test(got),
            got.slice(0, 80)
        );
    }
    await pick(page, 2, 'Predict first', 'Web server, connection 1');
    let got = await demux(page, { from: /^50002/, proto: 'TCP', port: '443' });
    log('Fig. 2: a wrong prediction says "not quite"', /not quite/.test(got), got);
    await pick(page, 2, 'Predict first', 'Web server, connection 2');
    got = await demux(page, { from: /^50002/, proto: 'TCP', port: '443' });
    log('Fig. 2: a right prediction says "right"', /right\./.test(got), got);
    const stages = await fig(page, 2).locator('.ln-steps li strong').allInnerTexts();
    await demux(page, { from: /^50001/, proto: 'UDP', port: '443', firewall: /^On/ });
    const fw = await fig(page, 2).locator('.ln-steps li strong').allInnerTexts();
    log(
        'Fig. 2: four stages for a delivered packet; the firewall drops before the protocol stage',
        stages.length === 4 && fw.join(' ') === 'Address. Firewall. Result.',
        fw.join(' ')
    );
    await reach(page, 3);
    const nets = [
        [{ event: 'Nothing goes wrong' }, '1 2 3 4 5', /^All five, in order\./],
        [{ event: 'Route changes' }, '2 1 3 4 5', /^All five, out of order\./],
        [{ event: 'Route changes', transport: 'TCP' }, '1 2 3 4 5', /^All five, in order\./],
        [{ event: 'Link R2–R4 fails' }, '1 4 5', /^Some missing\./],
        [{ event: 'Link R2–R4 fails', transport: 'TCP' }, '1 2 3 4 5', /^All five, in order\./],
        [{ event: 'R2–R4 congested', service: '3 ticks' }, '1 2 3 4 5', /^All five, in order\./],
    ];
    for (const [inp, read, want] of nets) {
        const r = await network(page, inp);
        log(
            `Fig. 3: ${inp.event}, ${inp.transport ?? 'UDP'} → reads ${read}`,
            r.read === read && want.test(r.result),
            `${r.read} / ${r.result.slice(0, 40)}`
        );
    }
    const r = await network(page, { event: 'Link R2–R4 fails', transport: 'TCP' });
    log(
        'Fig. 3: the comparison table quotes UDP 1 4 5 by tick 15, TCP 1 2 3 4 5 by tick 23 with 2 resent',
        /UDP\s+1 4 5\s+tick 15\s+0/.test(r.table) && /TCP\s+1 2 3 4 5\s+tick 23\s+2/.test(r.table),
        r.table.replace(/\s+/g, ' ')
    );
    log(
        'Fig. 3: the service control appears only for congestion',
        (await fig(page, 3).locator('legend', { hasText: 'R2–R4 needs' }).count()) === 0
    );
    const text = await page.locator('article').innerText();
    log(
        'the text quotes the model: the last read moves from tick 15 to tick 23',
        /from tick 15 to tick 23/.test(text)
    );
    const nums = await page.locator('article .ln-cite a').allTextContents();
    let max = 0;
    let ordered = true;
    for (const n of nums.map(Number)) {
        if (n > max + 1) ordered = false;
        max = Math.max(max, n);
    }
    log('citations are numbered in order of first appearance', ordered && max === 12, nums.join(','));
    await ctx.close();
}

// 6. Animation: the packet moves while playing, Pause stops it, Reset returns, Replay plays again; steps keep focus.
async function section6(browser) {
    const { ctx, page } = await open(browser);
    await reach(page, 3);
    await pick(page, 3, 'On the way', 'Route changes');
    await fig(page, 3).getByRole('button', { name: 'Run', exact: true }).click();
    const tags = () =>
        fig(page, 3)
            .locator('svg g[transform]')
            .evaluateAll((els) => els.map((e) => e.getAttribute('transform')).join('|'));
    await page.waitForTimeout(400);
    const a = await tags();
    await page.waitForTimeout(600);
    const b = await tags();
    log(
        'Fig. 3: packets move while the run plays',
        a !== b && a.length > 0,
        `${a.slice(0, 40)} → ${b.slice(0, 40)}`
    );
    await fig(page, 3).getByRole('button', { name: 'Pause' }).click();
    const c = await tags();
    await page.waitForTimeout(500);
    log('Fig. 3: Pause stops every packet', c === (await tags()));
    await fig(page, 3).getByRole('button', { name: 'Reset' }).click();
    log(
        'Fig. 3: Reset returns to tick 0',
        /^Tick 0\./.test(await fig(page, 3).locator('[data-current-step]').innerText())
    );
    await toEnd(page, 3);
    const next = fig(page, 3).getByRole('button', { name: 'Next', exact: true });
    log(
        'Fig. 3: at the end Next is aria-disabled and Play reads Replay',
        (await next.getAttribute('aria-disabled')) === 'true' &&
            (await fig(page, 3).getByRole('button', { name: 'Replay' }).count()) === 1
    );
    await fig(page, 3).getByRole('button', { name: 'Replay' }).click();
    await page.waitForTimeout(300);
    log(
        'Fig. 3: Replay plays the run again from the start',
        (await fig(page, 3).getByRole('button', { name: 'Pause' }).count()) === 1
    );
    await reach(page, 2);
    await pick(page, 2, 'From', /^50002/);
    await fig(page, 2).getByRole('button', { name: 'Run', exact: true }).click();
    await fig(page, 2).getByRole('button', { name: 'Pause' }).click();
    await fig(page, 2).getByRole('button', { name: 'Reset' }).click();
    const n2 = fig(page, 2).getByRole('button', { name: 'Next', exact: true });
    await n2.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    const said = (await live(page, 2))[1];
    log(
        'Fig. 2: Next announces "Step 2 of 4, Protocol"',
        /^Step 2 of 4, Protocol\. The IP header/.test(said),
        said
    );
    log(
        'Fig. 2: the current step is shown under the drawing',
        /^Step 2 of 4, Protocol\./.test(await fig(page, 2).locator('[data-current-step]').innerText())
    );
    for (let i = 0; i < 4; i++) await page.keyboard.press('Enter');
    log(
        'Fig. 2: at the end Next keeps focus, is aria-disabled, and the reply has reached the sender',
        (await n2.getAttribute('aria-disabled')) === 'true' &&
            (await page.evaluate(() => document.activeElement.textContent)) === 'Next' &&
            /reply reaches the sender/.test(await fig(page, 2).locator('[data-current-step]').innerText())
    );
    await ctx.close();
}

// 7. Keyboard only and the phone layout: arrow keys, Enter on Run, focus ring, the result in view after Run.
async function section7(browser) {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await ctx.newPage();
    await page.goto(BASE + ROUTE, { waitUntil: 'networkidle' });
    await reach(page, 2);
    await fig(page, 2)
        .getByRole('radio', { name: /^50001/ })
        .focus();
    await page.keyboard.press('ArrowRight');
    log(
        'keyboard: an arrow key moves to source port 50002',
        await fig(page, 2)
            .getByRole('radio', { name: /^50002/ })
            .isChecked()
    );
    await fig(page, 2).getByRole('button', { name: 'Run', exact: true }).focus();
    const ring = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
    log('keyboard: the focused Run button shows a focus outline', ring !== 'none', ring);
    await page.keyboard.press('Enter');
    const inView = (css) =>
        page
            .waitForFunction(
                (sel) => {
                    const el = document.querySelector(sel);
                    const r = el && el.getBoundingClientRect();
                    return r && r.top >= 0 && r.bottom <= window.innerHeight;
                },
                css,
                { timeout: 4000 }
            )
            .then(() => true)
            .catch(() => false);
    log(
        '375 px: after Run, the Fig. 2 drawing and its current step are in view',
        (await inView('figure[aria-labelledby="fig2-h"] svg')) &&
            (await inView('figure[aria-labelledby="fig2-h"] [data-current-step]'))
    );
    await reach(page, 3);
    await fig(page, 3).getByRole('button', { name: 'Run', exact: true }).focus();
    await page.keyboard.press('Enter');
    log(
        '375 px: after Run, the Fig. 3 network is in view',
        await inView('figure[aria-labelledby="fig3-h"] svg')
    );
    await ctx.close();
}

// 8. Reduced motion: nothing transitions; play steps tick by tick; everything stays reachable.
async function section8(browser) {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(BASE + ROUTE, { waitUntil: 'networkidle' });
    await reach(page, 3);
    await fig(page, 3).getByRole('button', { name: 'Run', exact: true }).click();
    await page.waitForTimeout(150);
    const t1 = await fig(page, 3).locator('[data-current-step]').innerText();
    log(
        'reduced motion: Run does not glide; the run waits at a whole tick',
        /^Tick \d+\./.test(t1),
        t1.slice(0, 30)
    );
    const moving = await page.evaluate(
        () =>
            [...document.querySelectorAll('figure *')].filter((el) => {
                const s = getComputedStyle(el);
                return (
                    s.transitionDuration.split(',').some((d) => parseFloat(d) > 0) ||
                    s.animationName !== 'none'
                );
            }).length
    );
    log('reduced motion: nothing in the figures transitions or animates', moving === 0, `${moving} elements`);
    await toEnd(page, 3);
    log(
        'reduced motion: stepping reaches the outcome and the full list',
        (await fig(page, 3).locator('[data-result]').count()) === 1 &&
            (await fig(page, 3).locator('details li').count()) > 5
    );
    await ctx.close();
}

// 9. Integration: course index and chapter 2 link Chapter 3; sitemap lists it; / still renders.
async function section9(browser) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await page.goto(BASE + '/learn', { waitUntil: 'networkidle' });
    log('/learn links Chapter 3', (await page.locator('a[href="/learn/ip-and-ports"]').count()) >= 1);
    await page.goto(BASE + '/learn/client-server', { waitUntil: 'networkidle' });
    log(
        '/learn/client-server "next" links Chapter 3',
        (await page.locator('aside.ln-next a[href="/learn/ip-and-ports"]').count()) === 1
    );
    const home = await ctx.newPage();
    const errors = pageErrors(home);
    const res = await home.goto(BASE + '/', { waitUntil: 'networkidle' });
    log(
        '/ still renders (200, no page errors)',
        res.status() === 200 && errors.length === 0,
        errors.join(' | ')
    );
    const sm = await (await page.request.get(BASE + '/sitemap.xml')).text();
    log('sitemap lists /learn/ip-and-ports', /\/learn\/ip-and-ports</.test(sm));
    await ctx.close();
}

(async () => {
    const browser = await chromium.launch();
    for (const s of [
        section1,
        section2,
        section3,
        section4,
        section5,
        section6,
        section7,
        section8,
        section9,
    ])
        await s(browser);
    await browser.close();
    const failed = results.filter((r) => !r.ok);
    console.log(`\n${results.length - failed.length}/${results.length} passed`);
    process.exit(failed.length ? 1 : 0);
})();
