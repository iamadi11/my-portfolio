// Browser checks for /learn/web-request (Chapter 1) and the routes it touches, against a production build.
// Run with `npm run test:browser` (see README.md in this folder).
const path = require('path');
const { chromium } = require('playwright');

const { AXE, BASE, OUT, SIZES } = require('./config.cjs');

const results = [];
const log = (name, ok, detail = '') => {
    results.push({ name, ok, detail });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};

// 1. Sizes: no horizontal scroll, screenshots, console errors.
async function section1(browser) {
    for (const route of ['/learn', '/learn/web-request']) {
        for (const [w, h] of SIZES) {
            const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
            const page = await ctx.newPage();
            const errors = [];
            page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
            page.on('pageerror', (e) => errors.push(String(e)));
            await page.goto(BASE + route, { waitUntil: 'networkidle' });
            const over = await page.evaluate(
                () => document.documentElement.scrollWidth - document.documentElement.clientWidth
            );
            log(`${route} ${w}x${h} no horizontal scroll`, over <= 0, `overflow ${over}px`);
            log(`${route} ${w}x${h} no console errors`, errors.length === 0, errors.join(' | '));
            const slug = route.replace(/\//g, '_') || '_root';
            await page.screenshot({ path: path.join(OUT, `${slug}-${w}x${h}-top.png`) });
            if (route === '/learn/web-request') {
                await page.locator('figure.ln-fig').scrollIntoViewIfNeeded();
                await page
                    .locator('figure.ln-fig')
                    .screenshot({ path: path.join(OUT, `${slug}-${w}x${h}-fig.png`) });
            }
            await ctx.close();
        }
    }
}

// 2. axe (WCAG 2.0/2.1/2.2 A and AA) at 375 and 1280, with the answers opened too.
async function section2(browser) {
    for (const route of ['/learn', '/learn/web-request']) {
        for (const w of [375, 1280]) {
            const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
            const page = await ctx.newPage();
            await page.goto(BASE + route, { waitUntil: 'networkidle' });
            await page.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)));
            await page.addScriptTag({ content: AXE });
            const r = await page.evaluate(async () =>
                axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] })
            );
            const v = r.violations.map(
                (x) => `${x.id} (${x.impact}, ${x.nodes.length}): ${x.nodes[0]?.target.join(' ')}`
            );
            log(
                `${route} ${w}px axe WCAG A/AA violations`,
                v.length === 0,
                v.join(' | ') || `${r.passes.length} rules passed, ${r.incomplete.length} need review`
            );
            if (r.incomplete.length)
                console.log(
                    '      needs review:',
                    r.incomplete.map((x) => `${x.id}(${x.nodes.length})`).join(', ')
                );
            await ctx.close();
        }
    }
}

