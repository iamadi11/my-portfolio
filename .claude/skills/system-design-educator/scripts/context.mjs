#!/usr/bin/env node
// Read-only, bounded context. Run from repository root.
import { readFileSync, existsSync } from 'node:fs';
const read = (p) => readFileSync(p, 'utf8');
const graph = read('docs/system-design/CURRICULUM.md').split('<!-- graph:start -->')[1].split('<!-- graph:end -->')[0];
const rows = graph.split('\n').filter(l => /^\| [a-z]/.test(l) && !l.startsWith('| id '));
const ids = process.argv.slice(2);
if (ids.some(id => !rows.some(l => l.split('|')[1].trim() === id))) {
    console.error('Unknown chapter id. Use ids from CURRICULUM.md.'); process.exit(2);
}
const state = read('docs/system-design/COURSE_STATE.md').split('## Decisions')[0];
console.log(state.slice(0, 2400));
console.log('Graph: id | order | stage | title | prerequisites | paths | status');
console.log((ids.length ? rows.filter(l => ids.includes(l.split('|')[1].trim())) : rows.filter(l => !l.endsWith('planned |'))).join('\n'));
console.log('Shared implementation: references/production.md (read only for builds).');
for (const id of ids) {
    const p = `docs/system-design/chapters/${id}.md`;
    console.log(`\n${id}: ${p} (${existsSync(p) ? 'exists' : 'not authored'})`);
    if (existsSync(p)) console.log(read(p).split('\n').filter(l => /^(Standard:|Implementation:|## |[- ]*(id:|url:|via:))/.test(l)).slice(0, 38).join('\n'));
}
