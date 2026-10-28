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
const fig = (page, n) => page.locator(`figure[aria-labelledby="fig${n}-h"]`);
/** Pick a radio by its group legend and its label (labels repeat across groups, e.g. "443"). */
const pick = (page, n, legend, name) =>
    fig(page, n)
        .locator('fieldset', { has: page.locator('legend', { hasText: legend }) })
        .getByRole('radio', { name, exact: true })
        .check();
const run = (page, n) => fig(page, n).getByRole('button', { name: 'Run', exact: true }).click();
const live = (page, n) => fig(page, n).locator('p.sr-only[aria-live=polite]').allTextContents();

async function demux(page, { from, to = /this server/, proto, port, firewall = 'Off' }) {
    await pick(page, 2, 'From', from);
    await pick(page, 2, 'To address', to);
    await pick(page, 2, 'Protocol', proto);
    await pick(page, 2, 'To port', port);
    await pick(page, 2, 'Server firewall', firewall);
    await run(page, 2);
    return fig(page, 2).locator('[data-result]').innerText();
}
async function datagrams(page, event, transport) {
    await pick(page, 3, 'On the way', event);
    await pick(page, 3, 'Transport', transport);
    await run(page, 3);
    const reads = await fig(page, 3).locator('.ln-out dd').first().innerText();
    const last = await fig(page, 3).locator('.ln-out dd').nth(2).innerText();
    return { reads, last };
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
        await demux(page, { from: /50003/, proto: 'TCP', port: '443' });
        await fig(page, 2).getByRole('button', { name: 'Next step' }).click();
        await fig(page, 2).getByRole('button', { name: 'Next step' }).click();
        await datagrams(page, 'Delay 2', 'TCP');
        const o2 = await over();
        log(`${w}x${h} no horizontal scroll before and after runs`, o1 <= 0 && o2 <= 0, `${o1}px / ${o2}px`);
        log(`${w}x${h} no console errors`, errors.length === 0, errors.join(' | '));
        for (const n of [1, 2, 3])
            await fig(page, n).screenshot({ path: path.join(OUT, `ip-${w}x${h}-fig${n}.png`) });
        await ctx.close();
    }
}

// 2. axe WCAG A/AA at 375 and 1280: on load with answers open, and after both figures ran.
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
        await demux(page, { from: /50002/, proto: 'UDP', port: '9000', firewall: /^On/ });
        await datagrams(page, 'Lose 3', 'UDP');
        await fig(page, 3).locator('details summary').click();
        r = await axeRun(page);
        log(
            `${w}px axe after both runs`,
            r.violations.length === 0,
            r.violations.map((v) => `${v.id}: ${v.nodes[0]?.target}`).join(' | ') ||
                `${r.incomplete.length} need review`
        );
        await ctx.close();
    }
}

// 3. No answer leak: nothing about an outcome before Run, and a change after a run clears it.
async function section3(browser) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + ROUTE, { waitUntil: 'networkidle' });
    // Each figure's whole text (visible or not), minus the radio choices, which are meant to be seen.
    const text = (n) =>
        page.evaluate((k) => {
            const c = document.querySelector(`figure[aria-labelledby="fig${k}-h"]`).cloneNode(true);
            c.querySelectorAll('.ln-seg').forEach((el) => el.remove());
            return c.textContent;
        }, n);
    const t2 = await text(2);
    log(
        'Fig. 2 on load: no outcome, no reply, no verdict, no steps',
        !/Sender gets back|right\.|not quite|Step 1|reset \(RST\) back/.test(t2),
        (t2.match(/.{0,30}(Sender gets back|right\.|not quite|Step 1).{0,30}/) || ['none'])[0]
    );
    const t3 = await text(3);
    log(
        'Fig. 3 on load: no read order, no last read, no verdict',
        !/Application reads|Last read|right\.|not quite|tick \d+:/.test(t3),
        (t3.match(/.{0,30}(Application reads|Last read|right\.|not quite).{0,30}/) || ['none'])[0]
    );
    log(
        'live regions empty on load',
        [...(await live(page, 2)), ...(await live(page, 3))].every((t) => t === '')
    );
    log(
        'the drawing of Fig. 2 highlights nothing before Run',
        (await fig(page, 2).locator('svg .ln-active').count()) === 0
    );
    await demux(page, { from: /50001/, proto: 'TCP', port: '443' });
    await pick(page, 2, 'Protocol', 'UDP');
    log(
        'Fig. 2: changing the packet after a run clears the result, the steps and the live text',
        (await fig(page, 2).locator('.ln-steps').count()) === 0 &&
            (await live(page, 2)).every((t) => t === '') &&
            (await fig(page, 2).locator('svg .ln-active').count()) === 0
    );
    await datagrams(page, 'Lose 3', 'UDP');
    await pick(page, 3, 'Predict first', 'One is missing');
    log(
        'Fig. 3: changing the prediction after a run clears the result',
        (await fig(page, 3).locator('.ln-out').count()) === 0 && (await live(page, 3)).every((t) => t === '')
    );
    await ctx.close();
}

