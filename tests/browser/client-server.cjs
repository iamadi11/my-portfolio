// Browser checks for /learn/client-server (Chapter 2) and the routes it touches, against a production build.
// Run with `npm run test:browser` (see README.md in this folder).
const { chromium } = require('playwright');
const path = require('path');

const { AXE, BASE, OUT, SIZES } = require('./config.cjs');
const ROUTE = '/learn/client-server';
const results = [];
const log = (name, ok, detail = '') => {
    results.push({ name, ok });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};
const axeRun = async (page) => {
    await page.addScriptTag({ content: AXE });
    // eslint-disable-next-line no-undef
    return page.evaluate(() =>
        axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] })
    );
};

// 1. Sizes: no horizontal scroll (before and after a run), no console errors, screenshots.
async function section1(browser) {
    for (const [w, h] of SIZES) {
        const ctx = await browser.newContext({ viewport: { width: w, height: h } });
        const page = await ctx.newPage();
        const errors = [];
        page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
        page.on('pageerror', (e) => errors.push(String(e)));
        await page.goto(BASE + ROUTE, { waitUntil: 'networkidle' });
        const over = () =>
            page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        const o1 = await over();
        await page.getByRole('radio', { name: 'POST with an idempotency key' }).check();
        await page.getByRole('radio', { name: 'Response late' }).check();
        await page.getByRole('checkbox', { name: /Send the same request again/ }).check();
        await page.getByRole('button', { name: 'Run', exact: true }).click();
        const o2 = await over();
        log(`${w}x${h} no horizontal scroll before and after a run`, o1 <= 0 && o2 <= 0, `${o1}px / ${o2}px`);
        log(`${w}x${h} no console errors`, errors.length === 0, errors.join(' | '));
        await page.locator('figure.ln-fig').screenshot({ path: path.join(OUT, `cs-${w}x${h}-fig.png`) });
        await ctx.close();
    }
}

// 2. axe WCAG A/AA at 375 and 1280: on load with answers open, and after reveal + run.
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
        await page.getByRole('button', { name: 'Skip, show the answers' }).click();
        await page.getByRole('button', { name: 'Run case C' }).click();
        r = await axeRun(page);
        log(
            `${w}px axe after reveal and a run`,
            r.violations.length === 0,
            r.violations.map((v) => `${v.id}: ${v.nodes[0]?.target}`).join(' | ') ||
                `${r.incomplete.length} need review`
        );
        await ctx.close();
    }
}

