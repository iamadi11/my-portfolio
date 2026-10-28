'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import Choice from '@/components/learn/kit/Choice';
import { revealAfterRender } from '@/components/learn/kit/reveal';
import Transport from '@/components/learn/kit/Transport';
import { useClock } from '@/components/learn/kit/useClock';
import { verdict as judge } from '@/components/learn/kit/verdict';
import {
    HIGH_ARRIVAL_PER_S,
    LOADS,
    LOW_ARRIVAL_PER_S,
    SERVICE_PER_S,
    arrivalOf,
    callOf,
    endOf,
    formatMean,
    formatSeconds,
    formatUtil,
    loadArrival,
    marksOf,
    station,
    type Call,
    type Load,
    type Station,
} from '@/lib/learn/utilisation-queueing-model';

import {
    block,
    corners,
    cylinder,
    fit,
    iso,
    Metal,
    place,
    type Plan,
    type Point3,
    type Projection,
} from '../anatomy/metal';

type SolidPaths = ReturnType<typeof block>;

/**
 * One machine and a row of jobs. The jobs in the row are `station().present`.
 * Learn moves that count from the short row to the long row. The lab waits
 * for Run. Nothing on the metal is a word.
 */

const LOW = station(LOW_ARRIVAL_PER_S);
const HIGH = station(HIGH_ARRIVAL_PER_S);
const CAP = HIGH.present;

const CALL_LABEL: Record<Call, string> = {
    short: 'The wait stays short',
    sharp: 'The wait grows sharply',
};
const CALLS: Call[] = ['short', 'sharp'];

const JOB_W = 10;
const JOB_D = 10;
const JOB_H = 8;
const PITCH = 14;
const SLOT_X0 = 72;
const SLOT_Y = 44.5;
const SLOT_Z = 20;
const BIN_X0 = 158;
const BIN_Y = 84;
const BIN_Z = 14;

type Drawn = { key: string; part: string; paths: SolidPaths };
type JobBody = { index: number; rest: Point3; slot: Point3; paths: SolidPaths };

function jobPlan(at: Point3): Plan {
    return { x: at[0], y: at[1], w: JOB_W, d: JOB_D, r: 1.2 };
}

function binAt(index: number): Point3 {
    const col = index % 2;
    const layer = Math.floor(index / 2);
    return [BIN_X0 + col * 16, BIN_Y, BIN_Z + layer * 9];
}

function slotAt(index: number): Point3 {
    return [SLOT_X0 + index * PITCH, SLOT_Y, SLOT_Z];
}

function segment(x1: number, y1: number, x2: number, y2: number, z: number, projection: Projection): string {
    const a = iso([x1, y1, z], projection);
    const b = iso([x2, y2, z], projection);
    return `M${a[0].toFixed(2)} ${a[1].toFixed(2)}L${b[0].toFixed(2)} ${b[1].toFixed(2)}`;
}

