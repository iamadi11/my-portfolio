#!/usr/bin/env node
/** Asserts the host's question matching and spoken forms against src/content/site.ts. `npm run check:host` */
import assert from 'node:assert/strict';

import { allLines, buildScript, match } from '../src/components/host/script.ts';
import { HOST, SITE } from '../src/content/site.ts';

const script = buildScript(SITE, HOST);
const answer = (q) => match(q, script.intents)?.line.text ?? null;

// Specific beats generic; unknown stays unknown.
assert.match(answer('Tell me about Eidos'), /^Eidos:/);
assert.match(answer('what did you do at tata 1mg'), /^At Tata 1mg/);
assert.match(answer('do you know Redis?'), /Redis is part of/);
assert.equal(answer('do you know Rust?'), null);
assert.equal(answer('what is the meaning of life'), null);
assert.match(answer('how do I reach you'), /email/);

// Every line has audio-safe spoken text and a stable id.
const lines = allLines(script);
assert.equal(new Set(lines.map((l) => l.id)).size, lines.length);
for (const line of lines) assert.doesNotMatch(line.speak, /[~@]|\d{5,}|(Engineer|Developer|Lead|SDE) I{1,3}\b/, line.speak);

console.log(`host ok: ${lines.length} lines, ${script.intents.length} intents, ${script.tour.length} tour stops`);
