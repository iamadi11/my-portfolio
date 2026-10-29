import { execFileSync, spawnSync } from 'node:child_process';
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
const cwd = fileURLToPath(new URL('../../../..', import.meta.url));
const script = '.claude/skills/system-design-educator/scripts/context.mjs';
test('default context stays bounded after the whole curriculum is implemented', () => {
    const output = execFileSync(process.execPath, [script], { cwd, encoding: 'utf8' });
    assert.ok(output.length < 4000, `Context expanded to ${output.length} characters`);
    assert.match(output, /119 chapters/);
    assert.doesNotMatch(output, /\| capstone \|/);
});
test('chapter context includes its actual mechanism and sources without adjacent lessons', () => {
    const output = execFileSync(process.execPath, [script, 'object-storage'], { cwd, encoding: 'utf8' });
    assert.match(output, /"model":"upload"/);
    assert.match(output, /"sources":\["s3"\]/);
    assert.doesNotMatch(output, /"id":"transactions"/);
    assert.equal(spawnSync(process.execPath, [script, 'not-a-chapter'], { cwd }).status, 2);
});

test('broad chapter context names companion models and direct source URLs', () => {
    const output = execFileSync(process.execPath, [script, 'relational-model'], { cwd, encoding: 'utf8' });
    assert.match(output, /Companion models: 'sqlJoin', 'sqlSets'/);
    assert.match(output, /https:\/\/www.postgresql.org\/docs\/18\/tutorial-join.html/);
    assert.doesNotMatch(output, /"id":"storage-engines"/);
    assert.ok(output.length < 6000);
});
