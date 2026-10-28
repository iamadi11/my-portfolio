'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import Choice from '@/components/learn/kit/Choice';
import { revealAfterRender } from '@/components/learn/kit/reveal';
import Transport from '@/components/learn/kit/Transport';
import { useClock } from '@/components/learn/kit/useClock';
import { verdict as judge } from '@/components/learn/kit/verdict';
import {
    LEARN_INPUTS,
    SERVICE_MS,
    WINDOW_MS,
    WORKER_COUNTS,
    along,
    callOf,
    completionsAt,
    marksOf,
    onBed,
    serve,
    type Call,
    type Inputs,
    type Run,
    type Workers,
} from '@/lib/learn/latency-model';

import {
    block,
    corners,
    cylinder,
    fit,
    Metal,
    place,
    topTicks,
    type Plan,
    type Point3,
} from '../anatomy/metal';

/**
 * A piece slides the length of a bed. Its place is along(job, t): how far that
 * job has gone through its service. Pieces in the tray are completionsAt(run, t).
 * Learn plays one busy bed. The lab waits for Run.
 */

const LAB_INPUTS: Inputs = { serviceMs: 500, workers: 4 };

const CALL_LABEL: Record<Call, string> = {
    sooner: 'The first piece finishes before the service time',
    more: 'The first piece takes the service time, and the tray beats one bed',
    same: 'The first piece takes the service time, and the tray matches one bed',
};
const CALLS: Call[] = ['sooner', 'more', 'same'];

const BED_H = 8;
const BED_D = 22;
const PITCH = 46;
const CARRIAGE_X0 = 48;
const TRAVEL = 84;
const CARRIAGE: Plan = { x: 0, y: 0, w: 16, d: 12, r: 1.2 };
const BLANK: Plan = { x: 0, y: 0, w: 14, d: 12, r: 1 };

type Drawn = { key: string; paths: ReturnType<typeof block> };

function bedYs(workers: Workers): number[] {
    const origin = -((workers - 1) * PITCH) / 2;
    return Array.from({ length: workers }, (_, i) => origin + i * PITCH);
}

function sceneOf(workers: Workers) {
    const ys = bedYs(workers);
    const yMin = ys[0] - 22;
    const yMax = ys[ys.length - 1] + BED_D + 22;
    const base: Plan = { x: 6, y: yMin, w: 214, d: yMax - yMin, r: 5 };
    const foot = (x: number, y: number): Plan => ({ x, y, w: 14, d: 14, r: 1 });
    const feet = [
        foot(base.x + 12, base.y + 12),
        foot(base.x + base.w - 26, base.y + 12),
        foot(base.x + 12, base.y + base.d - 26),
        foot(base.x + base.w - 26, base.y + base.d - 26),
    ];
    const beds = ys.map((y) => {
        const bed: Plan = { x: 48, y, w: 100, d: BED_D, r: 2 };
        const rail: Plan = { x: 48, y, w: 100, d: 4, r: 0.4 };
        const infeed: Plan = { x: 30, y: y - 2, w: 16, d: BED_D + 4, r: 1 };
        const outfeed: Plan = { x: 150, y: y - 2, w: 16, d: BED_D + 4, r: 1 };
        const strip: Plan = { x: 54, y: y + BED_D - 3, w: 88, d: 3, r: 0 };
        return { y, bed, rail, infeed, outfeed, strip };
    });
    const midY = (ys[0] + ys[ys.length - 1] + BED_D) / 2;
    const tray: Plan = { x: 178, y: midY - 16, w: 32, d: 32, r: 2 };
    const samples: { plan: Plan; z: number; h: number }[] = [
        { plan: base, z: 0, h: 6 },
        ...feet.map((plan) => ({ plan, z: -8, h: 8 })),
        ...beds.flatMap((b) => [
            { plan: b.bed, z: 0, h: BED_H },
            { plan: b.rail, z: 0, h: 14 },
            { plan: b.infeed, z: 0, h: 16 },
            { plan: b.outfeed, z: 0, h: 16 },
            { plan: { x: CARRIAGE_X0, y: b.y + 5, w: 16, d: 12, r: 1 }, z: BED_H, h: 10 },
            { plan: { x: CARRIAGE_X0 + TRAVEL, y: b.y + 5, w: 16, d: 12, r: 1 }, z: BED_H, h: 10 },
        ]),
        { plan: tray, z: 0, h: 4 },
        { plan: { x: tray.x + 9, y: tray.y + 10, w: 14, d: 12, r: 1 }, z: 4, h: 22 },
    ];
    const projection = fit(corners(samples), 720, 420);
    const screw = (plan: Plan, z: number, key: string): Drawn => ({
        key,
        paths: cylinder(plan.x + plan.w / 2, plan.y + plan.d / 2, 1.5, z, 2.2, projection, 10, 0.3),
    });
    return {
        projection,
        feet: feet.map((plan) => ({
            key: `foot-${plan.x}-${plan.y}`,
            paths: block(plan, -8, 8, projection),
        })),
        baseScrews: feet.map((plan) => screw(plan, 6, `base-screw-${plan.x}-${plan.y}`)),
        base: block(base, 0, 6, projection),
        beds: beds.map((b) => ({
            y: b.y,
            parts: [
                { key: `rail-${b.y}`, paths: block(b.rail, 0, 14, projection) },
                { key: `bed-${b.y}`, paths: block(b.bed, 0, BED_H, projection) },
                { key: `strip-${b.y}`, paths: block(b.strip, BED_H, 1.4, projection) },
                { key: `in-${b.y}`, paths: block(b.infeed, 0, 16, projection) },
                { key: `out-${b.y}`, paths: block(b.outfeed, 0, 16, projection) },
            ] satisfies Drawn[],
            screws: [screw(b.infeed, 16, `in-screw-${b.y}`), screw(b.outfeed, 16, `out-screw-${b.y}`)],
            ticks: topTicks(56, 140, 8, 4, b.y + BED_D, BED_H + 1.4, [-1.5, -2.8], projection, 'x'),
        })),
        tray: block(tray, 0, 4, projection),
        blankAt: [tray.x + 9, tray.y + 10, 4] as Point3,
        carriage: block(CARRIAGE, 0, 10, projection),
        blank: block(BLANK, 0, 5, projection),
    };
}