function sceneOf() {
    const plate: Plan = { x: 0, y: 0, w: 214, d: 116, r: 5 };
    const foot = (x: number, y: number): Plan => ({ x, y, w: 16, d: 14, r: 1 });
    const feet = [foot(14, 12), foot(180, 12), foot(14, 92), foot(110, 92)];
    const plinth: Plan = { x: 14, y: 28, w: 46, d: 44, r: 1.4 };
    const housing: Plan = { x: 18, y: 32, w: 34, d: 36, r: 1 };
    const lintel: Plan = { x: 52, y: 32, w: 8, d: 36, r: 0.6 };
    const bed: Plan = { x: 60, y: 38, w: 140, d: 24, r: 0.8 };
    const railFar: Plan = { x: 66, y: 39.2, w: 118, d: 2.2, r: 0.2 };
    const railNear: Plan = { x: 66, y: 56.2, w: 118, d: 2.2, r: 0.2 };
    const ruler: Plan = { x: 66, y: 58.6, w: 120, d: 3.2, r: 0.2 };
    const endStop: Plan = { x: 188, y: 38, w: 8, d: 24, r: 0.4 };
    const hopper: Plan = { x: 148, y: 78, w: 52, d: 28, r: 1 };
    const hopperBack: Plan = { x: 148, y: 76, w: 52, d: 3, r: 0.3 };
    const cheekL: Plan = { x: 146, y: 78, w: 3, d: 28, r: 0.3 };
    const cheekR: Plan = { x: 198, y: 78, w: 3, d: 28, r: 0.3 };
    const layers = Math.ceil(CAP / 2);
    const stackTop = BIN_Z + (layers - 1) * 9 + JOB_H;
    const boxes: { plan: Plan; z: number; h: number }[] = [
        { plan: plate, z: 0, h: 8 },
        ...feet.map((plan) => ({ plan, z: -9, h: 9 })),
        { plan: plinth, z: 8, h: 12 },
        { plan: housing, z: 20, h: 28 },
        { plan: lintel, z: 48, h: 6 },
        { plan: bed, z: 8, h: 12 },
        { plan: railFar, z: 20, h: 2.2 },
        { plan: railNear, z: 20, h: 2.2 },
        { plan: ruler, z: 20, h: 1.6 },
        { plan: endStop, z: 20, h: 12 },
        { plan: hopper, z: 8, h: 6 },
        { plan: hopperBack, z: 14, h: 22 },
        { plan: cheekL, z: 14, h: stackTop - 14 + 2 },
        { plan: cheekR, z: 14, h: stackTop - 14 + 2 },
        { plan: { x: 28, y: 43, w: 14, d: 14, r: 7 }, z: 48, h: 14 },
    ];
    for (let index = 0; index < CAP; index += 1) {
        boxes.push({ plan: jobPlan(binAt(index)), z: binAt(index)[2], h: JOB_H });
        boxes.push({ plan: jobPlan(slotAt(index)), z: slotAt(index)[2], h: JOB_H });
    }
    const projection = fit(corners(boxes), 720, 420);
    const screw = (cx: number, cy: number, z: number, key: string): Drawn => ({
        key,
        part: key,
        paths: cylinder(cx, cy, 1.35, z, 2, projection, 8, 0.25),
    });
    const rulerTop = 21.6;
    const ticks = Array.from({ length: CAP }, (_, index) => {
        const x = slotAt(index)[0] + JOB_W / 2;
        const len = index === 0 || index === CAP - 1 ? 2.4 : 1.4;
        return segment(x, 61.8, x, 61.8 - len, rulerTop, projection);
    }).join('');
    const jobs: JobBody[] = Array.from({ length: CAP }, (_, index) => {
        const rest = binAt(index);
        return {
            index,
            rest,
            slot: slotAt(index),
            paths: block(jobPlan(rest), rest[2], JOB_H, projection),
        };
    });
    return {
        projection,
        feet: feet.map((plan) => ({
            key: `foot-${plan.x}-${plan.y}`,
            part: `foot-${plan.x}-${plan.y}`,
            paths: block(plan, -9, 9, projection),
        })),
        footScrews: feet.map((plan) =>
            screw(plan.x + plan.w / 2, plan.y + plan.d / 2, 8, `screw-${plan.x}-${plan.y}`)
        ),
        housingScrews: [
            screw(22, 36, 48, 'housing-screw-a'),
            screw(22, 64, 48, 'housing-screw-b'),
            screw(46, 36, 48, 'housing-screw-c'),
            screw(46, 64, 48, 'housing-screw-d'),
        ],
        stopScrew: screw(192, 50, 32, 'stop-screw'),
        plate: block(plate, 0, 8, projection),
        plinth: block(plinth, 8, 12, projection),
        housing: block(housing, 20, 28, projection),
        posts: [
            {
                key: 'post-far',
                part: 'post-far',
                paths: cylinder(56, 36, 2, 20, 28, projection, 10, 0.3),
            },
            {
                key: 'post-near',
                part: 'post-near',
                paths: cylinder(56, 64, 2, 20, 28, projection, 10, 0.3),
            },
        ],
        lintel: block(lintel, 48, 6, projection),
        spindle: cylinder(35, 50, 6.5, 48, 10, projection, 16, 0.4),
        collar: cylinder(35, 50, 3.2, 58, 4, projection, 12, 0.3),
        bed: block(bed, 8, 12, projection),
        railFar: block(railFar, 20, 2.2, projection),
        railNear: block(railNear, 20, 2.2, projection),
        ruler: block(ruler, 20, 1.6, projection),
        ticks,
        endStop: block(endStop, 20, 12, projection),
        hopper: block(hopper, 8, 6, projection),
        hopperBack: block(hopperBack, 14, 22, projection),
        cheekL: block(cheekL, 14, stackTop - 14 + 2, projection),
        cheekR: block(cheekR, 14, stackTop - 14 + 2, projection),
        jobs,
    };
}

