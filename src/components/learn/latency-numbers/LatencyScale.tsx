'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import Choice from '@/components/learn/kit/Choice';
import { revealAfterRender } from '@/components/learn/kit/reveal';
import Transport from '@/components/learn/kit/Transport';
import { useClock } from '@/components/learn/kit/useClock';
import { verdict as judge } from '@/components/learn/kit/verdict';
import {
    OP_IDS,
    X0,
    clockOf,
    dominates,
    factor,
    formatFactor,
    formatMagnitude,
    formatNs,
    labMarks,
    learnMarks,
    magnitude,
    magnitudeFromClock,
    operation,
    pairOf,
    tour,
    xAtClock,
    xOfMagnitude,
    type OpId,
    type Operation,
    type Pair,
} from '@/lib/learn/latency-numbers-model';

import {
    Metal,
    block,
    corners,
    cylinder,
    fit,
    iso,
    place,
    type Plan,
    type Projection,
} from '../anatomy/metal';

/**
 * A measuring bench. The lit carriage's world x is the order of magnitude of
 * one operation: X0 + log10(nanoseconds) * pitch. Learn walks from the L1
 * fetch out to the US–Europe packet. The lab waits for Run.
 */

const SCALE_LO = -1;
const SCALE_HI = 9;
const PLATE_H = 8;
const BED_H = 3;
const WAY_H = 6;
const WAY_TOP = PLATE_H + BED_H + WAY_H;
const LAB_A: OpId = 'memory';
const LAB_B: OpId = 'seek';

type Inputs = { a: OpId; b: OpId };
type Drawn = { key: string; paths: ReturnType<typeof block> };

function lineOf(x1: number, y1: number, x2: number, y2: number, z: number, projection: Projection): string {
    const a = iso([x1, y1, z], projection);
    const b = iso([x2, y2, z], projection);
    return `M${a[0].toFixed(2)} ${a[1].toFixed(2)}L${b[0].toFixed(2)} ${b[1].toFixed(2)}`;
}

function carriageXOf(op: Operation): number {
    return xOfMagnitude(magnitude(op.durationNs));
}

