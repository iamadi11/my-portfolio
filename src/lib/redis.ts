import 'server-only';

/**
 * One Redis for the site's small backend (contact inbox, live readers). Works with either Redis Vercel offers:
 *
 *   Upstash (REST): KV_REST_API_URL + KV_REST_API_TOKEN, or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 *   Redis Cloud / any Redis (TCP): REDIS_URL (or KV_URL)
 *
 * REST is preferred when both are present (no connection to keep). Not configured → `redisConfigured()` is false
 * and the features that need it are simply not rendered.
 */

type Arg = string | number;

const restUrl = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const restToken = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const tcpUrl = process.env.REDIS_URL ?? process.env.KV_URL;

export function redisConfigured(): boolean {
    return Boolean((restUrl && restToken) || tcpUrl);
}

type TcpClient = { sendCommand(args: string[]): Promise<unknown> };
const g = globalThis as { __siteRedis?: Promise<TcpClient> };

/** One TCP connection per server instance, reused across requests. */
function tcp(): Promise<TcpClient> {
    g.__siteRedis ??= import('redis').then(async ({ createClient }) => {
        const c = createClient({ url: tcpUrl, socket: { connectTimeout: 3000 } });
        c.on('error', () => {});
        await c.connect();
        return c as unknown as TcpClient;
    });
    return g.__siteRedis;
}

/** Run several commands in one round trip (REST pipeline, or node-redis auto-pipelining). */
export async function redis(...cmds: Arg[][]): Promise<unknown[]> {
    if (restUrl && restToken) {
        const res = await fetch(`${restUrl.replace(/\/$/, '')}/pipeline`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${restToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(cmds.map((c) => c.map(String))),
            cache: 'no-store',
            signal: AbortSignal.timeout(4000),
        });
        if (!res.ok) throw new Error(`redis rest ${res.status}`);
        const out = (await res.json()) as Array<{ result?: unknown; error?: string }>;
        return out.map((r) => {
            if (r.error) throw new Error(r.error);
            return r.result;
        });
    }
    if (tcpUrl) {
        const c = await tcp();
        return Promise.all(cmds.map((cmd) => c.sendCommand(cmd.map(String))));
    }
    throw new Error('redis not configured');
}
