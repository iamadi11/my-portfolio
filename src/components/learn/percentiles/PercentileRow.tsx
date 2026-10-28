'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import Choice from '@/components/learn/kit/Choice';
import { revealAfterRender } from '@/components/learn/kit/reveal';
import Transport from '@/components/learn/kit/Transport';
import { useClock } from '@/components/learn/kit/useClock';
import { verdict as judge } from '@/components/learn/kit/verdict';
import {
    BODY_COUNT,
    BODY_MS,
    EXTRA_MS,
    LEARN_INPUTS,
    PERCENTILE_CHOICES,
    SHOULDER_MS,
    TAIL_MS,
    samplesOf,
    sortSamples,
    callOf,
    formatMs,
    formatRank,
    gauge,
    marksOf,
    type Call,
    type Inputs,
    type PercentChoice,
    type Run,
} from '@/lib/learn/percentile-model';

import {
    block,
    corners,
    cylinder,
    fit,
    iso,
    Metal,
    place,
    type Plan,
    type Projection,
} from '../anatomy/metal';

/**
 * Pins stand in sorted order. Height is the duration. The lit finger's x is the
 * rank: X0 + (rank - 1) * pitch. Learn plays the median, then the 99th percentile.
 * The lab waits for Run.
 */

const LAB_INPUTS: Inputs = { p: 0.99, extra: false };
const EXTRAS = ['off', 'on'] as const;
type Extra = (typeof EXTRAS)[number];

const CALL_LABEL: Record<Call, string> = {
    short: `The finger stops among the short pins, and the value stays ${BODY_MS} ms`,
    end: `The finger stops at the slow end, and the value is far above ${BODY_MS} ms`,
};
const CALLS: Call[] = ['short', 'end'];

const PITCH = 5;
const PIN_R = 1.15;
const X0 = 48;
const UNITS_PER_MS = 0.4;
const PIN_Y = 30;
const RAIL_Y = 44;
const RAIL_D = 12;
const PLATE_H = 6;

type Drawn = { key: string; paths: ReturnType<typeof block> };

function rankX(rank: number): number {
    return X0 + (rank - 1) * PITCH;
}

function pinHeight(ms: number): number {
    return ms * UNITS_PER_MS;
}

function lineOf(x1: number, y1: number, x2: number, y2: number, z: number, projection: Projection): string {
    const a = iso([x1, y1, z], projection);
    const b = iso([x2, y2, z], projection);
    return `M${a[0].toFixed(2)} ${a[1].toFixed(2)}L${b[0].toFixed(2)} ${b[1].toFixed(2)}`;
}

function sceneOf(samples: readonly number[]) {
    const n = samples.length;
    const xLeft = rankX(0) - 18;
    const xRight = rankX(n) + 24;
    const base: Plan = { x: xLeft, y: 10, w: xRight - xLeft, d: 72, r: 5 };
    const foot = (x: number, y: number): Plan => ({ x, y, w: 14, d: 14, r: 1 });
    const feet = [
        foot(base.x + 12, base.y + 10),
        foot(base.x + base.w - 26, base.y + 10),
        foot(base.x + 12, base.y + base.d - 24),
        foot(base.x + base.w - 26, base.y + base.d - 24),
    ];
    const lip: Plan = { x: rankX(1) - 3, y: PIN_Y - 8, w: (n - 1) * PITCH + 6, d: 3.2, r: 0.4 };
    const railX = rankX(1) - 7.4;
    const rail: Plan = { x: railX, y: RAIL_Y, w: rankX(n) + 7.4 - railX, d: RAIL_D, r: 1 };
    const cheek = (x: number): Plan => ({
        x,
        y: PIN_Y - 6,
        w: 8,
        d: RAIL_Y + RAIL_D - (PIN_Y - 6),
        r: 1,
    });
    const left = cheek(rankX(1) - 16);
    const right = cheek(rankX(n) + 8);
    const railTop = PLATE_H + 5;
    const tallest = samples.reduce((best, sample) => Math.max(best, pinHeight(sample)), 0);
    const pinBoxes = samples.map((ms, index) => {
        const x = rankX(index + 1);
        return {
            plan: { x: x - PIN_R, y: PIN_Y - PIN_R, w: PIN_R * 2, d: PIN_R * 2, r: PIN_R },
            z: PLATE_H,
            h: pinHeight(ms),
        };
    });
    const samples3: { plan: Plan; z: number; h: number }[] = [
        { plan: base, z: 0, h: PLATE_H },
        ...feet.map((plan) => ({ plan, z: -8, h: 8 })),
        { plan: lip, z: PLATE_H, h: 3 },
        { plan: left, z: PLATE_H, h: 18 },
        { plan: right, z: PLATE_H, h: 18 },
        { plan: rail, z: PLATE_H, h: 5 },
        ...pinBoxes,
        {
            plan: { x: rankX(0) - 2, y: RAIL_Y, w: 4, d: 8, r: 0.4 },
            z: railTop,
            h: 32,
        },
        {
            plan: { x: rankX(n) - 2, y: PIN_Y - PIN_R, w: PIN_R * 2, d: PIN_R * 2, r: PIN_R },
            z: PLATE_H,
            h: tallest,
        },
    ];
    const projection = fit(corners(samples3), 720, 420);
    const screw = (plan: Plan, z: number, key: string): Drawn => ({
        key,
        paths: cylinder(plan.x + plan.w / 2, plan.y + plan.d / 2, 1.5, z, 2.2, projection, 10, 0.3),
    });
    const minor: string[] = [];
    const major: string[] = [];
    for (let rank = 1; rank <= n; rank += 1) {
        const x = rankX(rank);
        const len = rank % 10 === 0 ? 4.6 : 2.2;
        const d = lineOf(x, RAIL_Y, x, RAIL_Y - len, railTop, projection);
        if (rank % 10 === 0) major.push(d);
        else minor.push(d);
    }
    const shoe: Plan = { x: -5, y: 1.5, w: 10, d: 9, r: 0.8 };
    const blade: Plan = { x: -1.7, y: 3, w: 3.4, d: 7, r: 0.3 };
    return {
        projection,
        feet: feet.map((plan) => ({
            key: `foot-${plan.x}-${plan.y}`,
            paths: block(plan, -8, 8, projection),
        })),
        screws: [
            ...feet.map((plan) => screw(plan, PLATE_H, `foot-screw-${plan.x}-${plan.y}`)),
            screw(left, PLATE_H + 18, 'left-screw'),
            screw(right, PLATE_H + 18, 'right-screw'),
        ],
        plate: block(base, 0, PLATE_H, projection),
        lip: block(lip, PLATE_H, 3, projection),
        left: block(left, PLATE_H, 18, projection),
        right: block(right, PLATE_H, 18, projection),
        rail: block(rail, PLATE_H, 5, projection),
        ticks: { minor: minor.join(''), major: major.join('') },
        pins: samples.map((ms, index) => ({
            key: `pin-${index + 1}`,
            paths: cylinder(rankX(index + 1), PIN_Y, PIN_R, PLATE_H, pinHeight(ms), projection, 6, 0.15),
        })),
        shoe: block(shoe, 0, 4, projection),
        blade: block(blade, 4, 32, projection),
        railTop,
    };
}

