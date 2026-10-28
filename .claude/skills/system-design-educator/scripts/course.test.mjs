// Tests for course.mjs: `node --test .claude/skills/system-design-educator/scripts/course.test.mjs`. No dependencies; each case
// builds a throwaway course in the OS temp folder, never touching the real docs/system-design.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'course.mjs');
const made = [];
after(() => made.forEach((d) => rmSync(d, { recursive: true, force: true })));

const HEAD =
    '| id | order | stage | title | prereqs | paths | status |\n| --- | --- | --- | --- | --- | --- | --- |';
const row = (id, order, prereqs, status) =>
    `| ${id} | ${order} | 1 | Title ${id} | ${prereqs} | beginner | ${status} |`;

/** A course folder: graph rows, optional Product line, COURSE_STATE current unit, chapter specs. */
function course({
    rows = [],
    product = 'none',
    unit = 'none',
    state = 'initialized',
    specs = {},
    raw,
    files = {},
} = {}) {
    const root = mkdtempSync(join(tmpdir(), 'sde-'));
    made.push(root);
    const docs = join(root, 'docs/system-design');
    mkdirSync(join(docs, 'chapters'), { recursive: true });
    const productLine = product === null ? '' : `Product: ${product}\n`;
    writeFileSync(
        join(docs, 'CURRICULUM.md'),
        raw ??
            `# Curriculum\n${productLine}\n<!-- graph:start -->\n${HEAD}\n${rows.join('\n')}\n<!-- graph:end -->\n`
    );
    if (state)
        writeFileSync(
            join(docs, 'COURSE_STATE.md'),
            `# Course state\n\nState: ${state}\n\n## Current unit\n\n${unit}\n\n## Next action\n\nx\n`
        );
    for (const [id, text] of Object.entries(specs)) writeFileSync(join(docs, 'chapters', `${id}.md`), text);
    for (const [path, text] of Object.entries(files)) {
        mkdirSync(dirname(join(root, path)), { recursive: true });
        writeFileSync(join(root, path), text);
    }
    return root;
}

function run(root, ...args) {
    const r = spawnSync(process.execPath, [SCRIPT, ...args, '--root', root], { encoding: 'utf8' });
    return { code: r.status, out: r.stdout + r.stderr };
}

const LEGACY = 'Standard: legacy — fixture\n\n';
const CONTENT =
    LEGACY +
    '## Boundary\n\nObjectives: x\n\n## Explanation (14 questions)\n\n1. Problem: x\n\n## Visual\n\nDecision: text only\n\n## Practice\n\nQ1\n\n';
const READ = CONTENT + '## Sources\n\n- id: rfc9110\n  title: RFC 9110\n  via: read\n  supports: [c1]\n';
const SEARCH = CONTENT + '## Sources\n\n- id: rfc9110\n  title: RFC 9110\n  via: search\n  supports: [c1]\n';
const PASS =
    '\n## Evidence\n\n- typecheck: pass — tsc (2026-01-01)\n- lint: pass — eslint (2026-01-01)\n' +
    '- model tests: pass — vitest (2026-01-01)\n- browser: pass — playwright (2026-01-01)\n' +
    '- keyboard: pass — playwright (2026-01-01)\n- reduced motion: pass — playwright (2026-01-01)\n';
const REVIEW = '\n## Review findings\n\nReviewer: fresh subagent, 2026-01-02\n';

test('fresh graph: next is the first chapter', () => {
    const r = run(course({ rows: [row('a', 1, '', 'planned'), row('b', 2, 'a', 'planned')] }), 'next');
    assert.equal(r.code, 0);
    assert.match(r.out, /next: a\b/);
});

test('not initialized or no COURSE_STATE: next asks for mode A; check warns', () => {
    const rows = [row('a', 1, '', 'planned')];
    assert.match(run(course({ rows, state: 'not initialized' }), 'next').out, /next: mode A/);
    assert.match(run(course({ rows, state: false }), 'next').out, /next: mode A/);
    assert.match(run(course({ rows, state: 'not initialized' }), 'check').out, /mode A comes first/);
});

