import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';

import { SITE } from '@/content/site';
import { redis, redisConfigured } from '@/lib/redis';

/**
 * Contact messages, written for Eidos' at-least-once delivery: the client (Eidos `neverLose` action) keeps a message
 * in IndexedDB until this route accepts it and retries with the SAME `Idempotency-Key`, so a retry after a dropped
 * response is recognised and not stored twice (SET NX on the key).
 *
 *   POST  { name?, email, message, website? }   Idempotency-Key: <key>   → 201 { id } | 200 { id, duplicate }
 *   GET   Authorization: Bearer <INBOX_TOKEN>                            → the last 100 messages (owner only)
 *
 * Messages land in a Redis list (the inbox). If RESEND_API_KEY is set they are also emailed to CONTACT_TO (default:
 * SITE email), using the same idempotency key with the provider. 5xx means "try again later" (Eidos retries);
 * 4xx means the message itself is wrong (Eidos stops). Raw IPs are never stored: only a salted hash, for rate limits.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WEEK = 60 * 60 * 24 * 7;
const KEY = /^[\w-]{8,128}$/;
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

/**
 * Claim the idempotency key and store the message in ONE atomic step, so a key can never be claimed without its
 * message being stored (a retry after a failure in between would otherwise be taken for a duplicate and lost).
 * Returns {1, id} when stored, {0, existing id} when the key was already used.
 */
const STORE = `if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'EX', ARGV[2]) then
  redis.call('LPUSH', KEYS[2], ARGV[3])
  redis.call('LTRIM', KEYS[2], 0, 999)
  return {1, ARGV[1]}
end
return {0, redis.call('GET', KEYS[1])}`;

type Message = { id: string; at: string; name: string; email: string; message: string; key: string };

function json(body: unknown, status: number): Response {
    return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

function ipHash(req: Request): string {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    return createHash('sha256')
        .update(`${ip}:${process.env.INBOX_TOKEN ?? 'contact'}`)
        .digest('hex')
        .slice(0, 16);
}

async function email(m: Message): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return;
    await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': m.key,
        },
        body: JSON.stringify({
            from: process.env.CONTACT_FROM ?? 'Portfolio <onboarding@resend.dev>',
            to: [process.env.CONTACT_TO ?? SITE.profile.email],
            reply_to: m.email,
            subject: `Portfolio message from ${m.name || m.email}`,
            text: `${m.message}\n\n— ${m.name || 'No name'} <${m.email}>\nSent ${m.at} · id ${m.id}`,
        }),
        signal: AbortSignal.timeout(5000),
    }).catch(() => {});
}

/** Shape and limits of the body; returns an error message or the clean fields. */
function parse(body: unknown): string | { name: string; email: string; message: string; trap: boolean } {
    if (!body || typeof body !== 'object') return 'Expected a JSON object.';
    const b = body as Record<string, unknown>;
    const name = typeof b.name === 'string' ? b.name.trim() : '';
    const mail = typeof b.email === 'string' ? b.email.trim() : '';
    const message = typeof b.message === 'string' ? b.message.trim() : '';
    if (name.length > 100) return 'Name is too long (100 characters max).';
    if (!EMAIL.test(mail)) return 'Please give an email address to reply to.';
    if (message.length < 10) return 'The message is too short.';
    if (message.length > 4000) return 'The message is too long (4,000 characters max).';
    return { name, email: mail, message, trap: typeof b.website === 'string' && b.website !== '' };
}

export async function POST(req: Request): Promise<Response> {
    if (!redisConfigured()) return json({ error: 'Messages are not set up on this deploy.' }, 503);
    const key = req.headers.get('idempotency-key') ?? '';
    if (!KEY.test(key)) return json({ error: 'Missing or malformed Idempotency-Key.' }, 400);
    const fields = parse(await req.json().catch(() => null));
    if (typeof fields === 'string') return json({ error: fields }, 422);
    // A filled honeypot is a bot: answer like a success, store nothing.
    if (fields.trap) return json({ id: randomUUID() }, 201);

    try {
        const rl = `rl:contact:${ipHash(req)}`;
        const [count] = (await redis(['INCR', rl], ['EXPIRE', rl, 3600, 'NX'])) as [number];
        if (count > 10) return json({ error: 'Too many messages from here; try again in an hour.' }, 429);

        const m: Message = {
            id: randomUUID(),
            at: new Date().toISOString(),
            name: fields.name,
            email: fields.email,
            message: fields.message,
            key,
        };
        const [res] = (await redis([
            'EVAL',
            STORE,
            2,
            `idem:contact:${key}`,
            'inbox:contact',
            m.id,
            WEEK,
            JSON.stringify(m),
        ])) as [[number, string]];
        if (Number(res[0]) !== 1) return json({ id: res[1], duplicate: true }, 200);
        await email(m);
        return json({ id: m.id }, 201);
    } catch {
        return json({ error: 'Storage is unavailable; the message will be retried.' }, 503);
    }
}

export async function GET(req: Request): Promise<Response> {
    const token = process.env.INBOX_TOKEN;
    const given = Buffer.from(req.headers.get('authorization') ?? '');
    const want = Buffer.from(`Bearer ${token}`);
    // Constant-time comparison: response time doesn't reveal how much of a guess was right.
    if (!token || token.length < 16 || given.length !== want.length || !timingSafeEqual(given, want))
        return json({ error: 'Unauthorized' }, 401);
    if (!redisConfigured()) return json({ error: 'Redis is not configured.' }, 503);
    const [items] = (await redis(['LRANGE', 'inbox:contact', 0, 99])) as [string[]];
    return json({ messages: items.map((s) => JSON.parse(s) as Message) }, 200);
}
