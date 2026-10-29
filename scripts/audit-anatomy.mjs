import { buildSync } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import * as A from '../.claude/skills/anatomy/kit/audit.mjs';
const bundle = buildSync({
    stdin: {
        contents: "export {HARDWARE,HARDWARE_PROJECTION} from './src/components/anatomy/hardware'",
        resolveDir: process.cwd(),
        loader: 'ts',
    },
    bundle: true,
    platform: 'node',
    format: 'cjs',
    write: false,
});
const scope = { module: { exports: {} } };
runInNewContext(bundle.outputFiles[0].text, scope);
const { HARDWARE, HARDWARE_PROJECTION: P } = scope.module.exports;
const orders = {};
let errors = 0;
for (const [kind, art] of Object.entries(HARDWARE)) {
    const R = A.recorder(P);
    for (const part of art.parts) {
        const shape = A.slab(
            { x: part.x, y: part.y, w: part.w, d: part.d, r: Math.min(1.2, part.w / 5, part.d / 5) },
            part.z,
            part.h,
            { name: part.id },
            3
        );
        R.solid(shape);
        R.put({
            name: part.id,
            piece: part.id,
            at: [part.x + part.w / 2, part.y + part.d / 2, part.z + part.h / 2],
            shapes: [shape],
        });
    }
    const settled = A.settle(R, P, { states: [0], skip: () => false });
    const depth = A.depthOrder(R.items, P, { overlaps: settled.overlaps, solved: settled.solved });
    orders[kind] = [...R.items].sort((a, b) => a.key - b.key).map((item) => item.name);
    const problems = depth.problems.length + depth.missing.length;
    errors += problems;
    console.log(
        JSON.stringify({
            kind,
            parts: art.parts.length,
            depthProblems: problems,
            details: depth.problems.slice(0, 3),
        })
    );
}
if (process.argv.includes('--write') && !errors)
    writeFileSync('src/components/anatomy/order.json', JSON.stringify(orders, null, 2) + '\n');
else {
    const recorded = JSON.parse(readFileSync('src/components/anatomy/order.json', 'utf8'));
    if (JSON.stringify(recorded) !== JSON.stringify(orders)) {
        console.error('Anatomy order artifact is stale; rerun with --write.');
        errors++;
    }
}
if (errors) process.exitCode = 1;