function stateLine(s: Station): string {
    const jobs = s.present === 1 ? '1 job is in the row' : `${s.present} jobs are in the row`;
    return `${jobs}. Mean waiting is ${formatMean(s.meanWaiting)}. Mean time in the system is ${formatSeconds(s.timeInSystemS)}. Utilisation is ${formatUtil(s.utilisation)}. The mean number in the system is ${formatMean(s.meanInSystem)}, equal to ${formatMean(s.arrivalPerS)} per second times ${formatSeconds(s.timeInSystemS)}. Assumed arrival rate.`;
}

function outcome(load: Load): string {
    const chosen = station(loadArrival(load));
    const jobs = chosen.present === 1 ? '1 job' : `${chosen.present} jobs`;
    const against =
        load === 'low'
            ? `${formatSeconds(HIGH.timeInSystemS)} at ${HIGH_ARRIVAL_PER_S} arrivals per second`
            : `${formatSeconds(LOW.timeInSystemS)} at ${LOW_ARRIVAL_PER_S} arrivals per second`;
    return `At ${chosen.arrivalPerS} arrivals per second the mean time in the system is ${formatSeconds(chosen.timeInSystemS)} and the row shows ${jobs}, against ${against}. The mean number in the system is ${formatMean(chosen.meanInSystem)}, equal to ${chosen.arrivalPerS} per second times ${formatSeconds(chosen.timeInSystemS)}.`;
}