test('empty graph: next asks for mode B', () => {
    const r = run(course({ rows: [] }), 'next');
    assert.equal(r.code, 0);
    assert.match(r.out, /no chapters: run mode B/);
});

test('malformed curriculum: missing markers, wrong header, bad rows', () => {
    assert.equal(run(course({ raw: '# no table\n' }), 'check').code, 2);
    assert.equal(
        run(course({ raw: '<!-- graph:start -->\n| id | title |\n| - | - |\n<!-- graph:end -->' }), 'check')
            .code,
        2
    );
    const r = run(
        course({
            rows: [
                '| a | 1 | 1 | A | | beginner |',
                '| B_x | 1 | x | B | | | done |',
                row('c', 3, 'zzz', 'planned'),
            ],
        }),
        'check'
    );
    assert.equal(r.code, 1);
    for (const m of [
        /row has 6 cells/,
        /id must be kebab-case/,
        /duplicate order/,
        /stage must be a number/,
        /unknown status "done"/,
        /on no path/,
        /unknown prerequisite "zzz"/,
    ])
        assert.match(r.out, m);
});

test('cyclic prerequisites are reported and next refuses', () => {
    const root = course({ rows: [row('a', 1, 'b', 'planned'), row('b', 2, 'a', 'planned')] });
    const c = run(root, 'check');
    assert.equal(c.code, 1);
    assert.match(c.out, /cycle: a → b → a/);
    assert.equal(run(root, 'next').code, 1);
});

test('missing Product line and Product none with a status past authored', () => {
    assert.match(
        run(course({ rows: [row('a', 1, '', 'planned')], product: null }), 'check').out,
        /needs a "Product/
    );
    const r = run(course({ rows: [row('a', 1, '', 'implemented')], specs: { a: READ } }), 'check');
    assert.match(r.out, /status implemented but Product is none/);
});

test('interrupted chapter: current unit resumes it, ahead of other started work', () => {
    const root = course({
        rows: [row('a', 1, '', 'authored'), row('b', 2, 'a', 'researched'), row('c', 3, 'a', 'researched')],
        unit: 'c step 4',
        specs: { a: READ, b: READ, c: SEARCH },
    });
    const r = run(root, 'next');
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /next: c\b[\s\S]*resume/);
});

test('in-progress chapter is finished before a new one starts (no Current unit)', () => {
    const root = course({
        rows: [row('a', 1, '', 'researched'), row('b', 2, '', 'planned')],
        specs: { a: READ },
    });
    assert.match(run(root, 'next').out, /next: a\b[\s\S]*in progress/);
});

test('Product none: authored counts as done; product set: authored is in progress', () => {
    const rows = [row('a', 1, '', 'authored'), row('b', 2, 'a', 'planned')];
    assert.match(run(course({ rows, specs: { a: READ } }), 'next').out, /next: b\b/);
    assert.match(
        run(course({ rows, product: 'src/app/learn', specs: { a: READ } }), 'next').out,
        /next: a\b/
    );
});

test('all authored with no product: next says implementation waits for the owner', () => {
    const r = run(course({ rows: [row('a', 1, '', 'authored')], specs: { a: READ } }), 'next');
    assert.match(r.out, /next: none[\s\S]*owner asks/);
});

test('current unit: unknown id is an error; empty section does not read the next heading', () => {
    assert.match(
        run(course({ rows: [row('a', 1, '', 'planned')], unit: 'typo step 2' }), 'check').out,
        /"typo" is not a chapter id/
    );
    const r = run(course({ rows: [row('a', 1, '', 'planned')], unit: '' }), 'check');
    assert.equal(r.code, 0, r.out);
});

test('stale current unit (state step 3 interrupted) warns but passes', () => {
    const r = run(
        course({ rows: [row('a', 1, '', 'authored')], unit: 'a step 9', specs: { a: READ } }),
        'check'
    );
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /already authored: set it to none/);
});

