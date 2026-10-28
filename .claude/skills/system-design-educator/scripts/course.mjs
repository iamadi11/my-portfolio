#!/usr/bin/env node
// Course helper for the system-design-educator skill. No dependencies.
//
//   node course.mjs next  [--root <dir>]   next chapter from docs/system-design/CURRICULUM.md, with the reason
//   node course.mjs check [--root <dir>]   validate the graph, COURSE_STATE's current unit and each chapter's evidence
//   node course.mjs show <id> [--root <dir>]  one chapter: status, prerequisites, spec file, whether it can start
//   node course.mjs skill                  validate this skill's own files (frontmatter, links, sizes)
//
// --root defaults to the current directory (the repo root when run by Claude Code).
// Exit code 0 = ok, 1 = problems found, 2 = usage or missing files.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const STATUSES = ['planned', 'researched', 'authored', 'implemented', 'tested', 'reviewed', 'verified'];
const PATHS = ['beginner', 'interview', 'production'];
/** CURRICULUM's `Product:` value once the graph is read; `built:` paths may live there. */
let productPath = null;
const rank = (s) => STATUSES.indexOf(s);

const args = process.argv.slice(2);
const cmd = args[0];
const rootIdx = args.indexOf('--root');
if (rootIdx >= 0 && !args[rootIdx + 1]) usage();
const root = resolve(rootIdx >= 0 ? args[rootIdx + 1] : process.cwd());
const docs = join(root, 'docs/system-design');
const skillDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function readGraph() {
    const file = join(docs, 'CURRICULUM.md');
    if (!existsSync(file)) {
        console.error(`No ${file}. Run mode A (init) / mode B (curriculum) first.`);
        process.exit(2);
    }
    const text = readFileSync(file, 'utf8');
    const m = text.match(/<!-- graph:start -->([\s\S]*?)<!-- graph:end -->/);
    if (!m) {
        console.error('CURRICULUM.md has no <!-- graph:start --> … <!-- graph:end --> table.');
        process.exit(2);
    }
    const rows = m[1]
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.startsWith('|'))
        .map((l) =>
            l
                .slice(1, -1)
                .split('|')
                .map((c) => c.trim())
        );
    const [head, , ...body] = rows;
    const want = ['id', 'order', 'stage', 'title', 'prereqs', 'paths', 'status'];
    if (!head || want.some((w, i) => head[i] !== w)) {
        console.error(`Graph table header must be: | ${want.join(' | ')} |`);
        process.exit(2);
    }
    // `Product: none` (no app route yet) or the route/manifest path; until a product exists, chapters can only reach
    // `authored`, so `authored` counts as done for choosing the next chapter.
    const product = text.match(/^Product:\s*([^#\n]+)/m)?.[1]?.trim();
    const chapters = body.map((c) => ({
        cells: c.length,
        id: c[0],
        order: Number(c[1]),
        stage: c[2],
        title: c[3],
        prereqs: c[4] ? c[4].split(/\s+/) : [],
        paths: c[5] ? c[5].split(/\s+/) : [],
        status: c[6],
    }));
    productPath = product;
    return { chapters, product };
}

/** Lines of a `## heading` section (up to the next `## `), trimmed, blank lines dropped. */
function section(text, heading) {
    const lines = text.split('\n');
    const at = lines.findIndex((l) => l.trim().toLowerCase() === `## ${heading}`.toLowerCase());
    if (at < 0) return null;
    const out = [];
    for (const l of lines.slice(at + 1)) {
        if (l.startsWith('## ')) break;
        if (l.trim()) out.push(l.trim());
    }
    return out;
}

/** COURSE_STATE's `State:` line: true only when it exists and says initialized. */
function initialized() {
    const file = join(docs, 'COURSE_STATE.md');
    return existsSync(file) && /^State:\s*initialized\s*$/m.test(readFileSync(file, 'utf8'));
}

/** The chapter id named under COURSE_STATE's "Current unit" (first word), or null for none/missing. */
function currentUnit() {
    const file = join(docs, 'COURSE_STATE.md');
    if (!existsSync(file)) return null;
    const id = section(readFileSync(file, 'utf8'), 'Current unit')?.[0]?.split(/\s+/)[0];
    return id && id !== 'none' ? id : null;
}

/** Non-fatal findings `check` prints with `!` (e.g. a spec written before the visual-first standard). */
const warnings = [];

/** Checks every chapter with a page must record from `tested` on (references/verification.md, "Required checks"). */
const REQUIRED_EVIDENCE = [
    ['typecheck', /typecheck/],
    ['lint', /lint/],
    ['model tests', /model tests/],
    ['the browser suite or browser sizes', /browser/],
    ['keyboard', /keyboard/],
    ['reduced motion', /reduced motion/],
];

const ASSET_FIELDS = [
    'objective',
    'type',
    'learner sees',
    'learner does',
    'model',
    'assumptions',
    'outcome',
    'accessibility',
    'tests',
    'evidence',
];
const ASSET_TYPES = [
    'precision-2d',
    'animated-2d',
    'simulation',
    'chart',
    '3d',
    'illustration',
    'experiment',
    'text',
];
/** Types whose picture depends on inputs or time, so they need an executable model (references/visual-science.md). */
const MODELLED = ['animated-2d', 'simulation', 'chart', '3d'];
const VISUAL_REVIEW = {
    'text-heavy': 'no',
    'mechanism-via-visual': 'yes',
    'every-visual-teaches': 'yes',
    'claims-defensible': 'yes',
    'interaction-helps': 'yes',
};
const placeholder = (v) => !v || /(\.\.\.|…)$|<[^>]+>|TEST-PLACEHOLDER/.test(v) || !/\w/.test(v);

/** `### A<n>` entries under "## Asset plan", each as { name, fields: Map(key → value) }. */
function assets(text) {
    const out = [];
    for (const l of section(text, 'Asset plan') ?? []) {
        const head = l.match(/^###\s+(A\d+)\b/);
        if (head) out.push({ name: head[1], fields: new Map() });
        const field = l.match(/^- ([a-z][a-z -]*?):\s*(.*)$/);
        if (field && out.length) out.at(-1).fields.set(field[1], field[2].trim());
    }
    return out;
}

/** The visual-first standard (references/course-state.md, "Visual-first specs"); structure only. */
function visualErrors(c, text) {
    const errs = [];
    const standard = text.match(/^Standard:\s*(.*)$/m)?.[1].trim();
    if (rank(c.status) < rank('authored')) return errs;
    if (!standard)
        return [
            `${c.id}: status ${c.status} needs a "Standard: visual-first" line (or "Standard: legacy — <why>")`,
        ];
    if (/^legacy\b/.test(standard)) {
        warnings.push(`${c.id}: spec predates the visual-first standard (${standard}): audit it in mode D`);
        return errs;
    }
    if (standard !== 'visual-first')
        return [`${c.id}: unknown standard "${standard}" (visual-first, or legacy — <why>)`];
    const filled = (h) => (section(text, h) ?? []).some((l) => !placeholder(l) && !/^```/.test(l));
    if (!filled('Storyboard'))
        errs.push(`${c.id}: status ${c.status} needs "## Storyboard" filled (owned by authored)`);
    const list = assets(text);
    if (!list.length) errs.push(`${c.id}: status ${c.status} needs "## Asset plan" with "### A1 …" assets`);
    const covered = new Set();
    for (const a of list) {
        const at = `${c.id}: asset ${a.name}`;
        for (const f of ASSET_FIELDS)
            if (placeholder(a.fields.get(f))) errs.push(`${at} needs "${f}:" filled`);
        const type = a.fields.get('type');
        if (type && !ASSET_TYPES.includes(type))
            errs.push(`${at} has unknown type "${type}" (${ASSET_TYPES.join(', ')})`);
        if (MODELLED.includes(type))
            for (const f of ['model', 'assumptions'])
                if (/^(none|n\/a|conceptual\b)/i.test(a.fields.get(f) ?? ''))
                    errs.push(
                        `${at} is ${type}, so "${f}:" must describe an executable model, not "${a.fields.get(f)}"`
                    );
        for (const n of (a.fields.get('objective') ?? '').match(/\d+/g) ?? []) covered.add(Number(n));
        if (rank(c.status) >= rank('implemented') && type !== 'text') {
            const built = a.fields.get('built');
            const paths = built?.includes('`')
                ? [...built.matchAll(/`([^`]+)`/g)].map((m) => m[1])
                : (built ?? '').split(/[,;]\s*/);
            const real = paths.map((x) => x.trim()).filter(Boolean);
            if (!real.length || placeholder(built))
                errs.push(`${at} needs "built:" paths (status ${c.status})`);
            // Code the learner runs: files under src/ or the product route, not a folder or a doc.
            for (const x of real)
                if (!existsSync(join(root, x)) || !statSync(join(root, x)).isFile())
                    errs.push(`${at} built path is not an existing file: ${x}`);
                else if (
                    !x.startsWith('src/') &&
                    !(productPath && productPath !== 'none' && x.startsWith(productPath))
                )
                    errs.push(`${at} built path is outside src/ and the product: ${x}`);
            if (MODELLED.includes(type) && !real.some((x) => /\.test\.[a-z]+$/.test(x)))
                errs.push(`${at} is ${type}: "built:" must list its model's test file (*.test.*)`);
        }
    }
    for (const l of section(text, 'Asset plan') ?? []) {
        const t = l.match(/^- text-only:\s*(\d+)\s*[—-]+\s*(\S.*)$/);
        if (t) covered.add(Number(t[1]));
    }
    const objectives = (section(text, 'Boundary') ?? [])
        .map((l) => l.match(/^(\d+)\.\s/)?.[1])
        .filter(Boolean);
    if (!objectives.length) errs.push(`${c.id}: "## Boundary" needs numbered objectives (1. …)`);
    for (const n of objectives)
        if (!covered.has(Number(n)))
            errs.push(`${c.id}: objective ${n} has no asset and no "- text-only: ${n} — <reason>" line`);
    if (
        list.length &&
        list.every((a) => ['text', 'illustration'].includes(a.fields.get('type'))) &&
        !/^Visual exception:\s*\S/m.test(text)
    )
        errs.push(
            `${c.id}: every asset is text or illustration; add an explanatory asset or a "Visual exception:" line`
        );
    if (rank(c.status) >= rank('reviewed')) {
        const line = (section(text, 'Review findings') ?? []).find((l) => /^Visual review:/.test(l));
        if (!line)
            errs.push(`${c.id}: status ${c.status} needs a "Visual review:" line under "## Review findings"`);
        else
            for (const [k, pass] of Object.entries(VISUAL_REVIEW)) {
                const v = line.match(new RegExp(`\\b${k}=(yes|no)\\b`))?.[1];
                if (!v) errs.push(`${c.id}: "Visual review:" needs ${k}=yes|no`);
                else if (c.status === 'verified' && v !== pass)
                    errs.push(`${c.id}: verified but the visual review says ${k}=${v}`);
            }
    }
    return errs;
}

/**
 * What a chapter spec must contain for its status (formats in references/course-state.md). Structure only: the
 * script can't judge quality, but it stops a status from claiming evidence that isn't written down.
 */
function specErrors(c) {
    const file = join(docs, 'chapters', `${c.id}.md`);
    if (rank(c.status) < rank('researched')) return [];
    if (!existsSync(file))
        return [`${c.id}: status ${c.status} but docs/system-design/chapters/${c.id}.md is missing`];
    const text = readFileSync(file, 'utf8');
    const errs = [];
    const sources = (section(text, 'Sources') ?? [])
        .join('\n')
        .split(/^- id:/m)
        .slice(1);
    if (!sources.length) errs.push(`${c.id}: status ${c.status} needs source records under "## Sources"`);
    for (const rec of sources) {
        const id = rec.split('\n')[0].trim();
        const via = rec.match(/^via:\s*(\S+)/m)?.[1];
        const supports = rec.match(/^supports:\s*(.*)$/m)?.[1]?.trim();
        if (via !== 'read' && via !== 'search') errs.push(`${c.id}: source ${id} needs via: read | search`);
        if (!/^title:\s*\S/m.test(rec)) errs.push(`${c.id}: source ${id} needs a title`);
        if (supports === undefined) errs.push(`${c.id}: source ${id} needs supports: [...] or none`);
        // From `implemented` on, the chapter is in front of learners: unread sources may stay only as leads.
        if (rank(c.status) >= rank('implemented') && via !== 'read' && !/^(none|\[\])$/.test(supports ?? ''))
            errs.push(
                `${c.id}: source ${id} is via: ${via} but supports claims (read it, replace it, or set supports: none)`
            );
    }
    // Content parts a gate owns must be filled: a line that isn't template text (ends in `...`, holds a <slot>) or a
    // test placeholder.
    const filled = (h) =>
        (section(text, h) ?? []).some(
            (l) => !/(\.\.\.|…)$|<[^>]+>|TEST-PLACEHOLDER|^```/.test(l) && /\w/.test(l)
        );
    const parts = [['Boundary', 'researched']];
    if (rank(c.status) >= rank('authored'))
        parts.push(
            ['Explanation (14 questions)', 'authored'],
            ['Visual', 'authored'],
            ['Practice', 'authored']
        );
    for (const [h, gate] of parts)
        if (!filled(h)) errs.push(`${c.id}: status ${c.status} needs "## ${h}" filled (owned by ${gate})`);
    if (rank(c.status) >= rank('tested')) {
        const ev = (section(text, 'Evidence') ?? []).filter((l) => l.startsWith('- '));
        if (!ev.length) errs.push(`${c.id}: status ${c.status} needs check results under "## Evidence"`);
        for (const l of ev)
            if (!/^- [^:]+: (pass|n\/a)\b/.test(l))
                errs.push(
                    `${c.id}: evidence line is not a pass: "${l}" (a failed or not-run check means not tested)`
                );
            else if (/^- [^:]+: pass\b.*\b(not run|unavailable|skipped|n\/a|fail(ed|s)?)\b/i.test(l))
                errs.push(`${c.id}: evidence line says pass but also skipped/unavailable/failed/n/a: "${l}"`);
        const keys = ev.map((l) => l.slice(2, l.indexOf(':')).toLowerCase());
        for (const [name, re] of REQUIRED_EVIDENCE)
            if (!keys.some((k) => re.test(k)))
                errs.push(
                    `${c.id}: status ${c.status} needs an evidence line for ${name} (pass, or n/a — reason)`
                );
    }
    if (rank(c.status) >= rank('reviewed')) {
        const rv = section(text, 'Review findings') ?? [];
        // A self-review is a note, never a "Reviewer:" line (references/verification.md).
        if (!rv.some((l) => /^Reviewer:.*\b(fresh|independent|subagent)\b/i.test(l)))
            errs.push(
                `${c.id}: status ${c.status} needs a "Reviewer:" line naming a fresh/independent reviewer under "## Review findings"`
            );
        // The first "→" carries the outcome, so "→ open; … → fixed" stays open.
        if (c.status === 'verified')
            for (const l of rv)
                if (/^- \[(blocking|should[- ]fix)\]/i.test(l) && !/^[^→]*→ (fixed\b|accepted: \S)/.test(l))
                    errs.push(`${c.id}: verified with an open finding: "${l}"`);
    }
    errs.push(...visualErrors(c, text));
    return errs;
}

function check(chapters) {
    const errs = [];
    const byId = new Map();
    const orders = new Set();
    for (const c of chapters) {
        if (c.cells !== 7) errs.push(`${c.id || '(blank id)'}: row has ${c.cells} cells, expected 7`);
        if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(c.id)) errs.push(`${c.id}: id must be kebab-case`);
        if (byId.has(c.id)) errs.push(`${c.id}: duplicate id`);
        byId.set(c.id, c);
        if (!Number.isInteger(c.order)) errs.push(`${c.id}: order must be an integer`);
        if (!/^\d+$/.test(c.stage)) errs.push(`${c.id}: stage must be a number`);
        if (orders.has(c.order)) errs.push(`${c.id}: duplicate order ${c.order}`);
        orders.add(c.order);
        if (!c.title) errs.push(`${c.id}: missing title`);
        if (rank(c.status) < 0)
            errs.push(`${c.id}: unknown status "${c.status}" (use ${STATUSES.join(', ')})`);
        if (!c.paths.length) errs.push(`${c.id}: on no path`);
        for (const p of c.paths) if (!PATHS.includes(p)) errs.push(`${c.id}: unknown path "${p}"`);
        for (const [what, list] of [
            ['path', c.paths],
            ['prerequisite', c.prereqs],
        ])
            for (const x of new Set(list.filter((x, i) => list.indexOf(x) !== i)))
                errs.push(`${c.id}: ${what} "${x}" listed twice`);
        errs.push(...specErrors(c));
    }
    const unit = currentUnit();
    if (unit && !byId.has(unit)) errs.push(`COURSE_STATE current unit "${unit}" is not a chapter id`);
    for (const c of chapters)
        for (const p of c.prereqs) {
            const q = byId.get(p);
            if (!q) errs.push(`${c.id}: unknown prerequisite "${p}"`);
            else if (q.order >= c.order) errs.push(`${c.id}: prerequisite ${p} must come earlier in order`);
            // Paths are closed: a learner following a path never needs a chapter outside it. (Order within a
            // path is the global order, so the check above already covers it.)
            else
                for (const path of c.paths)
                    if (PATHS.includes(path) && !q.paths.includes(path))
                        errs.push(`${c.id}: on path ${path} but its prerequisite ${p} is not`);
        }
    // Cycles (order check already forbids them, but report them plainly if orders are broken).
    const seen = new Map();
    const visit = (id, trail) => {
        if (seen.get(id) === 'done') return;
        if (seen.get(id) === 'open') {
            errs.push(`cycle: ${[...trail, id].join(' → ')}`);
            return;
        }
        seen.set(id, 'open');
        for (const p of byId.get(id)?.prereqs ?? []) visit(p, [...trail, id]);
        seen.set(id, 'done');
    };
    for (const c of chapters) visit(c.id, []);
    // Orphan chapter files.
    const dir = join(docs, 'chapters');
    if (existsSync(dir))
        for (const f of readdirSync(dir))
            if (f.endsWith('.md') && !byId.has(f.slice(0, -3)))
                errs.push(`chapters/${f}: no matching row in the graph`);
    return errs;
}

/** The status at which a chapter counts as finished: `authored` while there is no product, else `verified`. */
const doneRank = (product) => (!product || product === 'none' ? rank('authored') : rank('verified'));

function next(chapters, product) {
    if (!chapters.length)
        return { chapter: null, reason: 'the graph has no chapters: run mode B (curriculum)' };
    const byId = new Map(chapters.map((c) => [c.id, c]));
    const sorted = [...chapters].sort((a, b) => a.order - b.order);
    const done = doneRank(product);
    const resume = byId.get(currentUnit());
    if (resume && rank(resume.status) < done)
        return { chapter: resume, reason: `COURSE_STATE current unit (status ${resume.status}): resume it` };
    const started = sorted.find((c) => rank(c.status) > rank('planned') && rank(c.status) < done);
    if (started)
        return { chapter: started, reason: `in progress (status ${started.status}): finish it first` };
    for (const c of sorted) {
        if (c.status !== 'planned') continue;
        const blocking = c.prereqs.filter((p) => rank(byId.get(p)?.status) < rank('authored'));
        if (!blocking.length)
            return { chapter: c, reason: 'lowest-order planned chapter with prerequisites authored' };
    }
    const planned = sorted.find((c) => c.status === 'planned');
    if (!planned)
        return {
            chapter: null,
            reason:
                done === rank('verified')
                    ? 'every chapter is verified: run mode B to extend the curriculum'
                    : 'every chapter is authored and Product is none: implementation starts when the owner asks (chapter <id> on the first chapter)',
        };
    return { chapter: null, reason: `blocked: ${planned.id} waits on ${planned.prereqs.join(', ')}` };
}

function checkSkill() {
    const errs = [];
    const skill = join(skillDir, 'SKILL.md');
    const text = readFileSync(skill, 'utf8');
    const fm = text.match(/^---\n([\s\S]*?)\n---\n/);
    if (!fm) return ['SKILL.md: frontmatter must start on line 1 between --- markers'];
    const field = (k) => fm[1].match(new RegExp(`^${k}:\\s*(.*)$`, 'm'))?.[1]?.trim();
    const name = field('name');
    const desc = field('description');
    if (!name || !/^[a-z0-9-]{1,64}$/.test(name))
        errs.push('name: 1–64 chars, lowercase letters, digits, hyphens');
    if (name && name !== skillDir.split('/').pop()) errs.push('name should match the directory name');
    if (!desc) errs.push('description missing');
    else {
        if (desc.length > 1024) errs.push(`description is ${desc.length} chars (max 1024)`);
        if (/[<>]/.test(desc)) errs.push('description must not contain < or >');
        if (!/\bUse when\b/i.test(desc)) errs.push('description should say when to use the skill');
    }
    const bodyLines = text.slice(fm[0].length).split('\n').length;
    if (bodyLines > 500) errs.push(`SKILL.md body is ${bodyLines} lines (keep under 500)`);
    // Every markdown link in SKILL.md resolves; every reference file is linked from SKILL.md.
    const links = [...text.matchAll(/\]\(([^)#]+)\)/g)].map((m) => m[1]).filter((l) => !/^https?:/.test(l));
    for (const l of links) if (!existsSync(join(skillDir, l))) errs.push(`SKILL.md links to missing ${l}`);
    const refDir = join(skillDir, 'references');
    for (const f of readdirSync(refDir)) {
        if (!links.includes(`references/${f}`)) errs.push(`references/${f} is not linked from SKILL.md`);
        const ref = readFileSync(join(refDir, f), 'utf8');
        const n = ref.split('\n').length;
        if (n > 100 && !/^## Contents/m.test(ref))
            errs.push(`references/${f}: ${n} lines and no "## Contents"`);
        // References stay one level deep: no links to other reference files.
        if (/\]\((?!https?:)[^)]*\.md\)/.test(ref))
            errs.push(`references/${f} links to another file (keep one level)`);
    }
    return errs;
}

function show(chapters, product, id) {
    const byId = new Map(chapters.map((c) => [c.id, c]));
    const c = byId.get(id);
    if (!c) {
        console.log(`✗ no chapter "${id}". Ids: ${chapters.map((x) => x.id).join(', ') || '(none)'}`);
        process.exit(1);
    }
    const blocking = c.prereqs.filter((p) => rank(byId.get(p)?.status) < rank('authored'));
    const spec = existsSync(join(docs, 'chapters', `${c.id}.md`));
    console.log(`${c.id} — ${c.title}\nstatus: ${c.status} · spec: ${spec ? 'present' : 'missing'}`);
    console.log(`prereqs: ${c.prereqs.map((p) => `${p} (${byId.get(p)?.status})`).join(', ') || 'none'}`);
    if (blocking.length) console.log(`can start: no — waiting on ${blocking.join(', ')} (must be authored)`);
    else if (c.status === 'verified') console.log('can start: done — use audit to change it');
    else if (rank(c.status) >= doneRank(product))
        console.log(
            'can start: authored and Product is none — continuing means implementing it (owner asked?)'
        );
    else console.log('can start: yes');
}

function usage() {
    console.error('usage: course.mjs next | check | show <id> | skill  [--root <dir>]');
    process.exit(2);
}

function report(errs) {
    if (errs.length) {
        for (const e of errs) console.log(`✗ ${e}`);
        process.exit(1);
    }
    console.log('✓ ok');
}

if (cmd === 'next') {
    if (!initialized()) {
        console.log('next: mode A\nreason: COURSE_STATE.md is missing or not "State: initialized"');
        process.exit(0);
    }
    const { chapters, product } = readGraph();
    const errs = check(chapters);
    if (errs.length) {
        console.log('State has errors; fix them first (course.mjs check).');
        report(errs);
    }
    const { chapter, reason } = next(chapters, product);
    console.log(
        chapter
            ? `next: ${chapter.id} — ${chapter.title}\nreason: ${reason}`
            : `next: none\nreason: ${reason}`
    );
} else if (cmd === 'check') {
    const { chapters, product } = readGraph();
    console.log(`${chapters.length} chapters · product: ${product ?? 'missing'}`);
    const errs = check(chapters);
    for (const w of warnings) console.log(`! ${w}`);
    if (!initialized())
        console.log('! COURSE_STATE.md is missing or not "State: initialized": mode A comes first');
    const unit = currentUnit();
    const u = chapters.find((c) => c.id === unit);
    if (u && rank(u.status) >= doneRank(product))
        console.log(`! COURSE_STATE current unit ${unit} is already ${u.status}: set it to none`);
    if (!product) errs.push('CURRICULUM.md needs a "Product: <route or manifest path | none>" line');
    if (product === 'none')
        for (const c of chapters)
            if (rank(c.status) > rank('authored'))
                errs.push(`${c.id}: status ${c.status} but Product is none`);
    report(errs);
} else if (cmd === 'show' && args[1] && args[1] !== '--root') {
    const { chapters, product } = readGraph();
    show(chapters, product, args[1]);
} else if (cmd === 'skill') {
    report(checkSkill());
} else usage();