// 3. No answer leak before the learner checks, skips or runs.
async function section3(browser) {
    {
        const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
        const page = await ctx.newPage();
        await page.goto(BASE + ROUTE, { waitUntil: 'networkidle' });
        // The figure's whole text (visible or not), minus the prediction choices, which are meant to be seen.
        const fig = await page.evaluate(() => {
            const c = document.querySelector('figure.ln-fig').cloneNode(true);
            c.querySelectorAll('.ln-pq .ln-seg').forEach((el) => el.remove());
            return c.textContent;
        });
        log(
            'figure on load (all text, choices aside): no outcome readouts, no 409, no replay, no feedback',
            !/New orders|Reached the server|Client saw|Location/.test(fig) &&
                !/409|replay|right\.|not quite/i.test(fig),
            (fig.match(/.{0,30}(New orders|409|replay|Client saw|Location).{0,30}/i) || ['none'])[0]
        );
        log(
            'figure on load: choices are present but the 409 choice is only a choice',
            (await page.getByRole('radio', { name: '409 Conflict' }).count()) === 1
        );
        const above = await page.evaluate(() => {
            const fig = document.querySelector('figure.ln-fig');
            let t = '';
            const walker = document.createTreeWalker(document.querySelector('article'), NodeFilter.SHOW_TEXT);
            while (walker.nextNode()) {
                const n = walker.currentNode;
                if (fig.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_PRECEDING)
                    t += n.textContent + ' ';
            }
            return t;
        });
        log(
            'nothing above the figure states the keyed outcomes (409, replay, Idempotency-Key results)',
            !/409|replay|Idempotency-Key|idempotency key/i.test(
                above.replace(/describe how an\s+idempotency key lets a server recognise a repeated/i, '')
            ),
            (above.match(/.{0,40}(409|replay|dempotency.key).{0,40}/i) || [''])[0]
        );
        const live = await page.locator('figure p.sr-only[aria-live=polite]').allTextContents();
        log(
            'live regions empty on load',
            live.every((t) => t === ''),
            JSON.stringify(live)
        );
        // Incomplete: Check with nothing answered names the open questions and reveals nothing.
        await page.getByRole('button', { name: 'Check' }).click();
        const st = page.locator('.ln-predict [role=status]');
        let s = await st.innerText();
        log(
            'Check with no answers: names A, B and C and reveals nothing',
            /Answer A and B and C first/.test(s) && !/409|right|not quite/i.test(s),
            s
        );
        await page.getByRole('radio', { name: '2' }).first().check();
        await page.getByRole('button', { name: 'Check' }).click();
        s = await st.innerText();
        log('Check with A only: names B and C', /Answer B and C first/.test(s), s);
        // Correct, incorrect: A=2 right, B=0 wrong, C=409 right.
        await page.locator('fieldset.ln-pq').nth(1).getByRole('radio', { name: '0' }).check();
        await page.getByRole('radio', { name: '409 Conflict' }).check();
        await page.getByRole('button', { name: 'Check' }).click();
        s = await st.innerText();
        log(
            'feedback: A right, B not quite (it is 1) with the reason for picking 0, C right',
            /A: right\. The server placed/.test(s) &&
                /B: not quite, it is 1\. The first request did reach the server/.test(s) &&
                /C: right\. A server that honours keys/.test(s),
            s.replace(/\n/g, ' | ').slice(0, 200)
        );
        log(
            'after Check: Run case buttons appear',
            (await page.getByRole('button', { name: /Run case [ABC]/ }).count()) === 3
        );
        await ctx.close();
    }
}