test('researched needs a spec with source records', () => {
    assert.match(
        run(course({ rows: [row('a', 1, '', 'researched')] }), 'check').out,
        /chapters\/a.md is missing/
    );
    assert.match(
        run(course({ rows: [row('a', 1, '', 'researched')], specs: { a: '# A\n' } }), 'check').out,
        /needs source records/
    );
    assert.equal(
        run(course({ rows: [row('a', 1, '', 'researched')], specs: { a: SEARCH } }), 'check').code,
        0
    );
});

test('unavailable/snippet-only sources cannot support claims once implemented', () => {
    const p = 'src/app/learn';
    const bad = run(
        course({ rows: [row('a', 1, '', 'implemented')], product: p, specs: { a: SEARCH } }),
        'check'
    );
    assert.match(bad.out, /via: search but supports claims/);
    const lead = SEARCH.replace('supports: [c1]', 'supports: none').replace(CONTENT, '');
    assert.equal(
        run(
            course({
                rows: [row('a', 1, '', 'implemented')],
                product: p,
                specs: { a: READ + lead.slice(12) },
            }),
            'check'
        ).code,
        0
    );
    assert.match(
        run(
            course({
                rows: [row('a', 1, '', 'researched')],
                specs: { a: '## Sources\n\n- id: x\n  supports: [c]\n' },
            }),
            'check'
        ).out,
        /needs via: read \| search/
    );
    const bare = run(
        course({
            rows: [row('a', 1, '', 'researched')],
            specs: { a: '## Sources\n\n- id: x\n  via: read\n' },
        }),
        'check'
    ).out;
    assert.match(bare, /source x needs a title/);
    assert.match(bare, /source x needs supports/);
});

test('content gates: placeholders and empty parts do not count', () => {
    const placeholder = READ.replace('Decision: text only', 'TEST-PLACEHOLDER: visual not authored');
    const r = run(course({ rows: [row('a', 1, '', 'authored')], specs: { a: placeholder } }), 'check');
    assert.match(r.out, /needs "## Visual" filled/);
    const noBoundary = READ.replace('Objectives: x', '...');
    assert.match(
        run(course({ rows: [row('a', 1, '', 'researched')], specs: { a: noBoundary } }), 'check').out,
        /needs "## Boundary" filled/
    );
    assert.equal(run(course({ rows: [row('a', 1, '', 'authored')], specs: { a: READ } }), 'check').code, 0);
    // The untouched chapter template (from chapter-workflow.md) must not pass as authored content.
    const md = readFileSync(join(dirname(SCRIPT), '../references/chapter-workflow.md'), 'utf8');
    const template = md.match(/```markdown\n([\s\S]*?)\n```/)[1];
    const t = run(
        course({
            rows: [row('a', 1, '', 'authored')],
            specs: { a: template + '\n' + READ.slice(READ.indexOf('## Sources')) },
        }),
        'check'
    );
    for (const h of ['Boundary', 'Explanation \\(14 questions\\)', 'Visual', 'Practice'])
        assert.match(t.out, new RegExp(`needs "## ${h}" filled`));
});

test('tested: a pass line that admits it was skipped is rejected', () => {
    const spec =
        READ + '\n## Evidence\n\n- browser 375×812: pass — screenshots skipped, browser unavailable\n';
    const r = run(
        course({ rows: [row('a', 1, '', 'tested')], product: 'src/app/learn', specs: { a: spec } }),
        'check'
    );
    assert.match(r.out, /says pass but also/);
});