// 4. Every outcome on the page agrees with the model's rules (and the numbers the text quotes).
async function section4(browser) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + ROUTE, { waitUntil: 'networkidle' });
    const cases = [
        [{ from: /50001/, proto: 'TCP', port: '443' }, /^Web server, connection 1\./],
        [{ from: /50002/, proto: 'TCP', port: '443' }, /^Web server, connection 2\./],
        [{ from: /50003/, proto: 'TCP', port: '443' }, /^Web server, as a new connection\./],
        [{ from: /50001/, proto: 'UDP', port: '8125' }, /^Metrics collector\./],
        [{ from: /50003/, proto: 'UDP', port: '8125' }, /^Metrics collector\./],
        [{ from: /50001/, proto: 'UDP', port: '443' }, /^Nobody: ICMP Port Unreachable comes back\./],
        [{ from: /50001/, proto: 'TCP', port: '9000' }, /^Nobody: a TCP reset comes back\./],
        [
            { from: /50001/, proto: 'TCP', port: '9000', firewall: /^On/ },
            /^Dropped by the firewall: nothing comes back\./,
        ],
        [{ from: /50002/, proto: 'TCP', port: '443', firewall: /^On/ }, /^Web server, connection 2\./],
        [{ from: /50001/, to: /another machine/, proto: 'TCP', port: '443' }, /^Never reaches this server\./],
    ];
    for (const [packet, want] of cases) {
        const got = await demux(page, packet);
        log(
            `Fig. 2: ${packet.proto} ${packet.port} from ${packet.from.source}${packet.firewall ? ', firewall on' : ''}${packet.to ? ', other address' : ''}`,
            want.test(got),
            got.slice(0, 90)
        );
    }
    // Prediction verdicts.
    await pick(page, 2, 'Predict first', 'Web server, connection 1');
    let got = await demux(page, { from: /50002/, proto: 'TCP', port: '443' });
    log('Fig. 2: a wrong prediction says "not quite"', /not quite/.test(got), got);
    await pick(page, 2, 'Predict first', 'Web server, connection 2');
    got = await demux(page, { from: /50002/, proto: 'TCP', port: '443' });
    log('Fig. 2: a right prediction says "right"', /right\./.test(got), got);
    // Steps: four stages; Next/Previous keep focus and announce; heavy element on each stage.
    const next = fig(page, 2).getByRole('button', { name: 'Next step' });
    log(
        'Fig. 2: four stages for a delivered packet',
        (await fig(page, 2).locator('.ln-steps li').count()) === 4
    );
    await next.focus();
    await page.keyboard.press('Enter');
    const said = (await live(page, 2))[1];
    log(
        'Fig. 2: Next announces "Step 2 of 4, Protocol"',
        /^Step 2 of 4, Protocol\. The IP header/.test(said),
        said
    );
    log(
        'Fig. 2: the protocol stage draws the TCP lane heavy',
        (await fig(page, 2).locator('svg .ln-active').count()) === 1
    );
    log(
        'Fig. 2: the current step is shown right under the drawing',
        /^Step 2 of 4, Protocol\./.test(await fig(page, 2).locator('[data-current-step]').innerText())
    );
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    log(
        'Fig. 2: at the last step Next keeps focus and is aria-disabled',
        (await next.getAttribute('aria-disabled')) === 'true' &&
            (await page.evaluate(() => document.activeElement.textContent)) === 'Next step'
    );
    // Fig. 3: numbers quoted in the text.
    const want3 = [
        ['Lose 3', 'UDP', '1 2 4 5', 'tick 6'],
        ['Lose 3', 'TCP', '1 2 3 4 5', 'tick 11'],
        ['Delay 2', 'UDP', '1 3 2 4 5', 'tick 6'],
        ['Delay 2', 'TCP', '1 2 3 4 5', 'tick 6'],
        ['Duplicate 4', 'UDP', '1 2 3 4 5 4', 'tick 7'],
        ['Duplicate 4', 'TCP', '1 2 3 4 5', 'tick 6'],
        ['Nothing goes wrong', 'UDP', '1 2 3 4 5', 'tick 6'],
    ];
    for (const [e, t, reads, last] of want3) {
        const r = await datagrams(page, e, t);
        log(
            `Fig. 3: ${e}, ${t} → reads ${reads}, last ${last}`,
            r.reads === reads && r.last === last,
            `${r.reads} / ${r.last}`
        );
    }
    const said3 = (await live(page, 3))[0];
    log(
        'Fig. 3: the run summary is announced',
        /^Nothing goes wrong, UDP\. The application reads 1 2 3 4 5/.test(said3),
        said3
    );
    // Firewall on: a dropped packet never reaches the protocol stage.
    await demux(page, { from: /50001/, proto: 'UDP', port: '443', firewall: /^On/ });
    const stages = await fig(page, 2).locator('.ln-steps li strong').allInnerTexts();
    log(
        'Fig. 2: the firewall drops before the protocol stage',
        stages.join(' ') === 'Address. Firewall. Result.',
        stages.join(' ')
    );
    // Fig. 3: a network copy is not drawn as sent; the list does not say it was sent.
    await datagrams(page, 'Duplicate 4', 'UDP');
    const sentTags = await fig(page, 3).evaluate((f) => {
        const svg = f.querySelector('svg');
        return [...svg.querySelectorAll('text')].filter(
            (t) => Math.abs(t.getAttribute('y') - 39) < 1 && /^\d$/.test(t.textContent)
        ).length;
    });
    const list = await fig(page, 3).locator('details li').allTextContents();
    log(
        'Fig. 3: a duplicate is copied by the network, not sent again (5 sent tags, 5 sent lines)',
        sentTags === 5 &&
            list.filter((t) => /: sent: 4$/.test(t)).length === 1 &&
            list.some((t) => /made by the network/.test(t)),
        `${sentTags} tags`
    );
    // Citations are numbered in order of first appearance.
    const nums = await page.locator('article .ln-cite a').allTextContents();
    let max = 0;
    let ordered = true;
    for (const n of nums.map(Number)) {
        if (n > max + 1) ordered = false;
        max = Math.max(max, n);
    }
    log('citations are numbered in order of first appearance', ordered && max === 12, nums.join(','));
    const text = await page.locator('article').innerText();
    log(
        'the text quotes the model: UDP 1 2 4 5 by tick 6; TCP last read at tick 11',
        /UDP hands over 1 2 4 5 by tick 6/.test(text) && /last\s+read moves to tick 11/.test(text)
    );
    await ctx.close();
}