// 4. Keyboard-only operation, focus, announcements.
async function section4(browser) {
    {
        const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
        const page = await ctx.newPage();
        await page.goto(BASE + ROUTE, { waitUntil: 'networkidle' });
        await page.getByRole('button', { name: 'Skip, show the answers' }).focus();
        await page.keyboard.press('Enter');
        const sk = await page.evaluate(() => ({
            t: document.activeElement?.textContent,
            d: document.activeElement?.getAttribute('aria-disabled'),
        }));
        log(
            'keyboard: Skip keeps focus (aria-disabled) and reveals answers',
            sk.t === 'Skip, show the answers' &&
                sk.d === 'true' &&
                /A: 2\./.test(await page.locator('.ln-predict [role=status]').innerText()),
            JSON.stringify(sk)
        );
        // Method radios with arrow keys: GET → PUT → POST.
        await page.getByRole('radio', { name: 'GET (read order 42)' }).focus();
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        log(
            'keyboard: arrows move the method to POST',
            await page.getByRole('radio', { name: 'POST (place an order)' }).isChecked()
        );
        await page.getByRole('radio', { name: 'Nothing goes wrong' }).focus();
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        log(
            'keyboard: arrows move the fault to Response lost',
            await page.getByRole('radio', { name: 'Response lost' }).isChecked()
        );
        await page.getByRole('checkbox', { name: /Send the same request again/ }).focus();
        await page.keyboard.press(' ');
        log(
            'keyboard: Space ticks the retry box',
            await page.getByRole('checkbox', { name: /Send the same request again/ }).isChecked()
        );
        await page.getByRole('button', { name: 'Run', exact: true }).focus();
        await page.keyboard.press('Enter');
        const out = await page.locator('.ln-out').innerText();
        log(
            'POST, response lost, retry: 2 new orders, 3 total, retry saw 201 for /orders/44',
            /New orders\s+2/.test(out) &&
                /total orders, order 42 quantity\s+3, 1/.test(out) &&
                /orders\/44/.test(out),
            out.replace(/\n/g, ' | ')
        );
        const summary = await page.locator('figure p.sr-only[aria-live=polite]').first().textContent();
        log(
            'live summary announces the run in words',
            /POST \(place an order\), response lost, retry on\. Client saw first attempt: no response before its timeout; retry: 201 Created, Location \/orders\/44\. Reached the server 2 times; new orders 2; total orders 3/.test(
                summary
            ),
            summary
        );
        const next = page.getByRole('button', { name: 'Next step' });
        await next.focus();
        await page.keyboard.press('Enter');
        const ann = page.locator('figure p.sr-only[aria-live=polite]').nth(1);
        log(
            'step change is announced',
            /^Step 2 of \d+\./.test(await ann.textContent()),
            await ann.textContent()
        );
        for (let i = 0; i < 12; i++) await page.keyboard.press('Enter');
        const nx = await page.evaluate(() => ({
            t: document.activeElement?.textContent,
            d: document.activeElement?.getAttribute('aria-disabled'),
        }));
        log(
            'keyboard: focus stays on Next step at the last step',
            nx.t === 'Next step' && nx.d === 'true',
            JSON.stringify(nx)
        );
        const outline = await next.evaluate(
            (el) => getComputedStyle(el).outlineStyle + ' ' + getComputedStyle(el).outlineWidth
        );
        log('visible focus on buttons', /solid 2px/.test(outline), outline);
        // Changing a choice clears the old result and the announcer (never stale).
        await page.getByRole('radio', { name: 'PUT (set quantity 2)' }).check();
        log(
            'changing a choice clears the result and both live regions',
            (await page.locator('.ln-out').count()) === 0 &&
                (await page.locator('figure p.sr-only[aria-live=polite]').allTextContents()).every(
                    (t) => t === ''
                )
        );
        // Run case B from the revealed answers: keyed POST, replayed.
        await page.getByRole('button', { name: 'Run case B' }).click();
        const outB = await page.locator('.ln-out').innerText();
        log(
            'Run case B: keyed POST, response lost: 1 new order, retry gets the original 201 (/orders/43) replayed',
            /New orders\s+1/.test(outB) &&
                /retry\)\s+201 Created, Location \/orders\/43/.test(outB) &&
                (await page.getByRole('radio', { name: 'POST with an idempotency key' }).isChecked()),
            outB.replace(/\n/g, ' | ')
        );
        await page.getByRole('button', { name: 'Run case C' }).click();
        const outC = await page.locator('.ln-out').innerText();
        log(
            'Run case C: keyed POST, response late: retry gets 409 Conflict, 1 new order',
            /retry\)\s+409 Conflict/.test(outC) && /New orders\s+1/.test(outC),
            outC.replace(/\n/g, ' | ')
        );
        log(
            'late case: diagram labels the retry as arriving while the first is still running, and draws the late reply last',
            /retry, first still busy/i.test(await page.locator('figure svg').textContent()) &&
                /first finishes, late/i.test(await page.locator('figure svg').textContent())
        );
        const steps = await page.locator('.ln-steps li').allTextContents();
        const iStart = steps.findIndex((t) => /starts creating order 43/.test(t));
        const iRetry = steps.findIndex((t) => /refuses the copy/.test(t));
        const iLate = steps.findIndex((t) => /The first request finishes/.test(t));
        log(
            'late case: event list in time order (first starts, retry refused while it runs, first finishes last)',
            iStart >= 0 &&
                iStart < iRetry &&
                iRetry < iLate &&
                iLate === steps.length - 1 &&
                !steps.slice(0, iRetry).some((t) => /201/.test(t)),
            JSON.stringify([iStart, iRetry, iLate, steps.length])
        );
        // Label geometry: every label centred between the lanes stays between them, in every late case.
        let crossing = [];
        for (const m of [
            'GET (read order 42)',
            'PUT (set quantity 2)',
            'POST (place an order)',
            'POST with an idempotency key',
        ]) {
            await page.getByRole('radio', { name: m }).check();
            await page.getByRole('radio', { name: 'Response late' }).check();
            await page.getByRole('checkbox', { name: /Send the same request again/ }).check();
            await page.getByRole('button', { name: 'Run', exact: true }).click();
            crossing = crossing.concat(
                await page.evaluate(() =>
                    [...document.querySelectorAll('figure svg text[text-anchor=middle]')]
                        .filter((t) => !/^(Client|Server)$/.test(t.textContent))
                        .map((t) => ({ t: t.textContent, b: t.getBBox() }))
                        .filter((x) => x.b.x < 52 || x.b.x + x.b.width > 268)
                        .map((x) => `${x.t} [${Math.round(x.b.x)}–${Math.round(x.b.x + x.b.width)}]`)
                )
            );
        }
        log(
            'drawing: every centred label stays between the lanes (x 52–268) in all late cases',
            crossing.length === 0,
            crossing.join(' | ')
        );
        const bad = await page.evaluate(
            () =>
                [...document.querySelectorAll('.ln-cite a')].filter(
                    (a) => !document.querySelector(a.getAttribute('href'))
                ).length
        );
        log('every citation link points to a listed source', bad === 0, `${bad} broken`);
        const ids = await page.evaluate(() =>
            [...document.querySelectorAll('.ln-sources li')].map((li) => li.id)
        );
        const firstUse = await page.evaluate(() => {
            const seen = [];
            document.querySelectorAll('.ln-cite a').forEach((a) => {
                const id = a.getAttribute('href').slice(1);
                if (!seen.includes(id)) seen.push(id);
            });
            return seen;
        });
        log(
            'sources are numbered in order of first citation, and all are cited',
            JSON.stringify(ids) === JSON.stringify(firstUse),
            `${ids.length} sources`
        );
        const firstQ = page.locator('div.ln-q details').first();
        await firstQ.locator('summary').focus();
        await page.keyboard.press('Enter');
        log('keyboard: Enter opens an answer', await firstQ.evaluate((d) => d.open));
        await ctx.close();
    }
}