test('tested: failed test or missing browser is not a pass', () => {
    const p = 'src/app/learn';
    const failed = READ + '\n## Evidence\n\n- typecheck: pass — tsc\n- model tests: fail — npm test\n';
    const noBrowser =
        READ + '\n## Evidence\n\n- typecheck: pass — tsc\n- browser 375×812: not run — no browser\n';
    assert.match(
        run(course({ rows: [row('a', 1, '', 'tested')], product: p, specs: { a: failed } }), 'check').out,
        /not a pass: "- model tests: fail/
    );
    assert.match(
        run(course({ rows: [row('a', 1, '', 'tested')], product: p, specs: { a: noBrowser } }), 'check').out,
        /not a pass: "- browser/
    );
    assert.match(
        run(course({ rows: [row('a', 1, '', 'tested')], product: p, specs: { a: READ } }), 'check').out,
        /needs check results/
    );
    assert.equal(
        run(course({ rows: [row('a', 1, '', 'tested')], product: p, specs: { a: READ + PASS } }), 'check')
            .code,
        0
    );
});

test('reviewed needs a reviewer; verified needs no open blocking or should-fix finding', () => {
    const p = 'src/app/learn';
    const spec = (findings) => READ + PASS + REVIEW + findings;
    assert.match(
        run(course({ rows: [row('a', 1, '', 'reviewed')], product: p, specs: { a: READ + PASS } }), 'check')
            .out,
        /needs a "Reviewer:"/
    );
    const open = run(
        course({
            rows: [row('a', 1, '', 'verified')],
            product: p,
            specs: { a: spec('- [blocking] wrong p99 → open\n') },
        }),
        'check'
    );
    assert.match(open.out, /verified with an open finding/);
    const closed = spec(
        '- [blocking] wrong p99 → fixed (model.ts)\n- [should-fix] x → accepted: covered later\n- [note] y → open\n'
    );
    assert.equal(
        run(course({ rows: [row('a', 1, '', 'verified')], product: p, specs: { a: closed } }), 'check').code,
        0
    );
});

test('show: unknown id fails; blocked prerequisite is reported', () => {
    const root = course({ rows: [row('a', 1, '', 'planned'), row('b', 2, 'a', 'planned')] });
    assert.equal(run(root, 'show', 'nope').code, 1);
    assert.match(run(root, 'show', 'b').out, /can start: no — waiting on a/);
    assert.match(run(root, 'show', 'a').out, /can start: yes/);
});

/** The ✗ lines `check` printed, so a fixture can only pass by failing for the intended reason. */
const failures = (out) =>
    out
        .split('\n')
        .filter((l) => l.startsWith('✗ '))
        .map((l) => l.slice(2));
const pathRow = (id, order, prereqs, paths) =>
    `| ${id} | ${order} | 1 | Title ${id} | ${prereqs} | ${paths} | planned |`;

test('paths are closed: a chapter on a path needs its prerequisites on that path', () => {
    const ok = [pathRow('a', 1, '', 'beginner interview'), pathRow('b', 2, 'a', 'interview')];
    assert.equal(run(course({ rows: ok }), 'check').code, 0);
    const open = [pathRow('a', 1, '', 'beginner'), pathRow('b', 2, 'a', 'beginner interview production')];
    const r = run(course({ rows: open }), 'check');
    assert.equal(r.code, 1);
    assert.deepEqual(failures(r.out), [
        'b: on path interview but its prerequisite a is not',
        'b: on path production but its prerequisite a is not',
    ]);
    // Transitive: each link is checked, so a gap anywhere in the chain is reported where it occurs.
    const chain = [
        pathRow('a', 1, '', 'interview'),
        pathRow('b', 2, 'a', 'beginner interview'),
        pathRow('c', 3, 'b', 'beginner'),
    ];
    assert.deepEqual(failures(run(course({ rows: chain }), 'check').out), [
        'b: on path beginner but its prerequisite a is not',
    ]);
});

