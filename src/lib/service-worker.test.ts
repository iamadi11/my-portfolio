import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

/** Exercise the shipped worker, not a parallel copy of its navigation policy. */
function worker() {
    const pages = new Map<string, Response>();
    const listeners = new Map<string, (event: unknown) => void>();
    let network: () => Promise<Response> = async () => {
        throw Error('offline');
    };
    const key = (request: string | { url: string }): string =>
        new URL(typeof request === 'string' ? request : request.url, 'https://portfolio.example').href;
    runInNewContext(readFileSync(new URL('../../public/sw.js', import.meta.url), 'utf8'), {
        self: {
            location: { origin: 'https://portfolio.example' },
            addEventListener: (name: string, callback: (event: unknown) => void) =>
                listeners.set(name, callback),
        },
        importScripts: () => {},
        URL,
        Response,
        fetch: () => network(),
        caches: {
            match: async (request: string | { url: string }) => pages.get(key(request))?.clone(),
            open: async () => ({
                put: async (request: string | { url: string }, response: Response) =>
                    pages.set(key(request), response),
            }),
        },
    });
    return {
        online: (html: string, status = 200) => {
            network = async () => new Response(html, { status, headers: { 'Content-Type': 'text/html' } });
        },
        offline: () => {
            network = async () => {
                throw Error('offline');
            };
        },
        navigate: async (path: string) => {
            let response: Promise<Response> | undefined;
            const work: Promise<unknown>[] = [];
            listeners.get('fetch')!({
                request: {
                    url: `https://portfolio.example${path}`,
                    method: 'GET',
                    mode: 'navigate',
                    headers: new Headers(),
                },
                respondWith: (value: Promise<Response>) => (response = value),
                waitUntil: (value: Promise<unknown>) => work.push(value),
            });
            const result = await response!;
            await Promise.all(work);
            return result;
        },
    };
}

describe('offline route identity', () => {
    it('serves a saved chapter at its own URL, never the homepage at another route', async () => {
        const sw = worker();
        sw.online('<h1>Portfolio</h1>');
        await sw.navigate('/');
        sw.online('<h1>Replication</h1>');
        await sw.navigate('/learn/replication');
        sw.offline();
        expect(await (await sw.navigate('/')).text()).toContain('Portfolio');
        expect(await (await sw.navigate('/learn/replication')).text()).toContain('Replication');
        const missing = await sw.navigate('/learn/never-visited');
        expect(missing.status).toBe(503);
        expect(await missing.text()).toContain('This page is not saved offline');
    });

    it('does not overwrite a saved valid chapter with a server error or 404', async () => {
        const sw = worker();
        sw.online('<h1>Cache invalidation</h1>');
        await sw.navigate('/learn/cache-invalidation');
        sw.online('<h1>Not found</h1>', 404);
        expect((await sw.navigate('/learn/cache-invalidation')).status).toBe(404);
        sw.offline();
        expect(await (await sw.navigate('/learn/cache-invalidation')).text()).toContain('Cache invalidation');
    });
});