function sceneOf(postIds: readonly OpId[]) {
    const x0 = xOfMagnitude(SCALE_LO);
    const x1 = xOfMagnitude(SCALE_HI);
    const span = x1 - x0;
    const base: Plan = { x: x0 - 20, y: 10, w: span + 40, d: 92, r: 5 };
    const foot = (x: number, y: number): Plan => ({ x, y, w: 16, d: 16, r: 1.2 });
    const feet = [
        foot(base.x + 10, base.y + 8),
        foot(base.x + base.w - 26, base.y + 8),
        foot(base.x + 10, base.y + base.d - 24),
        foot(base.x + base.w - 26, base.y + base.d - 24),
    ];
    const bed: Plan = { x: x0 - 4, y: 30, w: span + 8, d: 58, r: 2 };
    const frontWay: Plan = { x: x0, y: 34, w: span, d: 8, r: 1 };
    const backWay: Plan = { x: x0, y: 72, w: span, d: 8, r: 1 };
    const scale: Plan = { x: x0, y: 16, w: span, d: 12, r: 0.8 };
    const screwBar: Plan = { x: x0 + 8, y: 58, w: span - 16, d: 3.2, r: 0.4 };
    const cheek = (x: number): Plan => ({ x, y: 16, w: 12, d: 68, r: 1 });
    const left = cheek(x0 - 14);
    const right = cheek(x1 + 2);
    const nameplate: Plan = { x: x0 + 6, y: 12, w: 22, d: 5, r: 0.4 };
    const dog = (x: number): Plan => ({ x, y: 33, w: 8, d: 10, r: 0.6 });
    const dogs = [dog(x0 + 18), dog(x1 - 26)];
    const boxes: { plan: Plan; z: number; h: number }[] = [
        { plan: base, z: 0, h: PLATE_H },
        ...feet.map((plan) => ({ plan, z: -8, h: 8 })),
        { plan: bed, z: PLATE_H, h: BED_H },
        { plan: scale, z: PLATE_H, h: 4 },
        { plan: frontWay, z: PLATE_H + BED_H, h: WAY_H },
        { plan: backWay, z: PLATE_H + BED_H, h: WAY_H },
        { plan: screwBar, z: PLATE_H + BED_H, h: 2.4 },
        { plan: left, z: PLATE_H, h: 28 },
        { plan: right, z: PLATE_H, h: 28 },
        { plan: nameplate, z: PLATE_H, h: 1.6 },
        ...dogs.map((plan) => ({ plan, z: WAY_TOP, h: 3 })),
        { plan: { x: x0 - 14, y: 20, w: 28, d: 66, r: 1 }, z: 10, h: 46 },
        { plan: { x: x1 - 14, y: 20, w: 28, d: 66, r: 1 }, z: 10, h: 46 },
    ];
    const projection = fit(corners(boxes), 720, 420);
    const screw = (plan: Plan, z: number, key: string): Drawn => ({
        key,
        paths: cylinder(plan.x + plan.w / 2, plan.y + plan.d / 2, 1.6, z, 2.2, projection, 8, 0.3),
    });
    const minor: string[] = [];
    const major: string[] = [];
    const scaleTop = PLATE_H + 4;
    for (let step = 0; step <= (SCALE_HI - SCALE_LO) * 2; step += 1) {
        const value = SCALE_LO + step / 2;
        const x = xOfMagnitude(value);
        const len = step % 2 === 0 ? 7.2 : 3.4;
        const d = lineOf(x, 16, x, 16 + len, scaleTop, projection);
        if (step % 2 === 0) major.push(d);
        else minor.push(d);
    }
    const saddle: Plan = { x: X0 - 11, y: 32, w: 22, d: 50, r: 1.2 };
    const apron: Plan = { x: X0 - 12, y: 26, w: 24, d: 8, r: 0.8 };
    const gib: Plan = { x: X0 - 10, y: 34, w: 20, d: 3, r: 0.3 };
    const shoe = (y: number): Plan => ({ x: X0 - 8, y, w: 16, d: 10, r: 0.8 });
    const tool: Plan = { x: X0 - 4.5, y: 48, w: 9, d: 16, r: 0.8 };
    const index: Plan = { x: X0 - 1.6, y: 22, w: 3.2, d: 8, r: 0.3 };
    return {
        projection,
        feet: feet.map((plan) => ({ key: `foot-${plan.x}`, paths: block(plan, -8, 8, projection) })),
        screws: [
            ...feet.map((plan) => screw(plan, 0, `foot-screw-${plan.x}`)),
            screw(left, PLATE_H + 28, 'left-screw'),
            screw(right, PLATE_H + 28, 'right-screw'),
            screw(dogs[0], WAY_TOP + 3, 'dog-screw-0'),
            screw(dogs[1], WAY_TOP + 3, 'dog-screw-1'),
        ],
        plate: block(base, 0, PLATE_H, projection),
        bed: block(bed, PLATE_H, BED_H, projection),
        scale: block(scale, PLATE_H, 4, projection),
        frontWay: block(frontWay, PLATE_H + BED_H, WAY_H, projection),
        backWay: block(backWay, PLATE_H + BED_H, WAY_H, projection),
        screwBar: block(screwBar, PLATE_H + BED_H, 2.4, projection),
        left: block(left, PLATE_H, 28, projection),
        right: block(right, PLATE_H, 28, projection),
        nameplate: block(nameplate, PLATE_H, 1.6, projection),
        dogs: dogs.map((plan, indexDog) => ({
            key: `dog-${indexDog}`,
            paths: block(plan, WAY_TOP, 3, projection),
        })),
        ticks: { minor: minor.join(''), major: major.join('') },
        posts: postIds.map((id) => {
            const op = operation(id);
            const x = carriageXOf(op);
            return {
                key: `post-${id}`,
                paths: cylinder(x, 66, 2.3, PLATE_H + BED_H, 18, projection, 8, 0.2),
            };
        }),
        apron: block(apron, 10, 10, projection),
        shoes: [shoe(33), shoe(71)].map((plan, indexShoe) => ({
            key: `shoe-${indexShoe}`,
            paths: block(plan, WAY_TOP, 4, projection),
        })),
        saddle: block(saddle, WAY_TOP + 3, 6, projection),
        gib: block(gib, WAY_TOP + 9, 1.6, projection),
        index: block(index, WAY_TOP + 4, 3, projection),
        tool: block(tool, WAY_TOP + 9, 22, projection),
        clamp: cylinder(X0, 56, 1.7, WAY_TOP + 31, 2.4, projection, 8, 0.25),
    };
}

