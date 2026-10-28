'use client';

import React, { useEffect, useMemo, useRef } from 'react';

import type { Step, StepId } from '@/lib/learn/web-request-model';

import { block, corners, cylinder, fit, Metal, place } from '../anatomy/metal';

/**
 * Where the time goes. Segment width is that step's milliseconds from the teaching model.
 * The marker's position is the running sum through the selected step. Nothing else moves.
 */

const NAME: Record<StepId, string> = {
    dns: 'DNS lookup',
    tcp: 'TCP handshake',
    tls: 'TLS handshake',
    request: 'Request and server',
};

/** Wall time for one model millisecond. Shown under the figure as scaled, not as a measurement. */
const SEC_PER_MS = 0.012;

/** World units per model millisecond. Keeps the machines large enough to recognise. */
const UNIT = 0.6;

type Seg = { key: string; name: string; ms: number; kind?: 'server' };

function segments(steps: Step[], splitRequest: boolean): Seg[] {
    const out: Seg[] = [];
    for (const s of steps) {
        if (s.id === 'request' && splitRequest) {
            if (s.networkMs > 0) out.push({ key: 'request-net', name: 'Request (travel)', ms: s.networkMs });
            if (s.serverMs > 0)
                out.push({ key: 'request-srv', name: 'Server (work)', ms: s.serverMs, kind: 'server' });
        } else if (s.networkMs + s.serverMs > 0) {
            out.push({ key: s.id, name: NAME[s.id], ms: s.networkMs + s.serverMs });
        }
    }
    return out;
}

/** Elapsed model milliseconds at the end of the frame the learner has selected. */
export function elapsedAt(frameId: string, steps: Step[]): number {
    if (frameId === 'url') return 0;
    let acc = 0;
    for (const s of steps) {
        acc += s.networkMs + s.serverMs;
        if (s.id === frameId) return acc;
    }
    return acc;
}