// 5. Reduced motion: no transitions in the figure; results still complete.
async function section5(browser) {
    {
        const ctx = await browser.newContext({
            viewport: { width: 375, height: 812 },
            reducedMotion: 'reduce',
        });
        const page = await ctx.newPage();
        await page.goto(BASE + ROUTE, { waitUntil: 'networkidle' });
        await page.getByRole('button', { name: 'Run', exact: true }).click();
        const tr = await page.evaluate(
            () =>
                [...document.querySelectorAll('figure *')].filter((el) => {
                    const s = getComputedStyle(el);
                    return (
                        s.transitionDuration.split(',').some((d) => parseFloat(d) > 0) ||
                        s.animationName !== 'none'
                    );
                }).length
        );
        log('reduced motion: nothing in the figure transitions or animates', tr === 0, `${tr} elements`);
        log(
            'reduced motion: all events listed and results shown',
            (await page.locator('.ln-steps li').count()) === 4 && (await page.locator('.ln-out').isVisible())
        );
        await ctx.close();
    }
}

// 6. Integration: course index links the chapter; chapter 1 links forward; / still renders.
async function section6(browser) {
    {
        const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
        const page = await ctx.newPage();
        await page.goto(BASE + '/learn', { waitUntil: 'networkidle' });
        log('/learn links Chapter 2', (await page.locator('a[href="/learn/client-server"]').count()) >= 1);
        await page.goto(BASE + '/learn/web-request', { waitUntil: 'networkidle' });
        log(
            '/learn/web-request "next" links Chapter 2',
            (await page.locator('aside.ln-next a[href="/learn/client-server"]').count()) === 1
        );
        const errors = [];
        page.on('pageerror', (e) => errors.push(String(e)));
        const res = await page.goto(BASE + '/', { waitUntil: 'networkidle' });
        log(
            '/ still renders (200, no page errors)',
            res.status() === 200 && errors.length === 0,
            errors.join(' | ')
        );
        const sm = await (await page.request.get(BASE + '/sitemap.xml')).text();
        log('sitemap lists /learn/client-server', /\/learn\/client-server</.test(sm));
        await ctx.close();
    }
}

(async () => {
    const browser = await chromium.launch();
    await section1(browser);
    await section2(browser);
    await section3(browser);
    await section4(browser);
    await section5(browser);
    await section6(browser);
    await browser.close();
    const failed = results.filter((r) => !r.ok);
    console.log(`\n${results.length - failed.length}/${results.length} passed`);
    process.exit(failed.length ? 1 : 0);
})();