function passed(marks: readonly number[], t: number): number {
    return marks.reduce((index, mark, i) => (mark <= t + 1e-6 ? i : index), -1);
}

function learnLine(t: number): string {
    const ops = tour();
    const marks = ops.map((op) => clockOf(op.durationNs));
    const index = passed(marks, t);
    const here = formatMagnitude(magnitudeFromClock(t));
    if (index < 0) {
        const first = ops[0];
        return first
            ? `The carriage is at the left post, moving toward ${first.name}.`
            : 'The carriage is at the left post.';
    }
    const op = ops[index];
    const next = ops[index + 1];
    if (!op) return `The carriage is at magnitude ${here}.`;
    const at = formatMagnitude(magnitude(op.durationNs));
    const memoryToSeek = formatMagnitude(pairOf('memory', 'seek').orders);
    if (!next) {
        return `The carriage is at magnitude ${at}, ${op.name}: ${formatNs(op.durationNs)}. This is the farthest stop. A fetch from a new disk location is ${memoryToSeek} orders farther than a fetch from main memory.`;
    }
    if (op.id === 'seek') {
        if (t <= (marks[index] ?? 0) + 1e-6) {
            return `The carriage is at magnitude ${at}, ${op.name}: ${formatNs(op.durationNs)}. That is ${memoryToSeek} orders farther than a fetch from main memory.`;
        }
        return `The carriage is at magnitude ${here}, past the disk seek. That stop is ${memoryToSeek} orders farther than a fetch from main memory. Next is ${next.name}.`;
    }
    if (t <= marks[index] + 1e-6) {
        const note =
            op.origin === 'script' ? ' This stop is the script constant, not an Answers-table row.' : '';
        return `The carriage is at magnitude ${at}, ${op.name}: ${formatNs(op.durationNs)}.${note} Next is ${next.name}.`;
    }
    return `The carriage is at magnitude ${here}, past ${op.name}, moving toward ${next.name}.`;
}

function labLine(pair: Pair, t: number): string {
    const nearT = clockOf(pair.near.durationNs);
    const farT = clockOf(pair.far.durationNs);
    const here = formatMagnitude(magnitudeFromClock(t));
    if (t >= farT - 1e-6) {
        return `The carriage is at magnitude ${formatMagnitude(magnitude(pair.far.durationNs))}, ${pair.far.name}: ${formatNs(pair.far.durationNs)}.`;
    }
    if (Math.abs(t - nearT) <= 1e-6) {
        return `The carriage is at magnitude ${formatMagnitude(magnitude(pair.near.durationNs))}, ${pair.near.name}: ${formatNs(pair.near.durationNs)}. The other stop is still ahead.`;
    }
    if (t < nearT) return `The carriage is at magnitude ${here}, moving toward ${pair.near.name}.`;
    return `The carriage is at magnitude ${here}, past ${pair.near.name}, moving toward ${pair.far.name}.`;
}

function outcome(pair: Pair): string {
    const times = formatFactor(factor(pair.near.durationNs, pair.far.durationNs));
    const orders = formatMagnitude(pair.orders);
    const who = dominates(pair.orders)
        ? `${pair.far.name} is the bottleneck of this pair: it is ${orders} orders farther, ${times} times the nanoseconds.`
        : `${pair.far.name} is farther by ${orders} orders, ${times} times. That is under a factor of ten, so it does not dominate the sum.`;
    const caveat =
        pair.far.origin === 'script' || pair.near.origin === 'script'
            ? ' SSD random read is 16,000 ns from the script, not from the Answers table.'
            : '';
    return `${who}${caveat}`;
}

