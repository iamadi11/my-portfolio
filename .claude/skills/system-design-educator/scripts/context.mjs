#!/usr/bin/env node
// Read-only context. Output cost grows with requested ids, never with the whole library.
import { readFileSync, existsSync } from 'node:fs';
const read = (p) => readFileSync(p, 'utf8');
const graph = read('docs/system-design/CURRICULUM.md')
    .split('<!-- graph:start -->')[1]
    .split('<!-- graph:end -->')[0];
const rows = graph.split('\n').filter((l) => /^\| [a-z]/.test(l) && !l.startsWith('| id '));
const ids = [...new Set(process.argv.slice(2))];
if (ids.some((id) => !rows.some((l) => l.split('|')[1].trim() === id))) {
    console.error('Unknown chapter id. Use ids from CURRICULUM.md.');
    process.exit(2);
}
const state = read('docs/system-design/COURSE_STATE.md').split('## Decisions')[0];
console.log(state.slice(0, 1800));
if (!ids.length) {
    const statuses = {};
    const stages = {};
    for (const row of rows) {
        const c = row.split('|').map((s) => s.trim());
        statuses[c[7]] = (statuses[c[7]] ?? 0) + 1;
        stages[c[3]] = (stages[c[3]] ?? 0) + 1;
    }
    console.log(
        `${rows.length} chapters. Status counts: ${JSON.stringify(statuses)}. Stage sizes: ${JSON.stringify(stages)}.`
    );
    console.log(
        'Pass chapter ids for bounded objective/model/source context; use course.mjs show <id> for graph detail.'
    );
} else {
    const path = 'src/content/learn/academy-lessons.json';
    const lessons = existsSync(path) ? JSON.parse(read(path)) : [];
    console.log('Graph: id | order | stage | title | prerequisites | paths | status');
    for (const id of ids) {
        console.log(rows.find((l) => l.split('|')[1].trim() === id));
        const lesson = lessons.find((l) => l.id === id);
        if (lesson) console.log(JSON.stringify(lesson));
        const p = `docs/system-design/chapters/${id}.md`;
        console.log(`${p} (${existsSync(p) ? 'exists' : 'not authored'})`);
        if (!lesson && existsSync(p))
            console.log(
                read(p)
                    .split('\n')
                    .filter((l) => /^(Standard:|Implementation:|## |[- ]*(id:|url:|via:))/.test(l))
                    .slice(0, 24)
                    .join('\n')
            );
    }
}
console.log(
    'Shared implementation: references/production.md. Review evidence: docs/system-design/EXPANSION_QA.md. Read only relevant files.'
);