// 3. Keyboard-only operation of Fig. 1, and model-driven readouts.
async function section3(browser) {
    {
        const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
        const page = await ctx.newPage();
        await page.goto(BASE + '/learn/web-request', { waitUntil: 'networkidle' });
        const readout = () => page.locator('.ln-readout').innerText();
        const before = await readout();
        const ladderBefore = await page.locator('.ln-ladder').innerText();
        const sumBefore = await page.locator('p.sr-only[aria-live=polite]').first().textContent();
        log(
            'before predicting: total only, no travel/work split, no Server row, no share (visible or announced)',
            /200 ms/.test(before) &&
                !/Network waiting/.test(before) &&
                !/travel|work|server/i.test(ladderBefore) &&
                !/Black bars/.test(await page.locator('figcaption').textContent()) &&
                !/%|server/i.test(sumBefore),
            sumBefore
        );
        await page.getByRole('button', { name: 'Skip, show the labels' }).focus();
        await page.keyboard.press('Enter');
        const sk = await page.evaluate(() => ({
            t: document.activeElement?.textContent,
            d: document.activeElement?.getAttribute('aria-disabled'),
        }));
        log(
            'keyboard: focus stays on Skip after use (aria-disabled)',
            sk.t === 'Skip, show the labels' && sk.d === 'true',
            JSON.stringify(sk)
        );
        log(
            "after skip: summary announces the split with the ladder's names",
            /Request \(travel\) 40 ms, Server \(work\) 50 ms[\s\S]*75\.0% network/.test(
                await page.locator('p.sr-only[aria-live=polite]').first().textContent()
            )
        );
        log(
            'after skip: readout = first visit 200 ms, 75.0%',
            /200 ms[\s\S]*150 ms \(75\.0%\)[\s\S]*50 ms/.test(await readout()),
            await readout()
        );
        log(
            'after skip: travel/work labels shown',
            /travel/i.test(await page.locator('.ln-ladder').innerText()) &&
                /Black bars/.test(await page.locator('figcaption').textContent())
        );
        // Tab to the first visit radio and arrow to "Repeat visit".
        const first = page.getByRole('radio', { name: 'First visit' });
        await first.focus();
        await page.keyboard.press('ArrowRight');
        log(
            'keyboard: arrow key selects the repeat visit',
            await page.getByRole('radio', { name: /Repeat visit/ }).isChecked()
        );
        log(
            'repeat visit readout = 90 ms, 44.4%',
            /90 ms[\s\S]*40 ms \(44\.4%\)/.test(await readout()),
            await readout()
        );
        await page.keyboard.press('ArrowRight');
        log(
            'fresh cache readout says no request is sent, no network used',
            /no request is sent[\s\S]*no network used/.test(await readout()),
            await readout()
        );
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('ArrowLeft');
        // Slider: focus the round-trip range and press End (max 300) then Home (min 5).
        const rtt = page.getByRole('slider', { name: 'Round-trip time' });
        await rtt.focus();
        await page.keyboard.press('End');
        log(
            'keyboard: End sets round trip to 300 → first visit 30+300*3+50 = 980 ms',
            /980 ms/.test(await readout()),
            await readout()
        );
        await page.keyboard.press('Home');
        log(
            'keyboard: Home sets round trip to 5 → 30+15+50 = 95 ms',
            /95 ms/.test(await readout()),
            await readout()
        );
        log(
            'sliders announce their unit',
            (await rtt.getAttribute('aria-valuetext')) === '5 milliseconds',
            await rtt.getAttribute('aria-valuetext')
        );
        const srv = page.getByRole('slider', { name: 'Server processing time' });
        await srv.focus();
        await page.keyboard.press('Home');
        for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
        log(
            'keyboard: server time can be set to the exercise value 25 ms',
            (await srv.inputValue()) === '25',
            await srv.inputValue()
        );
        // Step buttons and next/previous with Enter / Space.
        const next = page.getByRole('button', { name: 'Next step' });
        await next.focus();
        await page.keyboard.press('Enter');
        await page.keyboard.press('Enter');
        const cur = await page.locator('.ln-step[aria-current="step"]').innerText();
        log(
            'keyboard: Next step twice → step 3 (TCP) is current',
            /3\s*Open a connection/.test(cur),
            cur.replace(/\s+/g, ' ')
        );
        const announcer = page.locator('p.sr-only[aria-live=polite]').nth(1);
        log(
            'step change is announced',
            /Step 3\./.test(await announcer.textContent()),
            await announcer.textContent()
        );
        for (let i = 0; i < 6; i++) await page.keyboard.press('Enter');
        const st = await page.evaluate(() => ({
            t: document.activeElement?.textContent,
            d: document.activeElement?.getAttribute('aria-disabled'),
        }));
        log(
            'keyboard: focus stays on Next step at the last step (aria-disabled)',
            st.t === 'Next step' && st.d === 'true',
            JSON.stringify(st)
        );
        log(
            'Next at the last step does not move past step 6',
            /Step 6\./.test(await page.locator('.ln-frame').innerText())
        );
        const s5 = page.getByRole('button', { name: /Request and first byte/ });
        await s5.focus();
        await page.keyboard.press(' ');
        log(
            'keyboard: Space on a step button selects it',
            /Request and first byte/.test(await page.locator('.ln-frame').innerText())
        );
        // Prediction: tick the four travel items with Space, then Check.
        // First a wrong answer: miss one travel item and tick the server; the feedback must name both.
        await page.getByRole('checkbox', { name: 'DNS lookup' }).check();
        await page.getByRole('checkbox', { name: 'Server processing' }).check();
        await page.getByRole('button', { name: 'Check' }).click();
        const nq = await page.locator('.ln-predict [role=status]').first().innerText();
        log(
            'prediction: "Not quite" names the missed and the wrong ticks',
            /^Not quite\. TCP handshake, TLS handshake and request round trip are travel too[\s\S]*server processing is the server working/.test(
                nq
            ),
            nq
        );
        await page.getByRole('checkbox', { name: 'DNS lookup' }).uncheck();
        await page.getByRole('checkbox', { name: 'Server processing' }).uncheck();
        for (const name of ['DNS lookup', 'TCP handshake', 'TLS handshake', 'Request round trip']) {
            await page.getByRole('checkbox', { name }).focus();
            await page.keyboard.press(' ');
        }
        await page.getByRole('button', { name: 'Check' }).focus();
        await page.keyboard.press('Enter');
        log(
            'prediction: correct answer gets "Right."',
            /^Right\./.test(await page.locator('.ln-predict [role=status]').first().innerText())
        );
        // Visible focus: the focused button has an outline.
        await next.focus();
        const outline = await next.evaluate(
            (el) => getComputedStyle(el).outlineStyle + ' ' + getComputedStyle(el).outlineWidth
        );
        log('visible focus on buttons', /solid 2px/.test(outline), outline);
        // Live region holds a text summary.
        log(
            'live summary text present',
            /time to first byte \d+ ms/.test(
                await page.locator('p.sr-only[aria-live=polite]').first().textContent()
            )
        );
        await page.getByRole('button', { name: /Open a connection/ }).click();
        const ann1 = await announcer.textContent();
        await page.getByRole('radio', { name: 'Fresh cached copy' }).check();
        log(
            'visit change empties the step announcer (never stale)',
            (await announcer.textContent()) === '' && ann1 !== '',
            JSON.stringify(ann1.slice(0, 40))
        );
        await page.getByRole('button', { name: /Request and first byte/ }).click();
        log(
            'skipped step text keeps its capitals ("GET /")',
            /this step goes: GET \//.test(await page.locator('.ln-frame').textContent()),
            (await page.locator('.ln-frame').textContent()).slice(0, 120)
        );
        await page.getByRole('radio', { name: 'First visit' }).check();
        // Reveal empties the step announcer (step 5's text changes on reveal).
        {
            const c2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
            const p2 = await c2.newPage();
            await p2.goto(BASE + '/learn/web-request', { waitUntil: 'networkidle' });
            await p2.getByRole('button', { name: /Request and first byte/ }).click();
            const an = p2.locator('p.sr-only[aria-live=polite]').nth(1);
            const a0 = await an.textContent();
            await p2.getByRole('button', { name: 'Skip, show the labels' }).click();
            log(
                'reveal empties the step announcer',
                a0 !== '' && (await an.textContent()) === '',
                JSON.stringify(a0.slice(0, 40))
            );
            // Predict, then run: empty guess is refused; a guess is shown next to the model's value.
            const runBtn = p2.getByRole('button', { name: 'Run the repeat visit' });
            await runBtn.click();
            const st = p2.locator('.ln-predict [role=status]').nth(1);
            log(
                'predict-run: empty guess asks for a number',
                /Type your guess/.test(await st.textContent()),
                await st.textContent()
            );
            await p2.getByLabel('Your guess (ms)').fill('-0.4');
            await runBtn.click();
            log(
                'predict-run: a negative guess (-0.4) is refused',
                /Type your guess/.test(await st.textContent()),
                await st.textContent()
            );
            log(
                'predict-run: before Run, the asked answer (130 ms) is not on screen',
                !/\b130 ms/.test(await p2.locator('figure.ln-fig').innerText())
            );
            await p2.getByLabel('Your guess (ms)').fill('170');
            await p2.getByLabel('Your guess (ms)').press('Enter');
            const t = await st.textContent();
            log(
                'predict-run: Enter runs it; guess 170 vs model 130 at an 80 ms round trip, off by 40',
                /You guessed 170 ms\. With a round trip of 80 ms and 50 ms server time, the model gives 130 ms[\s\S]*Off by 40 ms/.test(
                    t
                ),
                t
            );
            log(
                'predict-run: Run switches the figure to the repeat visit at 80 ms',
                (await p2.getByRole('radio', { name: /Repeat visit/ }).isChecked()) &&
                    (await p2.getByRole('slider', { name: 'Round-trip time' }).inputValue()) === '80' &&
                    /130 ms/.test(await p2.locator('.ln-readout').innerText()),
                await p2.locator('.ln-readout').innerText()
            );
            const why = await p2.locator('.ln-step-why').allTextContents();
            log(
                'repeat visit: DNS, TCP and TLS skipped with "connection reused"',
                why.length === 3 && why.every((w) => /connection reused/.test(w)),
                why.join(' | ')
            );
            await p2.getByLabel('Your guess (ms)').fill('130');
            await runBtn.click();
            log(
                'predict-run: exact guess says "Exactly right."',
                /Exactly right\./.test(await st.textContent())
            );
            await p2.getByLabel('Your guess (ms)').fill('134.6');
            await runBtn.click();
            const t2 = await st.textContent();
            log(
                'predict-run: fractional guess rounded to whole ms (135, off by 5)',
                /You guessed 135 ms\.[\s\S]*Off by 5 ms\./.test(t2),
                t2
            );
            await p2.getByRole('slider', { name: 'Round-trip time' }).focus();
            await p2.keyboard.press('ArrowRight');
            log(
                'predict-run: result stays a snapshot when a slider moves',
                /round trip of 80 ms[\s\S]*gives 130 ms/.test(await st.textContent()) &&
                    /135 ms/.test(await p2.locator('.ln-readout').innerText())
            );
            await p2.getByLabel('Your guess (ms)').fill('1');
            log('predict-run: editing the guess clears the result', (await st.textContent()) === '');
            log(
                'predict-run: prompt asks about 80 ms',
                /round trip were 80 ms/.test(await p2.locator('.ln-predict').nth(1).textContent())
            );
            await c2.close();
        }
        // Answers hidden until opened, opened by keyboard.
        const sum = page.locator('details.ln-q summary').first();
        await sum.focus();
        await page.keyboard.press('Enter');
        log(
            'keyboard: Enter opens an answer',
            await page
                .locator('details.ln-q')
                .first()
                .evaluate((d) => d.open)
        );
        // Citation links resolve to a source item.
        const bad = await page.evaluate(
            () =>
                [...document.querySelectorAll('.ln-cite a')].filter(
                    (a) => !document.querySelector(a.getAttribute('href'))
                ).length
        );
        log('every citation link points to a listed source', bad === 0, `${bad} broken`);
        await ctx.close();
    }
}