test('malformed path and prerequisite entries fail for their own reason', () => {
    const cases = [
        [[pathRow('a', 1, '', 'beginner beginner')], ['a: path "beginner" listed twice']],
        [
            [pathRow('a', 1, '', 'beginner'), pathRow('b', 2, 'a a', 'beginner')],
            ['b: prerequisite "a" listed twice'],
        ],
        [[pathRow('a', 1, '', 'beginners')], ['a: unknown path "beginners"']],
        [
            [pathRow('a', 1, '', 'beginner'), pathRow('b', 2, 'x', 'beginner')],
            ['b: unknown prerequisite "x"'],
        ],
        [
            [pathRow('a', 1, 'b', 'beginner'), pathRow('b', 2, '', 'beginner')],
            ['a: prerequisite b must come earlier in order'],
        ],
        [
            [pathRow('a', 1, 'a', 'beginner')],
            ['a: prerequisite a must come earlier in order', 'cycle: a → a'],
        ],
    ];
    for (const [rows, want] of cases) {
        const r = run(course({ rows }), 'check');
        assert.equal(r.code, 1, rows.join('\n'));
        assert.deepEqual(failures(r.out), want);
    }
});

test('orphan chapter file is reported', () => {
    assert.match(
        run(course({ rows: [row('a', 1, '', 'planned')], specs: { old: '#' } }), 'check').out,
        /chapters\/old.md: no matching row/
    );
});

test('bad usage exits 2; the skill validates', () => {
    assert.equal(spawnSync(process.execPath, [SCRIPT, 'next', '--root']).status, 2);
    assert.equal(spawnSync(process.execPath, [SCRIPT, 'show']).status, 2);
    assert.equal(spawnSync(process.execPath, [SCRIPT, 'skill']).status, 0);
});

/** A visual-first spec: two objectives, given assets, optional extra lines (storyboard, review…). */
const asset = (n, type, extra = {}) =>
    `### A${n}. Asset\n\n` +
    Object.entries({
        objective: String(n),
        type,
        'learner sees': 'a host with two ports',
        'learner does': 'picks a port and runs',
        model: 'demux table: (proto, port) → process',
        assumptions: 'one host, no NAT',
        outcome: 'predicts the receiving process',
        accessibility: 'text summary in a live region',
        tests: 'model.test.ts',
        evidence: 'rfc9293 §3.4.1 (standard-defined)',
        ...extra,
    })
        .map(([k, v]) => `- ${k}: ${v}`)
        .join('\n') +
    '\n\n';
const visual = (assetsText, more = '') =>
    'Standard: visual-first\n\n' +
    READ.replace(LEGACY, '').replace('Objectives: x', 'Objectives:\n\n1. predict\n2. explain') +
    '\n## Storyboard\n\n1. the learner sees a host\n\n## Asset plan\n\n' +
    assetsText +
    more;

test('visual-first: a complete asset plan passes authored', () => {
    const spec = visual(asset(1, 'precision-2d') + asset(2, 'simulation'));
    const r = run(course({ rows: [row('a', 1, '', 'authored')], specs: { a: spec } }), 'check');
    assert.equal(r.code, 0, r.out);
});