export default function LatencyScale({ pane = 'lab' }: { pane?: 'learn' | 'lab' }): React.JSX.Element {
    const figId = pane === 'lab' ? 'fig-latnum-h' : 'fig-latnum-learn';
    const [inputs, setInputs] = useState<Inputs>({ a: LAB_A, b: LAB_B });
    const [guess, setGuess] = useState<OpId | null>(null);
    const [run, setRun] = useState<Pair | null>(() => (pane === 'learn' ? pairOf('l1', 'wan') : null));
    const result = useRef<HTMLDivElement>(null);
    const figure = useRef<HTMLElement>(null);
    const marks = useMemo(() => {
        if (pane === 'learn') return learnMarks();
        return run ? labMarks(run.near.id, run.far.id) : [0];
    }, [pane, run]);
    const end = marks[marks.length - 1] ?? 0;
    const clock = useClock({ marks, end, rate: 1.2, target: figure });
    const { restart } = clock;
    useEffect(() => {
        if (pane !== 'learn') return undefined;
        restart();
        return undefined;
    }, [pane, restart]);
    const postKey = pane === 'learn' ? 'tour' : run ? `${run.near.id}:${run.far.id}` : '';
    const scene = useMemo(() => {
        const ids: OpId[] =
            postKey === 'tour'
                ? tour().map((op) => op.id)
                : postKey === ''
                  ? []
                  : (postKey.split(':') as OpId[]);
        return sceneOf(ids);
    }, [postKey]);
    const t = run ? clock.t : 0;
    const finished = run !== null && clock.t >= end - 1e-6;
    const same = inputs.a === inputs.b;
    const choices: OpId[] = same ? [] : [inputs.a, inputs.b];
    const labels: Record<OpId, string> = Object.fromEntries(
        OP_IDS.map((id) => [id, operation(id).name])
    ) as Record<OpId, string>;
    const set = (patch: Partial<Inputs>): void => {
        setInputs((prev) => ({ ...prev, ...patch }));
        setRun(null);
        setGuess(null);
        clock.reset();
    };
    const go = (): void => {
        if (inputs.a === inputs.b) return;
        setRun(pairOf(inputs.a, inputs.b));
        clock.restart();
        revealAfterRender(() => result.current);
    };
    const verdict = run ? judge(guess, run.far.id, labels) : '';
    const showCarriage = run !== null;
    const magnitudeNow = magnitudeFromClock(t);
    return (
        <figure ref={figure} className="bp-sheet ln-fig" aria-labelledby={figId}>
            <div className="ln-fig-head">
                <span id={figId}>
                    {pane === 'learn' ? 'A carriage on the order bench' : 'Fig. 1 · Which stop is farther'}
                </span>
                <span>Quoted durations, not a trace</span>
            </div>
            <div className={pane === 'lab' ? 'ln-fig-grid' : 'ln-fig-grid ln-fig-grid-one'}>
                {pane === 'lab' ? (
                    <div className="ln-controls">
                        <Choice
                            legend="First operation"
                            options={OP_IDS}
                            label={(id: OpId) => labels[id]}
                            value={inputs.a}
                            onChange={(id) => set({ a: id })}
                        />
                        <Choice
                            legend="Second operation"
                            options={OP_IDS}
                            label={(id: OpId) => labels[id]}
                            value={inputs.b}
                            onChange={(id) => set({ b: id })}
                        />
                        {choices.length === 2 ? (
                            <div className="ln-predict">
                                <Choice
                                    legend="Predict which stop is farther"
                                    options={choices}
                                    label={(id: OpId) => labels[id]}
                                    value={guess}
                                    onChange={(id) => {
                                        setGuess(id);
                                        setRun(null);
                                        clock.reset();
                                    }}
                                />
                            </div>
                        ) : null}
                        <button type="button" className="ln-btn" onClick={go}>
                            Run
                        </button>
                    </div>
                ) : null}
                <div ref={result}>
                    <div className="iso" data-theme="light">
                        <svg className="bp-svg ln-svg iso-svg" viewBox="0 0 720 420" aria-hidden="true">
                            {scene.feet.map((part) => (
                                <Metal key={part.key} paths={part.paths} part={part.key} />
                            ))}
                            <Metal paths={scene.plate} part="plate" />
                            {scene.screws.map((part) => (
                                <Metal key={part.key} paths={part.paths} part={part.key} />
                            ))}
                            <Metal paths={scene.bed} part="bed" />
                            <Metal paths={scene.scale} part="scale" />
                            <Metal paths={scene.nameplate} part="nameplate" />
                            <Metal paths={scene.left} part="left-cheek" />
                            <Metal paths={scene.screwBar} part="lead-screw" />
                            {scene.posts.map((post) => (
                                <Metal key={post.key} paths={post.paths} part={post.key} />
                            ))}
                            <Metal paths={scene.backWay} part="back-way" />
                            <Metal paths={scene.frontWay} part="front-way" />
                            {scene.dogs.map((part) => (
                                <Metal key={part.key} paths={part.paths} part={part.key} />
                            ))}
                            <Metal paths={scene.right} part="right-cheek" />
                            {scene.ticks.minor ? (
                                <path className="iso-line" data-tone="lo" d={scene.ticks.minor} />
                            ) : null}
                            {scene.ticks.major ? (
                                <path className="iso-line" data-tone="mid" d={scene.ticks.major} />
                            ) : null}
                            {showCarriage ? (
                                <g
                                    data-part="carriage"
                                    data-magnitude={magnitudeNow}
                                    transform={place(
                                        [X0, 62, WAY_TOP],
                                        [xAtClock(t), 62, WAY_TOP],
                                        scene.projection
                                    )}
                                >
                                    <Metal paths={scene.apron} part="apron" />
                                    {scene.shoes.map((part) => (
                                        <Metal key={part.key} paths={part.paths} part={part.key} />
                                    ))}
                                    <Metal paths={scene.saddle} part="saddle" />
                                    <Metal paths={scene.gib} part="gib" />
                                    <Metal paths={scene.index} part="index" />
                                    <Metal paths={scene.tool} lit part="tool-post" />
                                    <Metal paths={scene.clamp} part="clamp" />
                                </g>
                            ) : null}
                        </svg>
                    </div>
                    {run ? (
                        <>
                            <p className="m-0 mt-2" data-current-step>
                                {pane === 'learn' ? learnLine(t) : labLine(run, t)}
                            </p>
                            <Transport
                                label="Order carriage"
                                playing={clock.playing}
                                atStart={clock.t <= 0}
                                atEnd={clock.t >= end - 1e-6}
                                onPlay={clock.play}
                                onPause={clock.pause}
                                onPrev={clock.prev}
                                onNext={clock.next}
                                onReset={clock.reset}
                            />
                            {finished && pane === 'lab' ? (
                                <p className="m-0 mt-2" data-result>
                                    {outcome(run)} {verdict}
                                </p>
                            ) : null}
                        </>
                    ) : (
                        <p className="ln-frame">
                            {same
                                ? 'Those are the same operation. Pick two different stops, predict which is farther, then press Run.'
                                : 'Pick two operations, predict which stop is farther, then press Run.'}
                        </p>
                    )}
                </div>
            </div>
            <figcaption className="ln-label mt-4">
                The carriage&apos;s place equals the order of magnitude: the base-10 logarithm of the duration
                in nanoseconds. One pitch is a factor of ten. Magnitude 0 is 1 nanosecond, the table&apos;s
                time to execute a typical instruction. Every stop except SSD random read is a row in that
                table. SSD random read is 16,000 ns, the integer the script returns when the year is greater
                than 2014.
            </figcaption>
        </figure>
    );
}
