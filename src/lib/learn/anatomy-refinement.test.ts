import { describe, expect, it, vi } from 'vitest';

import { HARDWARE } from '@/components/anatomy/hardware';
import order from '@/components/anatomy/order.json';
import { BLUEPRINTS, COMPANION_MODELS } from '@/content/learn/academy';
import { DESIGN_GUIDES, designFilm } from '@/content/learn/design-guides';
import { LESSON_FILMS } from '@/content/learn/films';
import { PROJECT_FILMS } from '@/content/project-films';

import { MECHANISMS, makeExperimentFilm, simulateMechanism } from './experiment-model';
import { beatDuration, filmDuration, filmStarts, paceFilm, sampleFilm, settledSceneTime } from './film-model';
import { portPoint, responsiveFilm, routePoint, scenePoint, signalRoute } from './scene-layout';

vi.mock('server-only', () => ({}));
const films = [
    ...Object.values(LESSON_FILMS),
    ...BLUEPRINTS.flatMap((l) =>
        [false, true].map((alternative) =>
            makeExperimentFilm(l.id, l.question, l.rule, l.model, {
                amount: MECHANISMS[l.model].initial,
                alternative,
            })
        )
    ),
    ...BLUEPRINTS.flatMap((l) =>
        (COMPANION_MODELS[l.id] ?? []).flatMap((model) =>
            [false, true].map((alternative) =>
                makeExperimentFilm(l.id, l.question, l.rule, model, {
                    amount: MECHANISMS[model].initial,
                    alternative,
                })
            )
        )
    ),
    ...Object.entries(DESIGN_GUIDES).map(([id, g]) => designFilm(id, g)),
    ...Object.values(PROJECT_FILMS),
];
describe('anatomy course and portfolio invariants', () => {
    it('mounts every physical part to the connected assembly', () => {
        for (const [kind, art] of Object.entries(HARDWARE)) {
            expect(art.parts.length, kind).toBeGreaterThanOrEqual(40);
            expect([...order[kind as keyof typeof order]].sort()).toEqual(art.parts.map((p) => p.id).sort());
            expect(new Set(art.parts.map((p) => p.id)).size).toBe(art.parts.length);
            const connected = new Set(art.parts.filter((p) => p.z === 0));
            let changed = true;
            while (changed) {
                changed = false;
                for (const p of art.parts)
                    if (
                        !connected.has(p) &&
                        [...connected].some(
                            (q) =>
                                p.x <= q.x + q.w + 1e-6 &&
                                q.x <= p.x + p.w + 1e-6 &&
                                p.y <= q.y + q.d + 1e-6 &&
                                q.y <= p.y + p.d + 1e-6 &&
                                p.z <= q.z + q.h + 1e-6 &&
                                q.z <= p.z + p.h + 1e-6
                        )
                    ) {
                        connected.add(p);
                        changed = true;
                    }
            }
            expect(art.parts.filter((p) => !connected.has(p)).map((p) => `${kind}:${p.id}`)).toEqual([]);
            expect(art.svg).not.toMatch(/NaN|Infinity/);
        }
    });
    it('paces every published film without changing its final state or assuming five-second scenes', () => {
        for (const raw of films) {
            const film = paceFilm(raw);
            expect(sampleFilm(film, filmDuration(film)).values, film.id).toEqual(
                sampleFilm(raw, filmDuration(raw)).values
            );
            film.beats.forEach((beat, i) => {
                expect(beatDuration(beat)).toBeGreaterThanOrEqual(
                    Math.ceil(beat.caption.trim().split(/\s+/).length / 2.5) + 2
                );
                expect(sampleFilm(film, settledSceneTime(film, i)).index).toBe(i);
                expect(sampleFilm(film, filmStarts(film)[i]).index).toBe(i);
            });
        }
    });
    it('routes each visible connector to its mounted port in both layouts, outside other hardware', () => {
        for (const film of films)
            for (const narrow of [false, true]) {
                const layout = responsiveFilm(film, narrow);
                for (const [from, to] of layout.links) {
                    const a = layout.nodes.find((n) => n.id === from)!,
                        b = layout.nodes.find((n) => n.id === to)!;
                    const route = signalRoute(layout.nodes, a, b);
                    expect(routePoint(route, 0)).toEqual(portPoint(a));
                    const end = routePoint(route, 1),
                        port = portPoint(b);
                    expect(end[0]).toBeCloseTo(port[0]);
                    expect(end[1]).toBeCloseTo(port[1]);
                    for (const p of route) {
                        expect(p.every(Number.isFinite)).toBe(true);
                        expect(p[0]).toBeGreaterThanOrEqual(narrow ? 218 : 0);
                        expect(p[0]).toBeLessThanOrEqual(narrow ? 702 : 920);
                        expect(p[1]).toBeLessThan(narrow ? 518 : 348);
                        expect(p[1]).toBeGreaterThan(-12);
                    }
                    // Interior orthogonal runs exclude the small connector leads that touch their own case.
                    for (let i = 1; i < route.length - 2; i++)
                        for (const node of layout.nodes) {
                            const p = route[i],
                                q = route[i + 1],
                                [x, y] = scenePoint(node.x, node.y);
                            const crosses =
                                p[0] === q[0]
                                    ? p[0] > x - 87 &&
                                      p[0] < x + 87 &&
                                      Math.max(p[1], q[1]) > y - 125 &&
                                      Math.min(p[1], q[1]) < y + 34
                                    : p[1] > y - 125 &&
                                      p[1] < y + 34 &&
                                      Math.max(p[0], q[0]) > x - 87 &&
                                      Math.min(p[0], q[0]) < x + 87;
                            expect(crosses, `${film.id}:${from}->${to}`).toBe(false);
                        }
                }
            }
    });
    it('ties reference verdicts to actual valid and missing inserts under both policies', () => {
        for (let amount = 1; amount <= 8; amount++)
            for (const alternative of [false, true]) {
                const trace = simulateMechanism('foreignKey', { amount, alternative });
                expect(trace.outcome).toBe(alternative && amount > 3 ? 'Order rejected' : 'Order accepted');
                expect(trace.metrics.find((m) => m.label === 'Orphan rows inserted')?.value).toBe(
                    amount > 3 && !alternative ? '1' : '0'
                );
            }
    });
    it('distinguishes cache write ordering, consistency histories and accepted work', () => {
        for (const alternative of [false, true]) {
            const cache = simulateMechanism('cacheWrite', { amount: 6, alternative });
            expect(cache.metrics.find((m) => m.label === 'Read version')?.value).toBe(
                alternative ? '6' : '5'
            );
            const history = simulateMechanism('consistencyHistory', { amount: 6, alternative });
            expect(history.outcome).toBe(
                alternative ? 'History respects completed write' : 'History violates linearizability'
            );
            expect(history.beats.at(-1)?.values?.b).toBe('both v6');
        }
        expect(BLUEPRINTS.find((l) => l.id === 'async-work')?.model).toBe('communication');
    });
});