test('visual-first: missing asset plan, fields, coverage and unknown type fail', () => {
    const rows = [row('a', 1, '', 'authored')];
    const none = run(course({ rows, specs: { a: visual('') } }), 'check');
    assert.match(none.out, /needs "## Asset plan"/);
    assert.match(none.out, /objective 1 has no asset/);
    const bad = run(course({ rows, specs: { a: visual(asset(1, 'hologram', { model: '...' })) } }), 'check');
    assert.match(bad.out, /unknown type "hologram"/);
    assert.match(bad.out, /A1 needs "model:" filled/);
    assert.match(bad.out, /objective 2 has no asset and no "- text-only: 2/);
    const textOnly = visual(asset(1, 'precision-2d') + '- text-only: 2 — a definition\n');
    assert.equal(run(course({ rows, specs: { a: textOnly } }), 'check').code, 0);
    const noStory = visual(asset(1, 'precision-2d') + asset(2, 'text')).replace(
        '1. the learner sees a host',
        '...'
    );
    assert.match(run(course({ rows, specs: { a: noStory } }), 'check').out, /"## Storyboard" filled/);
});

test('visual-first: modelled types need a real model; all-text plans need an exception', () => {
    const rows = [row('a', 1, '', 'authored')];
    const conceptual = visual(
        asset(1, 'simulation', { model: 'conceptual illustration' }) + asset(2, 'text')
    );
    assert.match(run(course({ rows, specs: { a: conceptual } }), 'check').out, /executable model/);
    const allText = visual(asset(1, 'text') + asset(2, 'illustration'));
    assert.match(run(course({ rows, specs: { a: allText } }), 'check').out, /Visual exception/);
    assert.equal(
        run(
            course({ rows, specs: { a: allText + '\nVisual exception: a pure definition chapter\n' } }),
            'check'
        ).code,
        0
    );
});

test('visual-first: implemented needs built paths that exist', () => {
    const rows = [row('a', 1, '', 'implemented')];
    const missing = run(
        course({ rows, product: 'src', specs: { a: visual(asset(1, 'precision-2d') + asset(2, 'text')) } }),
        'check'
    );
    assert.match(missing.out, /A1 needs "built:" paths/);
    assert.doesNotMatch(missing.out, /A2 needs "built:"/);
    const ghost = visual(asset(1, 'precision-2d', { built: '`src/nope.tsx`' }) + asset(2, 'text'));
    assert.match(
        run(course({ rows, product: 'src', specs: { a: ghost } }), 'check').out,
        /not an existing file: src\/nope\.tsx/
    );
    const root = course({
        rows,
        product: 'src',
        specs: { a: ghost.replace('src/nope.tsx', 'src/fig.tsx') },
        files: { 'src/fig.tsx': 'x' },
    });
    assert.equal(run(root, 'check').code, 0);
});

test('visual-first: built paths are files in the product, and modelled assets list their tests', () => {
    const rows = [row('a', 1, '', 'implemented')];
    const files = { 'src/fig.tsx': 'x', 'src/model.ts': 'x', 'src/model.test.ts': 'x' };
    const spec = (built, type = 'precision-2d') => visual(asset(1, type, { built }) + asset(2, 'text'));
    const out = (built, type) =>
        run(course({ rows, product: 'src', files, specs: { a: spec(built, type) } }), 'check');
    assert.match(out('`docs`').out, /not an existing file: docs/);
    assert.match(out('`docs/system-design/CURRICULUM.md`').out, /outside src\/ and the product/);
    assert.match(out('`src/fig.tsx`, `src/model.ts`', 'simulation').out, /must list its model's test file/);
    assert.equal(out('`src/fig.tsx`, `src/model.ts`, `src/model.test.ts`', 'simulation').code, 0);
});

test('visual-first: reviewed needs the visual review; verified needs it passing', () => {
    const ok =
        'text-heavy=no · mechanism-via-visual=yes · every-visual-teaches=yes · claims-defensible=yes · interaction-helps=yes';
    const base = (status, line) =>
        course({
            rows: [row('a', 1, '', status)],
            product: 'src',
            files: { 'src/fig.tsx': 'x' },
            specs: {
                a:
                    visual(asset(1, 'precision-2d', { built: '`src/fig.tsx`' }) + asset(2, 'text')) +
                    PASS +
                    REVIEW +
                    (line ? `Visual review: ${line}\n` : ''),
            },
        });
    assert.match(run(base('reviewed', ''), 'check').out, /needs a "Visual review:" line/);
    assert.match(run(base('reviewed', 'text-heavy=no'), 'check').out, /needs mechanism-via-visual=yes\|no/);
    assert.equal(run(base('reviewed', ok.replace('text-heavy=no', 'text-heavy=yes')), 'check').code, 0);
    assert.match(
        run(base('verified', ok.replace('text-heavy=no', 'text-heavy=yes')), 'check').out,
        /verified but the visual review says text-heavy=yes/
    );
    assert.equal(run(base('verified', ok), 'check').code, 0);
});

test('a spec needs a Standard line from authored on; legacy warns, a missing one fails, even at verified', () => {
    const rows = (status) => [row('a', 1, '', status)];
    const legacy = run(course({ rows: rows('authored'), specs: { a: READ } }), 'check');
    assert.equal(legacy.code, 0);
    assert.match(legacy.out, /! a: spec predates the visual-first standard/);
    const none = READ.replace(LEGACY, '') + PASS + REVIEW;
    const r = run(course({ rows: rows('verified'), product: 'src', specs: { a: none } }), 'check');
    assert.equal(r.code, 1);
    assert.match(r.out, /needs a "Standard: visual-first" line/);
    assert.equal(
        run(course({ rows: rows('researched'), specs: { a: READ.replace(LEGACY, '') } }), 'check').code,
        0
    );
});

test('evidence: one required check per line, n/a needs a reason; built paths cannot climb out of src', () => {
    const tested = (ev) =>
        run(
            course({
                rows: [row('a', 1, '', 'tested')],
                product: 'src',
                specs: { a: READ + '\n## Evidence\n\n' + ev },
            }),
            'check'
        ).out;
    assert.match(
        tested('- typecheck lint model tests browser keyboard reduced motion: pass\n'),
        /one required check per evidence line/
    );
    assert.match(tested('- typecheck: n/a\n'), /n\/a without a reason/);
    const spec = visual(asset(1, 'precision-2d', { built: '`src/../docs/notes.md`' }) + asset(2, 'text'));
    const out = run(
        course({
            rows: [row('a', 1, '', 'implemented')],
            product: 'src',
            files: { 'docs/notes.md': 'x' },
            specs: { a: spec },
        }),
        'check'
    ).out;
    assert.match(out, /plain relative path: src\/\.\.\/docs\/notes\.md/);
    const bare = READ.replace(LEGACY, 'Standard: legacy\n\n');
    assert.match(
        run(course({ rows: [row('a', 1, '', 'authored')], specs: { a: bare } }), 'check').out,
        /needs a reason/
    );
});

test('tested needs every required check recorded, not just any pass', () => {
    const r = run(
        course({
            rows: [row('a', 1, '', 'tested')],
            product: 'src',
            specs: { a: READ + '\n## Evidence\n\n- x: pass\n' },
        }),
        'check'
    );
    for (const k of ['typecheck', 'lint', 'model tests', 'the browser suite', 'keyboard', 'reduced motion'])
        assert.match(r.out, new RegExp(`needs an evidence line for ${k}`));
});

test('verified: open findings cannot hide behind spelling, case or a later arrow; reviewer must be fresh', () => {
    const v = (findings, reviewer = REVIEW) =>
        run(
            course({
                rows: [row('a', 1, '', 'verified')],
                product: 'src',
                specs: { a: READ + PASS + reviewer + findings },
            }),
            'check'
        );
    for (const f of [
        '- [should fix] invented chart → open\n',
        '- [Blocking] wrong number → open\n',
        '- [should-fix] the chart is invented → open; was not → fixed\n',
        '- [should-fix] x → accepted:\n',
    ])
        assert.match(v(f).out, /verified with an open finding/, f);
    for (const f of [
        '- [blocking] wrong -> still open → fixed\n',
        '- [should-fix] bad → fixed? no, open\n',
        '- **[blocking]** wrong → open\n',
        '- [must-fix] wrong → open\n',
    ])
        assert.match(v(f).out, /verified with an open finding/, f);
    assert.equal(v('- [should-fix] x → fixed (model.ts)\n- [note] y → open\n').code, 0);
    // An arrow in the finding's own words is not an outcome.
    assert.equal(v('- [blocking] "Two tabs → two connections" taught as fact → fixed (page.tsx)\n').code, 0);
    // A second findings section is read too.
    assert.match(
        v('- [note] fine\n\n## Notes\n\nx\n\n## Review findings\n\n- [blocking] hidden → open\n').out,
        /hidden/
    );
    assert.match(
        v('', '\n## Review findings\n\nReviewer: me — not independent, not fresh\n').out,
        /naming a fresh/
    );
    assert.match(
        v('', '\n## Review findings\n\nReviewer: me, 2026-01-02\n').out,
        /naming a fresh\/independent reviewer/
    );
});
