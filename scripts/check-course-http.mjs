// Production HTTP and delivered-script checks. Browser interaction/visual review is separate.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import { join } from 'node:path';
import { gunzipSync, gzipSync } from 'node:zlib';

const base = new URL(process.env.LEARN_BASE_URL ?? 'http://127.0.0.1:3201');
const dist = process.env.NEXT_DIST_DIR ?? '.next';
const graph = readFileSync('docs/system-design/CURRICULUM.md', 'utf8').split('<!-- graph:start -->')[1].split('<!-- graph:end -->')[0];
const ids = graph.split('\n').filter((line) => /^\| [a-z]/.test(line) && !line.startsWith('| id ')).map((line) => line.split('|')[1].trim());
function request(path) {
    const url = new URL(path, base);
    return new Promise((resolve, reject) => {
        const req = (url.protocol === 'https:' ? https : http).get(url, { headers: { 'Accept-Encoding': 'gzip' } }, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                const bytes = Buffer.concat(chunks);
                resolve({ status: res.statusCode, bytes: bytes.length, text: (res.headers['content-encoding'] === 'gzip' ? gunzipSync(bytes) : bytes).toString('utf8') });
            });
        });
        req.setTimeout(15000, () => req.destroy(new Error(`Timed out: ${url.pathname}`)));
        req.on('error', reject);
    });
}
const paths = ['/', '/learn', '/learn/sources', '/sitemap.xml', ...ids.map((id) => `/learn/${id}`)];
const pages = new Map();
const pending = [...paths];
const errors = [];
await Promise.all(Array.from({ length: 6 }, async () => {
    while (pending.length) {
        const path = pending.shift();
        try {
            const response = await request(path);
            pages.set(path, response);
            if (response.status !== 200) errors.push(`${path}: ${response.status}`);
            if (path.startsWith('/learn/') && path !== '/learn/sources') {
                if (!/<h1\b/.test(response.text) || !/role="tablist"/.test(response.text)) errors.push(`${path}: lesson structure missing`);
                for (const name of ['Learn', 'Explore', 'Assess']) if (!new RegExp(`role="tab"[^>]*>${name}<`).test(response.text)) errors.push(`${path}: ${name} tab missing`);
            }
        } catch (error) { errors.push(`${path}: ${error.message}`); }
    }
}));
const unknown = await request('/learn/unknown-chapter-for-qa');
if (unknown.status !== 404) errors.push(`Unknown chapter returned ${unknown.status}`);
const scripts = new Map();
const routeBytes = {};
for (const path of ['/', '/learn', '/learn/web-request', '/learn/rest', '/learn/load-balancing', '/learn/logs-streams', '/learn/caching-basics', '/learn/capstone']) {
    const html = pages.get(path)?.text ?? '';
    const urls = [...new Set([...html.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map((match) => match[1]))];
    let bytes = 0;
    for (const url of urls) {
        if (!scripts.has(url)) scripts.set(url, await request(url));
        const asset = scripts.get(url);
        if (asset.status !== 200) errors.push(`${url}: ${asset.status}`);
        bytes += asset.bytes;
    }
    routeBytes[path] = bytes;
    const ceiling = path === '/' ? 180000 : 200000;
    if (bytes > ceiling) errors.push(`${path}: ${bytes} script bytes > ${ceiling}`);
}
function files(path) {
    return readdirSync(path).flatMap((name) => {
        const file = join(path, name);
        return statSync(file).isDirectory() ? files(file) : [file];
    });
}
const chunks = files(join(dist, 'static/chunks')).filter((file) => file.endsWith('.js'));
const allChunksGzip = chunks.reduce((sum, file) => sum + gzipSync(readFileSync(file)).length, 0);
if (allChunksGzip > 600000) errors.push(`All chunks gzip upper bound ${allChunksGzip} > 600000`);
console.log(JSON.stringify({ checked: pages.size, chapters: ids.length, unknownChapter: unknown.status, routeScriptBytes: routeBytes, allClientChunks: chunks.length, allClientChunksGzipUpperBound: allChunksGzip, errors, note: 'Initial script responses use Accept-Encoding:gzip; tiny identity responses count as delivered. All-chunk sum is a conservative asset bound, not measured journey downloads, FPS or Core Web Vitals.' }, null, 2));
process.exitCode = errors.length ? 1 : 0;