function ordinal(p: number): string {
    return `${Math.round(p * 100)}th`;
}

function learnLine(run: Run, t: number): string {
    if (t >= run.high.rank - 1e-6) {
        return `The finger is at rank ${formatRank(run.high.rank)}, the 99th percentile: ${formatMs(run.high.valueMs)}. Samples above it: ${run.aboveHigh}. The median is rank ${formatRank(run.median.rank)}, ${formatMs(run.median.valueMs)}.`;
    }
    if (Math.abs(t - run.median.rank) <= 1e-6) {
        return `The finger is at rank ${formatRank(run.median.rank)}, the median: ${formatMs(run.median.valueMs)}. Samples above it: ${run.aboveMedian}. The tall pin is still ahead.`;
    }
    if (t < run.median.rank) {
        return `The finger is at rank ${formatRank(t)}, moving through the sorted row toward the median at rank ${formatRank(run.median.rank)}.`;
    }
    return `The finger is at rank ${formatRank(t)}, past the median, moving toward the 99th percentile at rank ${formatRank(run.high.rank)}.`;
}

function outcome(run: Run): string {
    const before = gauge({ p: run.p, extra: false });
    const name = ordinal(run.p);
    if (!run.extra) {
        return `The ${name} percentile on this list is ${formatMs(run.chosen.valueMs)}.`;
    }
    if (Math.abs(run.chosen.valueMs - before.chosen.valueMs) < 1e-6) {
        return `Adding the ${EXTRA_MS} ms sample leaves the ${name} percentile at ${formatMs(run.chosen.valueMs)}.`;
    }
    return `Adding the ${EXTRA_MS} ms sample moves the ${name} percentile from ${formatMs(before.chosen.valueMs)} to ${formatMs(run.chosen.valueMs)}.`;
}

function labLine(run: Run, t: number): string {
    if (t >= run.chosen.rank - 1e-6) {
        return `The finger is at rank ${formatRank(run.chosen.rank)}. The ${ordinal(run.p)} percentile is ${formatMs(run.chosen.valueMs)}. Samples above it: ${run.aboveChosen}.`;
    }
    return `The finger is at rank ${formatRank(t)}, moving toward rank ${formatRank(run.chosen.rank)}.`;
}