export default function QueueRow({ pane = 'lab' }: { pane?: 'learn' | 'lab' }): React.JSX.Element {
    const figId = pane === 'lab' ? 'fig-queue-h' : 'fig-queue-learn';
    const learn = pane === 'learn';
    const [load, setLoad] = useState<Load>('low');
    const [guess, setGuess] = useState<Call | null>(null);
    const [started, setStarted] = useState(learn);
    const result = useRef<HTMLDivElement>(null);
    const figure = useRef<HTMLElement>(null);
    const end = endOf(learn, load);
    const marks = useMemo(() => marksOf(learn, load), [learn, load]);
    const clock = useClock({ marks, end, rate: 0.22, target: figure });
    const { restart } = clock;
    useEffect(() => {
        if (!learn) return undefined;
        restart();
        return undefined;
    }, [learn, restart]);
    const scene = useMemo(() => sceneOf(), []);
    const active = learn || started;
    const snap = active ? station(arrivalOf(Math.min(end, clock.t))) : null;
    const present = snap?.present ?? 0;
    const finished = snap !== null && clock.t >= end - 1e-6;
    const pick = (next: Load): void => {
        setLoad(next);
        setStarted(false);
        setGuess(null);
        clock.reset();
    };
    const go = (): void => {
        setStarted(true);
        clock.restart();
        revealAfterRender(() => result.current);
    };
    const verdict = snap ? judge(guess, callOf(load), CALL_LABEL) : '';
    return (
        <figure ref={figure} className="bp-sheet ln-fig" aria-labelledby={figId} data-queue={present}>
            <div className="ln-fig-head">
                <span id={figId}>{learn ? 'Jobs at one machine' : 'Fig. 1 · How long the row gets'}</span>
                <span>Formulas, not a measurement</span>
            </div>
            <div className={pane === 'lab' ? 'ln-fig-grid' : 'ln-fig-grid ln-fig-grid-one'}>
                {pane === 'lab' ? (
                    <div className="ln-controls">
                        <Choice
                            legend="Utilisation"
                            options={LOADS}
                            label={(item: Load) =>
                                item === 'low'
                                    ? `Low, ${formatUtil(LOW.utilisation)} (${LOW_ARRIVAL_PER_S} per second)`
                                    : `High, ${formatUtil(HIGH.utilisation)} (${HIGH_ARRIVAL_PER_S} per second)`
                            }
                            value={load}
                            onChange={pick}
                        />
                        <div className="ln-predict">
                            <Choice
                                legend="Predict first"
                                options={CALLS}
                                label={(call) => CALL_LABEL[call]}
                                value={guess}
                                onChange={(call) => {
                                    setGuess(call);
                                    setStarted(false);
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
                                <Metal key={part.key} paths={part.paths} part={part.part} />
                            ))}
                            <Metal paths={scene.plate} part="plate" />
                            {scene.footScrews.map((part) => (
                                <Metal key={part.key} paths={part.paths} part={part.part} />
                            ))}
                            <Metal paths={scene.plinth} part="plinth" />
                            <Metal paths={scene.bed} part="bed" />
                            <Metal paths={scene.railFar} part="rail-far" />
                            <Metal paths={scene.railNear} part="rail-near" />
                            <Metal paths={scene.ruler} part="ruler" />
                            {scene.ticks ? (
                                <path className="iso-line" data-tone="mid" d={scene.ticks} />
                            ) : null}
                            <Metal paths={scene.endStop} part="end-stop" />
                            <Metal paths={scene.stopScrew.paths} part={scene.stopScrew.part} />
                            <Metal paths={scene.housing} part="housing" />
                            {scene.housingScrews.map((part) => (
                                <Metal key={part.key} paths={part.paths} part={part.part} />
                            ))}
                            {scene.posts.map((part) => (
                                <Metal key={part.key} paths={part.paths} part={part.part} />
                            ))}
                            <Metal paths={scene.lintel} part="lintel" />
                            <Metal paths={scene.spindle} part="spindle" />
                            <Metal paths={scene.collar} part="collar" />
                            <Metal paths={scene.hopper} part="hopper" />
                            <Metal paths={scene.hopperBack} part="hopper-back" />
                            <Metal paths={scene.cheekL} part="hopper-cheek-l" />
                            <Metal paths={scene.cheekR} part="hopper-cheek-r" />
                            <g data-queue={present}>
                                {scene.jobs.map((job) => {
                                    const inRow = job.index < present;
                                    const at = inRow ? job.slot : job.rest;
                                    return (
                                        <g
                                            key={`job-${job.index}`}
                                            transform={place(job.rest, at, scene.projection)}
                                        >
                                            <Metal paths={job.paths} lit={inRow} part={`job-${job.index}`} />
                                        </g>
                                    );
                                })}
                            </g>
                        </svg>
                    </div>
                    {snap ? (
                        <>
                            <p className="m-0 mt-2" data-current-step>
                                {stateLine(snap)}
                            </p>
                            <Transport
                                label="Waiting row"
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
                                    {outcome(load)} {verdict}
                                </p>
                            ) : null}
                        </>
                    ) : (
                        <p className="ln-frame">
                            Choose {LOW_ARRIVAL_PER_S} or {HIGH_ARRIVAL_PER_S} arrivals per second, predict
                            whether the wait stays short or grows sharply, then press Run.
                        </p>
                    )}
                </div>
            </div>
            <figcaption className="ln-label mt-4">
                Assumed: the machine finishes {SERVICE_PER_S} jobs per second, the short row is{' '}
                {LOW_ARRIVAL_PER_S} arrivals per second, and the long row is {HIGH_ARRIVAL_PER_S}. The mean
                number in the system equals the arrival rate times the mean time in the system. The row count
                is the mean number waiting, rounded to a whole job. Not a measurement.
            </figcaption>
        </figure>
    );
}