export default function TimeRail({
    steps,
    frameId,
    revealed,
}: {
    steps: Step[];
    frameId: string;
    revealed: boolean;
}): React.JSX.Element {
    const marker = useRef<SVGGElement>(null);
    const shown = useRef(0);
    const target = elapsedAt(frameId, steps);
    const total = steps.reduce((t, s) => t + s.networkMs + s.serverMs, 0);
    const segs = segments(steps, revealed);
    const scene = useMemo(() => {
        const length = Math.max(total, 40) * UNIT;
        let cursor = 0;
        const spans = segs.map((s) => {
            const span = { key: s.key, kind: s.kind, x: cursor * UNIT, w: s.ms * UNIT };
            cursor += s.ms;
            return span;
        });
        const dns = spans.find((s) => s.key === 'dns');
        const last = spans[spans.length - 1];
        const base = { x: -78, y: -48, w: length + 130, d: 108, r: 6 };
        const foot = (x: number, y: number) => ({ plan: { x, y, w: 10, d: 10, r: 1 }, z: -5, h: 5 });
        const feet = [
            foot(base.x + 10, base.y + 8),
            foot(base.x + base.w - 20, base.y + 8),
            foot(base.x + 10, base.y + base.d - 18),
            foot(base.x + base.w - 20, base.y + base.d - 18),
        ];
        const browser = { plan: { x: -62, y: -16, w: 40, d: 36, r: 3 }, z: 0, h: 10 };
        const screen = { plan: { x: -56, y: -6, w: 26, d: 6, r: 1 }, z: 10, h: 16 };
        const keys = { plan: { x: -58, y: 24, w: 32, d: 12, r: 1 }, z: 0, h: 3 };
        const page = { plan: { x: -52, y: -4, w: 16, d: 2, r: 0 }, z: 18, h: 8 };
        const resolver =
            dns && dns.w > 0
                ? { plan: { x: dns.x + dns.w / 2 - 9, y: 22, w: 18, d: 20, r: 2 }, z: 0, h: 14 }
                : null;
        const slot = resolver
            ? { plan: { x: resolver.plan.x + 3, y: resolver.plan.y - 1, w: 12, d: 4, r: 0 }, z: 8, h: 3 }
            : null;
        const server = {
            plan: {
                x: last ? last.x + Math.max(0, last.w - 32) : length - 32,
                y: -24,
                w: 30,
                d: 42,
                r: 2,
            },
            z: 0,
            h: 26,
        };
        const cables = spans
            .filter((s) => s.key !== 'dns' && s.w > 0)
            .map((s) => ({
                key: `cable-${s.key}`,
                start: s.x,
                plan: { x: s.x, y: -2, w: s.w, d: 4, r: 0 },
                z: 4,
                h: 2,
            }));
        const tls = spans.find((s) => s.key === 'tls' && s.w > 0);
        const cover = tls
            ? { start: tls.x, plan: { x: tls.x, y: -8, w: tls.w, d: 16, r: 2 }, z: 6, h: 5 }
            : null;
        const carriage = { plan: { x: -8, y: -8, w: 16, d: 16, r: 2 }, z: 12, h: 9 };
        const projection = fit(
            corners([
                { plan: base, z: 0, h: 6 },
                ...feet,
                browser,
                screen,
                keys,
                page,
                ...(resolver ? [resolver] : []),
                ...(slot ? [slot] : []),
                server,
                ...cables,
                ...(cover ? [cover] : []),
                carriage,
                { plan: { x: length - 8, y: 16, w: 16, d: 16, r: 0 }, z: 12, h: 9 },
            ]),
            720,
            360
        );
        const screws = feet.map((f) =>
            cylinder(f.plan.x + 5, f.plan.y + 5, 1.6, 6, 2.4, projection, 10, 0.3)
        );
        const vents = [
            {
                key: 'vent-a',
                paths: cylinder(server.plan.x + 8, server.plan.y + 14, 2.6, 26, 5, projection, 12, 0.3),
            },
            {
                key: 'vent-b',
                paths: cylinder(server.plan.x + 20, server.plan.y + 14, 2.6, 26, 5, projection, 12, 0.3),
            },
        ];
        return {
            projection,
            base,
            feet,
            screws,
            browser,
            screen,
            keys,
            page,
            resolver,
            slot,
            server,
            vents,
            cables,
            cover,
            carriage,
            dnsW: dns?.w ?? 0,
        };
    }, [segs, total]);
    const sceneRef = useRef(scene.projection);
    sceneRef.current = scene.projection;
    const dnsRef = useRef(scene.dnsW);
    dnsRef.current = scene.dnsW;
    const skipped = steps.filter((s) => s.skipped && s.networkMs + s.serverMs === 0);

    useEffect(() => {
        const node = marker.current;
        if (!node) return () => undefined;
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let raf = 0;
        let last = performance.now();
        const placeMark = (ms: number): void => {
            const y = ms > 0 && ms <= dnsRef.current ? 14 : -8;
            node.setAttribute('transform', place([-8, -8, 12], [ms * UNIT - 8, y, 12], sceneRef.current));
        };
        const tick = (now: number): void => {
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            const step = reduce
                ? target - shown.current
                : (dt / SEC_PER_MS) * Math.sign(target - shown.current);
            const next =
                step === 0 || Math.abs(target - shown.current) <= Math.abs(step)
                    ? target
                    : shown.current + step;
            shown.current = next;
            placeMark(next);
            if (next !== target) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [target, total]);

    const here = segs.find((s, i) => {
        const start = segs.slice(0, i).reduce((t, x) => t + x.ms, 0);
        return target > start && target <= start + s.ms;
    });
    const arrived = total > 0 && target >= total;
    const read =
        total === 0
            ? 'Nothing is sent. Every wait is 0 ms, from the model, so the mark stays on the computer.'
            : here?.key === 'dns'
              ? `Looking up the hostname. The mark is at the smaller machine. ${here.ms} ms for this wait. ${target} of ${total} ms so far.`
              : here?.key === 'tcp'
                ? `Opening a connection to the server. ${here.ms} ms for this wait. ${target} of ${total} ms so far.`
                : here?.key === 'tls'
                  ? `Securing that connection. ${here.ms} ms for this wait. ${target} of ${total} ms so far.`
                  : here
                    ? `${here.name}. ${here.ms} ms for this wait. ${target} of ${total} ms so far.`
                    : `The address is on the computer. Nothing has been sent. ${target} of ${total} ms.`;

    return (
        <div className="ln-rail">
            <div className="iso" data-theme="light">
                <svg className="iso-svg" viewBox="0 0 720 360" aria-hidden="true">
                    {scene.feet.map((foot) => (
                        <Metal
                            key={`${foot.plan.x}-${foot.plan.y}`}
                            paths={block(foot.plan, foot.z, foot.h, scene.projection)}
                        />
                    ))}
                    {scene.screws.map((paths, i) => (
                        <Metal key={`screw-${scene.feet[i].plan.x}`} paths={paths} />
                    ))}
                    <Metal paths={block(scene.base, 0, 6, scene.projection)} />
                    <Metal paths={block(scene.keys.plan, scene.keys.z, scene.keys.h, scene.projection)} />
                    <Metal
                        paths={block(scene.browser.plan, scene.browser.z, scene.browser.h, scene.projection)}
                    />
                    <Metal
                        lit={arrived}
                        paths={block(scene.screen.plan, scene.screen.z, scene.screen.h, scene.projection)}
                    />
                    {arrived ? (
                        <Metal
                            lit
                            paths={block(scene.page.plan, scene.page.z, scene.page.h, scene.projection)}
                        />
                    ) : null}
                    {scene.resolver ? (
                        <Metal
                            lit={here?.key === 'dns'}
                            paths={block(
                                scene.resolver.plan,
                                scene.resolver.z,
                                scene.resolver.h,
                                scene.projection
                            )}
                        />
                    ) : null}
                    {scene.slot ? (
                        <Metal paths={block(scene.slot.plan, scene.slot.z, scene.slot.h, scene.projection)} />
                    ) : null}
                    {scene.cables
                        .filter((cable) => target > cable.start)
                        .map((cable) => (
                            <Metal
                                key={cable.key}
                                paths={block(cable.plan, cable.z, cable.h, scene.projection)}
                            />
                        ))}
                    {scene.cover && target > scene.cover.start ? (
                        <Metal
                            lit={here?.key === 'tls'}
                            paths={block(scene.cover.plan, scene.cover.z, scene.cover.h, scene.projection)}
                        />
                    ) : null}
                    <Metal
                        lit={
                            here?.key === 'request' || here?.key === 'request-srv' || here?.kind === 'server'
                        }
                        paths={block(scene.server.plan, scene.server.z, scene.server.h, scene.projection)}
                    />
                    {scene.vents.map((vent) => (
                        <Metal key={vent.key} paths={vent.paths} />
                    ))}
                    <g ref={marker}>
                        <Metal
                            lit
                            paths={block(
                                scene.carriage.plan,
                                scene.carriage.z,
                                scene.carriage.h,
                                scene.projection
                            )}
                        />
                    </g>
                </svg>
            </div>
            <p className="ln-bench-read" role="status">
                {read}
                {skipped.length
                    ? ` Skipped, because this visit has no wait there: ${skipped.map((s) => NAME[s.id]).join(', ')}.`
                    : ''}
            </p>
            <p className="ln-bench-note">
                The mark&rsquo;s place is the milliseconds so far, computed from the chapter model. Assumed:
                the round trip, the lookup and the server time are the sliders. Scaled: one model millisecond
                is drawn in {SEC_PER_MS} seconds. A longer stretch is a longer wait. This is not a trace from
                a real browser.
            </p>
        </div>
    );
}
