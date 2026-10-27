// Tests for course.mjs: `node --test .claude/skills/system-design-educator/scripts/course.test.mjs`. No dependencies; each case
// builds a throwaway course in the OS temp folder, never touching the real docs/system-design.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
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
function course({ rows = [], product = 'none', unit, specs = {}, raw } = {}) {
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
    if (unit !== undefined)
        writeFileSync(
            join(docs, 'COURSE_STATE.md'),
            `# Course state\n\n## Current unit\n\n${unit}\n\n## Next action\n\nx\n`
        );
    for (const [id, text] of Object.entries(specs)) writeFileSync(join(docs, 'chapters', `${id}.md`), text);
    return root;
}

function run(root, ...args) {
    const r = spawnSync(process.execPath, [SCRIPT, ...args, '--root', root], { encoding: 'utf8' });
    return { code: r.status, out: r.stdout + r.stderr };
}

const READ = '## Sources\n\n- id: rfc9110\n  via: read\n  supports: [c1]\n';
const SEARCH = '## Sources\n\n- id: rfc9110\n  via: search\n  supports: [c1]\n';
const PASS =
    '\n## Evidence\n\n- typecheck: pass — tsc (2026-01-01)\n- browser: pass — playwright (2026-01-01)\n';
const REVIEW = '\n## Review findings\n\nReviewer: fresh subagent, 2026-01-02\n';

test('fresh graph: next is the first chapter', () => {
    const r = run(course({ rows: [row('a', 1, '', 'planned'), row('b', 2, 'a', 'planned')] }), 'next');
    assert.equal(r.code, 0);
    assert.match(r.out, /next: a\b/);
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
    const lead = SEARCH.replace('supports: [c1]', 'supports: none');
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