// 4. Reduced motion: no transitions, all six steps and the readouts present.
async function section4(browser) {
    {
        const ctx = await browser.newContext({
            viewport: { width: 375, height: 812 },
            reducedMotion: 'reduce',
        });
        const page = await ctx.newPage();
        await page.goto(BASE + '/learn/web-request', { waitUntil: 'networkidle' });
        const steps = await page.locator('.ln-step').count();
        const tr = await page
            .locator('.ln-bar-fill')
            .first()
            .evaluate((el) => getComputedStyle(el).transitionDuration);
        log('reduced motion: all 6 steps listed', steps === 6, `${steps}`);
        log('reduced motion: bars do not animate', tr === '0s', tr);
        log(
            'reduced motion: readout and assumptions shown',
            /Time to first byte/.test(await page.locator('.ln-readout').innerText()) &&
                (await page.locator('figcaption').isVisible())
        );
        await ctx.close();
    }
}

// 5. / still renders (unchanged route).
async function section5(browser) {
    {
        const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
        const page = await ctx.newPage();
        const errors = [];
        page.on('pageerror', (e) => errors.push(String(e)));
        const res = await page.goto(BASE + '/', { waitUntil: 'networkidle' });
        log(
            '/ still renders (200, no page errors)',
            res.status() === 200 && errors.length === 0,
            errors.join(' | ')
        );
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
    await browser.close();
    const failed = results.filter((r) => !r.ok);
    console.log(`\n${results.length - failed.length}/${results.length} passed`);
    process.exit(failed.length ? 1 : 0);
})();