it('teaches query, validation, prepared-transaction and UUID counterexamples', () => {
    for (let amount = 1; amount <= 6; amount++)
        for (const alternative of [false, true]) {
            const join = simulateMechanism('sqlJoin', { amount, alternative });
            expect(join.metrics[0].value).toBe(String(amount + (alternative ? 1 : 0)));
            const sets = simulateMechanism('sqlSets', { amount, alternative });
            expect(sets.metrics[0].value).toBe(String(alternative ? 2 : amount + 2));
            const validation = simulateMechanism('httpValidation', { amount, alternative });
            expect(validation.metrics[0].value).toBe(alternative ? '1' : '0');
            expect(validation.beats[2].values?.b?.startsWith(alternative ? '200' : '304')).toBe(true);
            const prepared = simulateMechanism('twoPhase', { amount, alternative });
            expect(prepared.metrics[0].value).toBe(alternative ? '0' : '2');
            expect(prepared.beats.at(-1)?.values?.d).toBe(
                alternative ? 'committed; locks released' : 'waiting; locks held'
            );
            const uuid = simulateMechanism('uuidLayout', { amount, alternative });
            const first = uuid.beats[1].values!.b,
                second = uuid.beats[3].values!.d;
            expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[47][0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/);
            expect(first > second).toBe(true);
            if (alternative) {
                expect(parseInt(first.slice(0, 8) + first.slice(9, 13), 16)).toBe(1000);
                expect(parseInt(second.slice(0, 8) + second.slice(9, 13), 16)).toBe(1000 - amount);
            }
        }
});
