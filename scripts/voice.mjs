#!/usr/bin/env node
/**
 * Pre-renders every line the /v2 host can say, on this machine, with the Kokoro voice
 * (HeadTTS, CPU). Visitors then download small MP3s + viseme timings instead of a TTS model.
 *
 *   npm run voice        needs ffmpeg; re-run after editing src/content/site.ts
 *
 * Output: public/voice/<line-id>.mp3 + <line-id>.json. Unchanged lines are skipped,
 * lines that no longer exist are deleted. First run downloads the model (~92 MB) and voice.
 */
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { allLines, buildScript } from '../src/components/host/script.ts';
import { HOST, SITE } from '../src/content/site.ts';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = join(ROOT, 'public/voice');
const CACHE = join(ROOT, 'node_modules/.cache/headtts');
const PKG = join(ROOT, 'node_modules/@met4citizen/headtts');
const PORT = 8800 + Math.floor(Math.random() * 100);

const lines = allLines(buildScript(SITE, HOST));
mkdirSync(OUT, { recursive: true });
mkdirSync(join(CACHE, 'voices'), { recursive: true });

const keep = new Set(lines.flatMap((line) => [`${line.id}.mp3`, `${line.id}.json`]));
for (const file of readdirSync(OUT)) if (!keep.has(file)) rmSync(join(OUT, file));
const todo = lines.filter((line) => !existsSync(join(OUT, `${line.id}.json`)));
console.log(`voice: ${lines.length} lines, ${todo.length} to render (${HOST.voice})`);
if (!todo.length) process.exit(0);

const voiceFile = join(CACHE, 'voices', `${HOST.voice}.bin`);
if (!existsSync(voiceFile)) {
    const url = `https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/voices/${HOST.voice}.bin`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`voice ${HOST.voice}: HTTP ${res.status} from ${url}`);
    writeFileSync(voiceFile, Buffer.from(await res.arrayBuffer()));
}

const config = join(CACHE, 'server.json');
writeFileSync(
    config,
    JSON.stringify({
        server: { port: PORT, websocket: false, rest: true, corsOrigin: null },
        tts: {
            threads: 1,
            // HeadTTS's postinstall leaves an empty @huggingface/transformers folder in its own
            // node_modules that shadows the real package, so point at the hoisted one.
            transformersModule: pathToFileURL(join(ROOT, 'node_modules/@huggingface/transformers/dist/transformers.node.mjs')).href,
            dtype: 'q8',
            device: 'cpu',
            voices: [HOST.voice],
            voicePath: join(CACHE, 'voices'),
            dictionaryPath: join(PKG, 'dictionaries'),
            defaults: { voice: HOST.voice, language: 'en-us', speed: 1, audioEncoding: 'wav' },
        },
    })
);
const server = spawn(process.execPath, [join(PKG, 'modules/headtts-node.mjs'), '--config', config], {
    cwd: PKG,
    stdio: ['ignore', 'inherit', 'inherit'],
});

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
const api = `http://127.0.0.1:${PORT}/v1`;

try {
    for (let i = 0; ; i++) {
        if (i > 60) throw new Error('HeadTTS server did not start');
        if (await fetch(`${api}/hello`, { method: 'POST' }).then((r) => r.ok, () => false)) break;
        await sleep(500);
    }

    const wav = join(tmpdir(), `voice-${PORT}.wav`);
    for (const [i, line] of todo.entries()) {
        const res = await fetch(`${api}/synthesize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input: line.speak, voice: HOST.voice, language: 'en-us', audioEncoding: 'wav' }),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(`"${line.speak}": ${data.error ?? res.status}`);

        writeFileSync(wav, Buffer.from(data.audio, 'base64'));
        execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wav, '-ac', '1', '-b:a', '40k', join(OUT, `${line.id}.mp3`)]);
        const end = data.vtimes.length
            ? Math.max(...data.vtimes.map((t, k) => t + data.vdurations[k]))
            : Math.max(0, ...data.wtimes.map((t, k) => t + data.wdurations[k]));
        writeFileSync(
            join(OUT, `${line.id}.json`),
            JSON.stringify({
                text: line.text,
                visemes: data.visemes,
                vtimes: data.vtimes,
                vdurations: data.vdurations,
                duration: end,
            })
        );
        console.log(`  ${i + 1}/${todo.length} ${line.id}  ${line.text.slice(0, 60)}`);
    }
    rmSync(wav, { force: true });
} finally {
    server.kill();
}