function lineOf(run: Run, t: number): string {
    const held = completionsAt(run, t);
    const moving = run.jobs.filter((job) => onBed(job, t));
    if (moving.length === 0) {
        return `No piece is crossing. The first piece finishes at ${run.firstFinishMs} ms. Pieces in the tray: ${held}.`;
    }
    const lead = moving.reduce((best, job) => ((along(job, t) ?? 0) >= (along(best, t) ?? 0) ? job : best));
    const ms = Math.round((along(lead, t) ?? 0) * run.serviceMs);
    const who = moving.length === 1 ? 'One piece is crossing' : `${moving.length} pieces are crossing`;
    return `${who}. The furthest is ${ms} ms into a ${run.serviceMs} ms service. Pieces in the tray: ${held}.`;
}

function resultOf(run: Run): string {
    const one = serve({ serviceMs: run.serviceMs, workers: 1 });
    if (run.workers === 1) {
        return `The first piece finishes at ${run.firstFinishMs} ms. The tray holds ${run.completions}.`;
    }
    if (run.completions > one.completions) {
        return `The first piece still finishes at ${run.firstFinishMs} ms. The tray holds ${run.completions}, against ${one.completions} on one bed.`;
    }
    return `The first piece still finishes at ${run.firstFinishMs} ms. The tray holds ${run.completions}, the same as one bed.`;
}

