import { SHEETS } from '@/components/blueprint/sheets';
import { redis, redisConfigured } from '@/lib/redis';

/**
 * Live readers: each open tab reports its random session id and the sheet in view every ~25 s; a reader counts as
 * present for 60 s after its last report. One Redis sorted set per sheet plus one for the page, scored by time.
 * Nothing personal is stored (the id is random per tab, made in sessionStorage); no IPs.
 *
 *   POST { sid, sheet }          → { total, sheets: { [id]: n } }
 *   POST { sid, leave: true }    → 204 (sendBeacon on pagehide)
 *
 * Heartbeats instead of a server-sent-events stream on purpose: on serverless, SSE keeps a function running per
 * visitor; a 25 s heartbeat answers the same question for a fraction of the cost.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TTL = 60_000;
const SID = /^[a-f0-9]{16,32}$/;
const IDS: string[] = SHEETS.map((s) => s.id);
const ALL = 'pr:all';
const key = (id: string): string => `pr:${id}`;

export async function POST(req: Request): Promise<Response> {
    if (!redisConfigured()) return new Response(null, { status: 204 });
    const b = (await req.json().catch(() => null)) as {
        sid?: unknown;
        sheet?: unknown;
        leave?: unknown;
    } | null;
    const sid = typeof b?.sid === 'string' && SID.test(b.sid) ? b.sid : null;
    if (!sid) return Response.json({ error: 'bad sid' }, { status: 400 });
    try {
        if (b?.leave === true) {
            await redis(['ZREM', ALL, sid], ...IDS.map((id) => ['ZREM', key(id), sid]));
            return new Response(null, { status: 204 });
        }
        const sheet = typeof b?.sheet === 'string' && IDS.includes(b.sheet) ? b.sheet : IDS[0];
        const now = Date.now();
        const old = now - TTL;
        const out = await redis(
            ['ZADD', ALL, now, sid],
            ['ZREMRANGEBYSCORE', ALL, '-inf', old],
            ['PEXPIRE', ALL, TTL * 2],
            // A reader is on one sheet at a time.
            ...IDS.flatMap((id) =>
                id === sheet
                    ? [
                          ['ZADD', key(id), now, sid],
                          ['ZREMRANGEBYSCORE', key(id), '-inf', old],
                          ['PEXPIRE', key(id), TTL * 2],
                      ]
                    : [
                          ['ZREM', key(id), sid],
                          ['ZREMRANGEBYSCORE', key(id), '-inf', old],
                      ]
            ),
            ['ZCARD', ALL],
            ...IDS.map((id) => ['ZCARD', key(id)])
        );
        const counts = out.slice(-IDS.length - 1).map(Number);
        return Response.json(
            { total: counts[0], sheets: Object.fromEntries(IDS.map((id, i) => [id, counts[i + 1]])) },
            { headers: { 'Cache-Control': 'no-store' } }
        );
    } catch {
        return new Response(null, { status: 204 });
    }
}