// 5. Keyboard only: arrow keys move within a radio group, Enter runs, results appear.
async function section5(browser) {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await ctx.newPage();
    await page.goto(BASE + ROUTE, { waitUntil: 'networkidle' });
    await fig(page, 2)
        .getByRole('radio', { name: /^50001/ })
        .focus();
    await page.keyboard.press('ArrowRight');
    log(
        'keyboard: arrow key moves to source port 50002',
        await fig(page, 2)
            .getByRole('radio', { name: /^50002/ })
            .isChecked()
    );
    await fig(page, 2).getByRole('button', { name: 'Run', exact: true }).focus();
    await page.keyboard.press('Enter');
    log(
        'keyboard: Enter on Run shows the result',
        /connection 2/.test(await fig(page, 2).locator('[data-result]').innerText())
    );
    const ring = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
    log('keyboard: the focused Run button shows a focus outline', ring !== 'none', ring);
    // At 375 px the controls sit above the drawing: a run brings its result into view.
    const inView = (n) =>
        page
            .waitForFunction(
                (k) => {
                    const svg = document.querySelector(`figure[aria-labelledby="fig${k}-h"] svg`);
                    const r = svg && svg.getBoundingClientRect();
                    return r && r.top >= 0 && r.top < window.innerHeight - 100;
                },
                n,
                { timeout: 3000 }
            )
            .then(() => true)
            .catch(() => false);
    log('375 px: after Run, the Fig. 2 drawing is in view', await inView(2));
    await fig(page, 3).getByRole('button', { name: 'Run', exact: true }).focus();
    await page.keyboard.press('Enter');
    log('375 px: after Run, the Fig. 3 timeline is in view', await inView(3));
    await ctx.close();
}

// 6. Reduced motion: nothing transitions or animates; results complete.
async function section6(browser) {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(BASE + ROUTE, { waitUntil: 'networkidle' });
    await demux(page, { from: /50001/, proto: 'TCP', port: '443' });
    await datagrams(page, 'Lose 3', 'TCP');
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
    log(
        'reduced motion: steps and readouts complete',
        (await fig(page, 2).locator('.ln-steps li').count()) === 4 &&
            (await fig(page, 3).locator('.ln-out dd').count()) === 3
    );
    await ctx.close();
}

// 7. Integration: course index and chapter 2 link Chapter 3; sitemap lists it; / still renders.
async function section7(browser) {
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
    for (const s of [section1, section2, section3, section4, section5, section6, section7]) await s(browser);
    await browser.close();
    const failed = results.filter((r) => !r.ok);
    console.log(`\n${results.length - failed.length}/${results.length} passed`);
    process.exit(failed.length ? 1 : 0);
})();