export default function LatencyBench({ pane = 'lab' }: { pane?: 'learn' | 'lab' }): React.JSX.Element {
    const figId = pane === 'lab' ? 'fig-lat-h' : 'fig-lat-learn';
    const [inputs, setInputs] = useState<Inputs>(pane === 'learn' ? LEARN_INPUTS : LAB_INPUTS);
    const [guess, setGuess] = useState<Call | null>(null);
    const [run, setRun] = useState<Run | null>(() => (pane === 'learn' ? serve(LEARN_INPUTS) : null));
    const result = useRef<HTMLDivElement>(null);
    const figure = useRef<HTMLElement>(null);
    const marks = useMemo(() => (run ? marksOf(run) : [0]), [run]);
    const end = run ? WINDOW_MS : 0;
    const clock = useClock({ marks, end, rate: 250, target: figure });
    const { restart } = clock;
    useEffect(() => {
        if (pane !== 'learn') return undefined;
        restart();
        return undefined;
    }, [pane, restart]);
    const scene = useMemo(() => sceneOf(inputs.workers), [inputs.workers]);
    const t = run ? clock.t : 0;
    const finished = run !== null && clock.t >= end - 1e-6;
    const set = (patch: Partial<Inputs>): void => {
        setInputs((prev) => ({ ...prev, ...patch }));
        setRun(null);
        setGuess(null);
        clock.reset();
    };
    const go = (): void => {
        setRun(serve(inputs));
        clock.restart();
        revealAfterRender(() => result.current);
    };
    const verdict = run ? judge(guess, callOf(inputs), CALL_LABEL) : '';
    const done = run
        ? run.jobs
              .filter((job) => job.finishedMs !== null && job.finishedMs <= t && job.finishedMs <= WINDOW_MS)
              .sort((a, b) => (a.finishedMs ?? 0) - (b.finishedMs ?? 0))
        : [];
    return (
        <figure ref={figure} className="bp-sheet ln-fig" aria-labelledby={figId}>
            <div className="ln-fig-head">
                <span id={figId}>
                    {pane === 'learn' ? 'One piece crossing one bed' : 'Fig. 1 · How many pieces finish'}
                </span>
                <span>Teaching model, not a benchmark</span>
            </div>
            <div className={pane === 'lab' ? 'ln-fig-grid' : 'ln-fig-grid ln-fig-grid-one'}>
                {pane === 'lab' ? (
                    <div className="ln-controls">
                        <Choice
                            legend="Service time of one piece"
                            options={SERVICE_MS}
                            label={(v) => `${v} ms`}
                            value={inputs.serviceMs}
                            onChange={(serviceMs) => set({ serviceMs })}
                        />
                        <Choice
                            legend="How many beds are bolted on"
                            options={WORKER_COUNTS}
                            label={(v) => (v === 1 ? '1 bed' : `${v} beds`)}
                            value={inputs.workers}
                            onChange={(workers) => set({ workers })}
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
                            <Metal paths={scene.base} part="base" />
                            {scene.baseScrews.map((part) => (
                                <Metal key={part.key} paths={part.paths} part={part.key} />
                            ))}
                            {scene.beds.map((bed, worker) => {
                                const job = run?.jobs.find(
                                    (item) => item.worker === worker && onBed(item, t)
                                );
                                const fraction = job ? (along(job, t) ?? 0) : 0;
                                const at: Point3 = [CARRIAGE_X0 + fraction * TRAVEL, bed.y + 5, BED_H];
                                return (
                                    <g key={bed.y}>
                                        {bed.parts.map((part) => (
                                            <Metal key={part.key} paths={part.paths} part={part.key} />
                                        ))}
                                        {bed.screws.map((part) => (
                                            <Metal key={part.key} paths={part.paths} part={part.key} />
                                        ))}
                                        {bed.ticks.minor ? (
                                            <path className="iso-line" data-tone="lo" d={bed.ticks.minor} />
                                        ) : null}
                                        {bed.ticks.major ? (
                                            <path className="iso-line" data-tone="mid" d={bed.ticks.major} />
                                        ) : null}
                                        {job ? (
                                            <g transform={place([0, 0, 0], at, scene.projection)}>
                                                <Metal paths={scene.carriage} lit part="job" />
                                            </g>
                                        ) : null}
                                    </g>
                                );
                            })}
                            <Metal paths={scene.tray} part="tray" />
                            {done.map((job, index) => (
                                <g
                                    key={job.arrivedMs}
                                    transform={place(
                                        [0, 0, 0],
                                        [scene.blankAt[0], scene.blankAt[1], scene.blankAt[2] + index * 5],
                                        scene.projection
                                    )}
                                >
                                    <Metal paths={scene.blank} part="done" />
                                </g>
                            ))}
                        </svg>
                    </div>
                    {run ? (
                        <>
                            <p className="m-0 mt-2" data-current-step>
                                {lineOf(run, t)}
                            </p>
                            <Transport
                                label="Bed controls"
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
                                    {resultOf(run)} {verdict}
                                </p>
                            ) : null}
                        </>
                    ) : (
                        <p className="ln-frame">
                            Choose the service time and how many beds, predict, then press Run.
                        </p>
                    )}
                </div>
            </div>
            <figcaption className="ln-label mt-4">
                A piece slides from the near stop to the far stop. That place is how far the job has gone
                through its service. A piece in the tray has finished. The service times 125, 250, and 500 ms,
                the 1000 ms window, and an arrival every 250 ms are assumed. No queueing delay: a job starts
                only when a bed is free, and this model does not make it wait. No contention: beds do not slow
                each other. Not a benchmark.
            </figcaption>
        </figure>
    );
}
