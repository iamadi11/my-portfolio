#!/usr/bin/env node
// Course helper for the system-design-educator skill. No dependencies.
//
//   node course.mjs next  [--root <dir>]   next chapter from docs/system-design/CURRICULUM.md, with the reason
//   node course.mjs check [--root <dir>]   validate the learning graph and chapter files
//   node course.mjs skill                  validate this skill's own files (frontmatter, links, sizes)
//
// --root defaults to the current directory (the repo root when run by Claude Code).
// Exit code 0 = ok, 1 = problems found, 2 = usage or missing files.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const STATUSES = ['planned', 'researched', 'authored', 'implemented', 'tested', 'reviewed', 'verified'];
const PATHS = ['beginner', 'interview', 'production'];
const rank = (s) => STATUSES.indexOf(s);

const args = process.argv.slice(2);
const cmd = args[0];
const rootIdx = args.indexOf('--root');
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
        id: c[0],
        order: Number(c[1]),
        stage: c[2],
        title: c[3],
        prereqs: c[4] ? c[4].split(/\s+/) : [],
        paths: c[5] ? c[5].split(/\s+/) : [],
        status: c[6],
    }));
    return { chapters, product };
}

function currentUnit() {
    const file = join(docs, 'COURSE_STATE.md');
    if (!existsSync(file)) return null;
    const m = readFileSync(file, 'utf8').match(/## Current unit\s*\n+([^\n]+)/);
    const id = m?.[1]?.trim().split(/\s+/)[0];
    return id && id !== 'none' ? id : null;
}

function check(chapters) {
    const errs = [];
    const byId = new Map();
    const orders = new Set();
    for (const c of chapters) {
        if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(c.id)) errs.push(`${c.id}: id must be kebab-case`);
        if (byId.has(c.id)) errs.push(`${c.id}: duplicate id`);
        byId.set(c.id, c);
        if (!Number.isInteger(c.order)) errs.push(`${c.id}: order must be an integer`);
        if (orders.has(c.order)) errs.push(`${c.id}: duplicate order ${c.order}`);
        orders.add(c.order);
        if (!c.title) errs.push(`${c.id}: missing title`);
        if (rank(c.status) < 0)
            errs.push(`${c.id}: unknown status "${c.status}" (use ${STATUSES.join(', ')})`);
        if (!c.paths.length) errs.push(`${c.id}: on no path`);
        for (const p of c.paths) if (!PATHS.includes(p)) errs.push(`${c.id}: unknown path "${p}"`);
        if (rank(c.status) >= rank('researched') && !existsSync(join(docs, 'chapters', `${c.id}.md`)))
            errs.push(`${c.id}: status ${c.status} but docs/system-design/chapters/${c.id}.md is missing`);
    }
    for (const c of chapters)
        for (const p of c.prereqs) {
            const q = byId.get(p);
            if (!q) errs.push(`${c.id}: unknown prerequisite "${p}"`);
            else if (q.order >= c.order) errs.push(`${c.id}: prerequisite ${p} must come earlier in order`);
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

function next(chapters, product) {
    const byId = new Map(chapters.map((c) => [c.id, c]));
    const sorted = [...chapters].sort((a, b) => a.order - b.order);
    const done = !product || product === 'none' ? rank('authored') : rank('verified');
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
                    : 'every chapter is authored and there is no product yet: build the course product (mode A decides where)',
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

function report(errs) {
    if (errs.length) {
        for (const e of errs) console.log(`✗ ${e}`);
        process.exit(1);
    }
    console.log('✓ ok');
}

if (cmd === 'next') {
    const { chapters, product } = readGraph();
    const errs = check(chapters);
    if (errs.length) {
        console.log('Graph has errors; fix them first (course.mjs check).');
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
    if (!product) errs.push('CURRICULUM.md needs a "Product: <route or manifest path | none>" line');
    if (product === 'none')
        for (const c of chapters)
            if (rank(c.status) > rank('authored'))
                errs.push(`${c.id}: status ${c.status} but Product is none`);
    report(errs);
} else if (cmd === 'skill') {
    report(checkSkill());
} else {
    console.error('usage: course.mjs next|check|skill [--root <dir>]');
    process.exit(2);
}