export default function PercentileRow({ pane = 'lab' }: { pane?: 'learn' | 'lab' }): React.JSX.Element {
    const figId = pane === 'lab' ? 'fig-pct-h' : 'fig-pct-learn';
    const [inputs, setInputs] = useState<Inputs>(pane === 'learn' ? LEARN_INPUTS : LAB_INPUTS);
    const [guess, setGuess] = useState<Call | null>(null);
    const [run, setRun] = useState<Run | null>(() => (pane === 'learn' ? gauge(LEARN_INPUTS) : null));
    const result = useRef<HTMLDivElement>(null);
    const figure = useRef<HTMLElement>(null);
    const marks = useMemo(() => (run ? marksOf(run, pane === 'learn') : [0]), [run, pane]);
    const end = run ? (pane === 'learn' ? run.high.rank : run.chosen.rank) : 0;
    const clock = useClock({ marks, end, rate: 32, target: figure });
    const { restart } = clock;
    useEffect(() => {
        if (pane !== 'learn') return undefined;
        restart();
        return undefined;
    }, [pane, restart]);
    const scene = useMemo(() => sceneOf(sortSamples(samplesOf(inputs.extra))), [inputs.extra]);
    const t = run ? clock.t : 0;
    const finished = run !== null && clock.t >= end - 1e-6;
    const set = (patch: Partial<Inputs>): void => {
        setInputs((prev) => ({ ...prev, ...patch }));
        setRun(null);
        setGuess(null);
        clock.reset();
    };
    const go = (): void => {
        setRun(gauge(inputs));
        clock.restart();
        revealAfterRender(() => result.current);
    };
    const verdict = run ? judge(guess, callOf(inputs), CALL_LABEL) : '';
    const showFinger = run !== null;
    return (
        <figure ref={figure} className="bp-sheet ln-fig" aria-labelledby={figId}>
            <div className="ln-fig-head">
                <span id={figId}>
                    {pane === 'learn' ? 'A finger on the sorted row' : 'Fig. 1 · Where the rank falls'}
                </span>
                <span>Teaching model, not a trace</span>
            </div>
            <div className={pane === 'lab' ? 'ln-fig-grid' : 'ln-fig-grid ln-fig-grid-one'}>
                {pane === 'lab' ? (
                    <div className="ln-controls">
                        <Choice
                            legend="Which percentile"
                            options={PERCENTILE_CHOICES}
                            label={(p: PercentChoice) => `${ordinal(p)} percentile`}
                            value={inputs.p}
                            onChange={(p) => set({ p })}
                        />
                        <Choice
                            legend="Add one slower sample"
                            options={EXTRAS}
                            label={(extra: Extra) =>
                                extra === 'on' ? `Add ${EXTRA_MS} ms` : 'Leave the list'
                            }
                            value={inputs.extra ? 'on' : 'off'}
                            onChange={(extra) => set({ extra: extra === 'on' })}
                        />
                        <div className="ln-predict">
                            <Choice
                                legend="Predict first"
                                options={CALLS}
                                label={(call) => CALL_LABEL[call]}
                                value={guess}
                                onChange={(call) => {
                                    setGuess(call);
                                    setRun(null);
                                    clock.reset();
                                }}
                            />
                        </div>
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
                            <Metal paths={scene.lip} part="lip" />
                            <Metal paths={scene.left} part="left-cheek" />
                            {scene.pins.map((pin) => (
                                <Metal key={pin.key} paths={pin.paths} part={pin.key} />
                            ))}
                            <Metal paths={scene.right} part="right-cheek" />
                            <Metal paths={scene.rail} part="rail" />
                            {scene.ticks.minor ? (
                                <path className="iso-line" data-tone="lo" d={scene.ticks.minor} />
                            ) : null}
                            {scene.ticks.major ? (
                                <path className="iso-line" data-tone="mid" d={scene.ticks.major} />
                            ) : null}
                            {showFinger ? (
                                <g
                                    data-rank={t}
                                    transform={place(
                                        [0, 0, 0],
                                        [rankX(t), RAIL_Y, scene.railTop],
                                        scene.projection
                                    )}
                                >
                                    <Metal paths={scene.shoe} part="finger-shoe" />
                                    <Metal paths={scene.blade} lit part="rank-finger" />
                                </g>
                            ) : null}
                        </svg>
                    </div>
                    {run ? (
                        <>
                            <p className="m-0 mt-2" data-current-step>
                                {pane === 'learn' ? learnLine(run, t) : labLine(run, t)}
                            </p>
                            <Transport
                                label="Rank finger"
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
                            Choose the percentile and whether to add the {EXTRA_MS} ms sample, predict, then
                            press Run.
                        </p>
                    )}
                </div>
            </div>
            <figcaption className="ln-label mt-4">
                Each pin is one request. Pin height is {UNITS_PER_MS} world units per millisecond, so a{' '}
                {TAIL_MS} ms pin is {TAIL_MS / BODY_MS} times a {BODY_MS} ms pin. The finger&apos;s place
                along the rail is the rank. The durations are assumed: {BODY_COUNT} at {BODY_MS} ms, one at{' '}
                {SHOULDER_MS} ms, one at {TAIL_MS} ms, and an optional {EXTRA_MS} ms. Not a trace.
            </figcaption>
        </figure>
    );
}
