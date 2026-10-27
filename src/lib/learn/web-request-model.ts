/**
 * Teaching model for the web-request chapter (docs/system-design/chapters/web-request.md, "Visual" step 5): the time
 * from asking for a page to the first byte of its HTML, as a chain of steps. Pure functions of the inputs; the
 * stepper only reads them. A teaching model, not a benchmark: TLS 1.3 full handshake over TCP, no TCP Fast Open, no
 * TLS 0-RTT, no redirects, no packet loss, first byte one round trip after the request, no transmission time.
 */

export type VisitType = 'first' | 'warm' | 'cached';

export type StepId = 'dns' | 'tcp' | 'tls' | 'request';

/** Why a step costs nothing on this visit. */
export type Skip = 'connection reused' | 'fresh cached copy';

export type Inputs = { visit: VisitType; rttMs: number; dnsMs: number; serverMs: number };

export type Step = {
    id: StepId;
    /** Time spent waiting for messages to travel. */
    networkMs: number;
    /** Time the server spends working (only the request step has any). */
    serverMs: number;
    skipped: Skip | null;
};

export type Summary = {
    steps: Step[];
    totalMs: number;
    networkMs: number;
    serverMs: number;
    /** Network share of the total, 0–1; null when nothing was waited for at all (fresh cached copy). */
    networkShare: number | null;
};

/** Control ranges and defaults (spec, "Visual" step 6). */
export const RANGES = {
    rttMs: { min: 5, max: 300, step: 5, initial: 40 },
    dnsMs: { min: 0, max: 200, step: 5, initial: 30 },
    serverMs: { min: 0, max: 500, step: 5, initial: 50 },
} as const;

export const DEFAULTS: Inputs = {
    visit: 'first',
    rttMs: RANGES.rttMs.initial,
    dnsMs: RANGES.dnsMs.initial,
    serverMs: RANGES.serverMs.initial,
};

/**
 * The round trip Fig. 1's "Predict, then run" asks about. It differs from the default (40 ms), so the answer is not
 * already on screen when the learner predicts, and from the worked example's repeat visit.
 */
export const PREDICT_RTT_MS = 80;

const clamp = (v: number, r: { min: number; max: number }): number =>
    Number.isFinite(v) ? Math.min(r.max, Math.max(r.min, v)) : r.min;

/** The four timed steps for one visit. Inputs outside the control ranges are clamped, never trusted. */
export function steps(input: Inputs): Step[] {
    const rtt = clamp(input.rttMs, RANGES.rttMs);
    const dns = clamp(input.dnsMs, RANGES.dnsMs);
    const server = clamp(input.serverMs, RANGES.serverMs);
    if (input.visit === 'cached') {
        const skipped: Skip = 'fresh cached copy';
        return (['dns', 'tcp', 'tls', 'request'] as const).map((id) => ({
            id,
            networkMs: 0,
            serverMs: 0,
            skipped,
        }));
    }
    const warm = input.visit === 'warm';
    return [
        // A reused connection needs no lookup at all: Fetch resolves the host only when it makes a new connection.
        { id: 'dns', networkMs: warm ? 0 : dns, serverMs: 0, skipped: warm ? 'connection reused' : null },
        { id: 'tcp', networkMs: warm ? 0 : rtt, serverMs: 0, skipped: warm ? 'connection reused' : null },
        { id: 'tls', networkMs: warm ? 0 : rtt, serverMs: 0, skipped: warm ? 'connection reused' : null },
        { id: 'request', networkMs: rtt, serverMs: server, skipped: null },
    ];
}

export function summarize(input: Inputs): Summary {
    const s = steps(input);
    const networkMs = s.reduce((t, x) => t + x.networkMs, 0);
    const serverMs = s.reduce((t, x) => t + x.serverMs, 0);
    const totalMs = networkMs + serverMs;
    return { steps: s, totalMs, networkMs, serverMs, networkShare: totalMs > 0 ? networkMs / totalMs : null };
}

/** What "Predict, then run" asks about: a repeat visit at PREDICT_RTT_MS, with the learner's other values. */
export function predictAt(input: Inputs): Summary {
    return summarize({ ...input, visit: 'warm', rttMs: PREDICT_RTT_MS });
}

/** Percentages to one decimal everywhere in the chapter. */
export function formatShare(share: number | null): string {
    return share === null ? 'no network used' : `${(share * 100).toFixed(1)}%`;
}
