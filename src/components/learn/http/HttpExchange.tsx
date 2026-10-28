'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import Choice from '@/components/learn/kit/Choice';
import { revealAfterRender } from '@/components/learn/kit/reveal';
import Transport from '@/components/learn/kit/Transport';
import { useClock } from '@/components/learn/kit/useClock';
import { verdict as judge } from '@/components/learn/kit/verdict';
import {
    LEARN_EXISTS,
    LEARN_METHOD,
    METHODS,
    OUTCOME_LABEL,
    endTime,
    events,
    frameAt,
    outcomeOf,
    summary,
    type Method,
    type Outcome,
    type Place,
} from '@/lib/learn/http-model';

import { block, corners, cylinder, fit, Metal, place, type Plan, type Point3 } from '../anatomy/metal';

/**
 * One resource press. The cartridge is the message. Its seat is frame.place
 * (client nest or server pad). The plate in the slot is frame.plate. Nothing
 * in the drawing decides a status the model did not return.
 */

const REST: Point3 = [0, 0, 0];
const CLIENT_SEAT: Point3 = [20, -8, 19];
const SERVER_SEAT: Point3 = [156, 24, 19];
const MSG: Plan = { x: 0, y: 0, w: 30, d: 16, r: 1.2 };

const METHODS_UI = METHODS;
const EXISTS_OPTIONS = ['present', 'absent'] as const;
type ExistsOption = (typeof EXISTS_OPTIONS)[number];
const OUTCOMES = Object.keys(OUTCOME_LABEL) as Outcome[];

function toExists(option: ExistsOption): boolean {
    return option === 'present';
}

function fromExists(exists: boolean): ExistsOption {
    return exists ? 'present' : 'absent';
}

function seatOf(where: Place): Point3 {
    return where === 'client' ? CLIENT_SEAT : SERVER_SEAT;
}

type Part = { key: string; paths: ReturnType<typeof block> };

function sceneOf() {
    const base: Plan = { x: -16, y: -46, w: 252, d: 112, r: 5 };
    const foot = (x: number, y: number): Plan => ({ x, y, w: 16, d: 16, r: 1 });
    const feet = [
        foot(base.x + 12, base.y + 10),
        foot(base.x + base.w - 28, base.y + 10),
        foot(base.x + 12, base.y + base.d - 26),
        foot(base.x + base.w - 28, base.y + base.d - 26),
    ];
    const nameplate: Plan = { x: 96, y: 52, w: 44, d: 10, r: 1 };
    const nest: Plan = { x: 8, y: -22, w: 70, d: 50, r: 2 };
    const nestBed: Plan = { x: 16, y: -12, w: 48, d: 28, r: 1 };
    const nestWallL: Plan = { x: 8, y: -22, w: 6, d: 50, r: 1 };
    const nestWallR: Plan = { x: 72, y: -22, w: 6, d: 50, r: 1 };
    const rail: Plan = { x: 82, y: -4, w: 58, d: 8, r: 1 };
    const bushings = [88, 122].map((x) => ({ x, y: -6, w: 10, d: 12, r: 0.8 }));
    const stops = [80, 140].map((x) => ({ x, y: -8, w: 5, d: 16, r: 0.6 }));
    const press: Plan = { x: 150, y: -30, w: 78, d: 62, r: 2 };
    const recess: Plan = { x: 162, y: -18, w: 46, d: 32, r: 1 };
    const jawL: Plan = { x: 150, y: -28, w: 8, d: 56, r: 1 };
    const jawR: Plan = { x: 214, y: -28, w: 8, d: 56, r: 1 };
    const riser: Plan = { x: 218, y: -26, w: 8, d: 52, r: 1 };
    const clamp: Plan = { x: 160, y: 8, w: 50, d: 6, r: 1 };
    const pad: Plan = { x: 154, y: 20, w: 40, d: 22, r: 1 };
    const original: Plan = { x: 168, y: -14, w: 34, d: 22, r: 1 };
    const replaced: Plan = { x: 166, y: -16, w: 38, d: 26, r: 1 };
    const worked: Plan = { x: 168, y: -14, w: 34, d: 22, r: 1 };
    const tab: Plan = { x: 176, y: 4, w: 18, d: 7, r: 0.6 };
    const projection = fit(
        corners([
            { plan: base, z: 0, h: 6 },
            ...feet.map((plan) => ({ plan, z: -8, h: 8 })),
            { plan: nest, z: 6, h: 14 },
            { plan: press, z: 6, h: 16 },
            { plan: riser, z: 22, h: 20 },
            { plan: MSG, z: 19, h: 8 },
            { plan: { x: CLIENT_SEAT[0], y: CLIENT_SEAT[1], w: 30, d: 16, r: 0 }, z: 19, h: 8 },
            { plan: { x: SERVER_SEAT[0], y: SERVER_SEAT[1], w: 30, d: 16, r: 0 }, z: 19, h: 8 },
            { plan: nameplate, z: 6, h: 2 },
        ]),
        780,
        420
    );
    const part = (key: string, plan: Plan, z: number, height: number): Part => ({
        key,
        paths: block(plan, z, height, projection),
    });
    const rib = (index: number): Part =>
        part(`rib-${index}`, { x: 3, y: 3 + index * 4.2, w: 24, d: 2.2, r: 0.4 }, 5, 1.2);
    return {
        projection,
        feet: feet.map((plan) => part(`foot-${plan.x}-${plan.y}`, plan, -8, 8)),
        screws: feet.map((plan) => ({
            key: `screw-${plan.x}-${plan.y}`,
            paths: cylinder(plan.x + 8, plan.y + 8, 1.7, 0, 2.2, projection, 10, 0.3),
        })),
        base: block(base, 0, 6, projection),
        nameplate: block(nameplate, 6, 1.6, projection),
        nest: block(nest, 6, 12, projection),
        nestBed: block(nestBed, 18, 3, projection),
        nestWalls: [nestWallL, nestWallR].map((plan, index) => part(`nest-wall-${index}`, plan, 18, 10)),
        knob: cylinder(40, -24, 5, 18, 6, projection, 14, 0.4),
        pin: cylinder(40, -24, 1.6, 24, 3, projection, 10, 0.2),
        rail: block(rail, 16, 4, projection),
        bushings: bushings.map((plan) => part(`bush-${plan.x}`, plan, 14, 8)),
        stops: stops.map((plan) => part(`stop-${plan.x}`, plan, 16, 8)),
        press: block(press, 6, 14, projection),
        recess: block(recess, 20, 2, projection),
        jaws: [jawL, jawR].map((plan, index) => part(`jaw-${index}`, plan, 20, 14)),
        riser: block(riser, 20, 22, projection),
        rods: [168, 198].map((x) => ({
            key: `rod-${x}`,
            paths: cylinder(x, -24, 2.2, 20, 16, projection, 12, 0.3),
        })),
        stamp: cylinder(184, -8, 7, 28, 8, projection, 16, 0.4),
        cap: cylinder(184, -8, 9, 36, 3, projection, 16, 0.3),
        clamp: block(clamp, 20, 4, projection),
        clampScrews: [168, 200].map((x) => ({
            key: `clamp-screw-${x}`,
            paths: cylinder(x, 11, 1.5, 24, 2.4, projection, 10, 0.2),
        })),
        pad: block(pad, 16, 3, projection),
        original: block(original, 22, 3, projection),
        replaced: block(replaced, 22, 5, projection),
        worked: block(worked, 22, 3, projection),
        tab: block(tab, 22, 4, projection),
        getWalls: (
            [
                { x: 0, y: 0, w: 30, d: 3.2, r: 0.6 },
                { x: 0, y: 12.8, w: 30, d: 3.2, r: 0.6 },
                { x: 0, y: 3.2, w: 3.2, d: 9.6, r: 0.4 },
                { x: 26.8, y: 3.2, w: 3.2, d: 9.6, r: 0.4 },
            ] as Plan[]
        ).map((plan, index) => part(`get-wall-${index}`, plan, 0, 5)),
        putBody: block(MSG, 0, 5, projection),
        postBody: block({ x: 0, y: 0, w: 24, d: 16, r: 1.2 }, 0, 5, projection),
        tooth: block({ x: 22, y: 5, w: 8, d: 6, r: 0.6 }, 1, 3.5, projection),
        responseBody: block({ x: 0, y: 0, w: 30, d: 16, r: 1.2 }, 0, 4, projection),
        ribs: [0, 1, 2].map((index) => rib(index)),
    };
}

function PlateMark({
    scene,
    plate,
    lit,
}: {
    scene: ReturnType<typeof sceneOf>;
    plate: 'empty' | 'original' | 'replaced' | 'processed';
    lit: boolean;
}): React.JSX.Element | null {
    if (plate === 'empty') return null;
    if (plate === 'replaced') return <Metal paths={scene.replaced} lit={lit} part="plate" />;
    if (plate === 'processed') {
        return (
            <g data-part="plate">
                <Metal paths={scene.worked} lit={lit} />
                <Metal paths={scene.tab} lit={lit} />
            </g>
        );
    }
    return <Metal paths={scene.original} lit={lit} part="plate" />;
}

/** The request shape is the method. The response is a status cartridge, not that shape again. */
function RequestBody({
    scene,
    method,
    lit,
}: {
    scene: ReturnType<typeof sceneOf>;
    method: Method;
    lit: boolean;
}): React.JSX.Element {
    if (method === 'GET') {
        return (
            <g data-part="message" data-kind="get">
                {scene.getWalls.map((item) => (
                    <Metal key={item.key} paths={item.paths} lit={lit} />
                ))}
            </g>
        );
    }
    if (method === 'PUT') return <Metal paths={scene.putBody} lit={lit} part="message" kind="put" />;
    return (
        <g data-part="message" data-kind="post">
            <Metal paths={scene.postBody} lit={lit} />
            <Metal paths={scene.tooth} lit={lit} />
        </g>
    );
}

export default function HttpExchange({ pane = 'lab' }: { pane?: 'learn' | 'lab' }): React.JSX.Element {
    const figId = pane === 'lab' ? 'fig-http-h' : 'fig-http-learn';
    const [method, setMethod] = useState<Method>(LEARN_METHOD);
    const [exists, setExists] = useState(LEARN_EXISTS);
    const [guess, setGuess] = useState<Outcome | null>(null);
    const [started, setStarted] = useState(false);
    const usedMethod = pane === 'learn' ? LEARN_METHOD : method;
    const usedExists = pane === 'learn' ? LEARN_EXISTS : exists;
    const running = pane === 'learn' || started;
    const result = useRef<HTMLDivElement>(null);
    const figure = useRef<HTMLElement>(null);
    const story = useMemo(
        () => (running ? events(usedMethod, usedExists) : []),
        [running, usedMethod, usedExists]
    );
    const marks = useMemo(() => (story.length ? story.map((event) => event.t) : [0]), [story]);
    const end = story.length ? endTime() : 0;
    const clock = useClock({ marks, end, rate: 0.55, target: figure });
    const { restart } = clock;
    useEffect(() => {
        if (pane !== 'learn') return undefined;
        restart();
        return undefined;
    }, [pane, restart]);
    const scene = useMemo(() => sceneOf(), []);
    const frame = running ? frameAt(usedMethod, usedExists, clock.t) : null;
    const index = Math.max(0, clock.at);
    const step = story[index];
    const finished = frame !== null && clock.t >= end - 1e-6;
    const previewPlate = usedExists ? 'original' : 'empty';
    const plate = frame ? frame.plate : previewPlate;
    const clear = (): void => {
        setStarted(false);
        clock.reset();
    };
    const go = (): void => {
        setStarted(true);
        clock.restart();
        revealAfterRender(() => result.current);
    };
    const verdict = frame ? judge(guess, outcomeOf(usedMethod, usedExists), OUTCOME_LABEL) : '';
    return (
        <figure ref={figure} className="bp-sheet ln-fig" aria-labelledby={figId}>
            <div className="ln-fig-head">
                <span id={figId}>
                    {pane === 'learn' ? 'A GET that finds the representation' : 'Fig. 1 · One resource'}
                </span>
                <span>Teaching model, not a trace of a live server</span>
            </div>
            <div className={pane === 'lab' ? 'ln-fig-grid' : 'ln-fig-grid ln-fig-grid-one'}>
                {pane === 'lab' ? (
                    <div className="ln-controls">
                        <Choice
                            legend="Method"
                            options={METHODS_UI}
                            label={(option) => option}
                            value={method}
                            onChange={(option) => {
                                setMethod(option);
                                clear();
                            }}
                        />
                        <Choice
                            legend="Is a representation already stored?"
                            options={EXISTS_OPTIONS}
                            label={(option) => (option === 'present' ? 'Yes' : 'No')}
                            value={fromExists(exists)}
                            onChange={(option) => {
                                setExists(toExists(option));
                                clear();
                            }}
                        />
                        <div className="ln-predict">
                            <Choice
                                legend="Predict the status and the plate"
                                options={OUTCOMES}
                                label={(outcome) => OUTCOME_LABEL[outcome]}
                                value={guess}
                                onChange={(outcome) => {
                                    setGuess(outcome);
                                    clear();
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
                        <svg className="bp-svg ln-svg iso-svg" viewBox="0 0 780 420" aria-hidden="true">
                            {scene.feet.map((item) => (
                                <Metal key={item.key} paths={item.paths} />
                            ))}
                            {scene.screws.map((item) => (
                                <Metal key={item.key} paths={item.paths} />
                            ))}
                            <Metal paths={scene.base} />
                            <Metal paths={scene.nameplate} />
                            <Metal paths={scene.riser} />
                            {scene.rods.map((item) => (
                                <Metal key={item.key} paths={item.paths} />
                            ))}
                            {scene.jaws.map((item) => (
                                <Metal key={item.key} paths={item.paths} />
                            ))}
                            <Metal paths={scene.press} />
                            <Metal paths={scene.recess} />
                            <Metal paths={scene.stamp} />
                            <Metal paths={scene.cap} />
                            <Metal paths={scene.clamp} />
                            {scene.clampScrews.map((item) => (
                                <Metal key={item.key} paths={item.paths} />
                            ))}
                            {scene.stops.map((item) => (
                                <Metal key={item.key} paths={item.paths} />
                            ))}
                            {scene.bushings.map((item) => (
                                <Metal key={item.key} paths={item.paths} />
                            ))}
                            <Metal paths={scene.rail} />
                            <Metal paths={scene.nest} />
                            {scene.nestWalls.map((item) => (
                                <Metal key={item.key} paths={item.paths} />
                            ))}
                            <Metal paths={scene.nestBed} />
                            <Metal paths={scene.knob} />
                            <Metal paths={scene.pin} />
                            <Metal paths={scene.pad} />
                            <PlateMark scene={scene} plate={plate} lit={frame?.changed ?? false} />
                            {frame ? (
                                <g
                                    data-place={frame.place}
                                    data-role={frame.role}
                                    data-status={frame.status ?? ''}
                                    data-changed={frame.changed ? 'true' : 'false'}
                                    data-stored={frame.stored ? 'true' : 'false'}
                                    transform={place(REST, seatOf(frame.place), scene.projection)}
                                >
                                    {frame.role === 'response' ? (
                                        <Metal
                                            paths={scene.responseBody}
                                            lit
                                            part="message"
                                            kind="response"
                                        />
                                    ) : (
                                        <RequestBody scene={scene} method={usedMethod} lit={false} />
                                    )}
                                    {scene.ribs.map((item) => (
                                        <Metal
                                            key={item.key}
                                            paths={item.paths}
                                            lit={frame.role === 'response'}
                                        />
                                    ))}
                                </g>
                            ) : null}
                        </svg>
                    </div>
                    {frame && step ? (
                        <>
                            <p className="m-0 mt-2" data-current-step>
                                <strong>
                                    Step {index + 1} of {story.length}.
                                </strong>{' '}
                                {step.said}
                            </p>
                            <Transport
                                label="Message controls"
                                playing={clock.playing}
                                atStart={clock.t <= 0}
                                atEnd={clock.t >= end - 1e-6}
                                onPlay={clock.play}
                                onPause={clock.pause}
                                onPrev={clock.prev}
                                onNext={clock.next}
                                onReset={clock.reset}
                            />
                            {pane === 'lab' && finished ? (
                                <p className="m-0 mt-2" data-result>
                                    {summary(usedMethod, usedExists)} {verdict}
                                </p>
                            ) : null}
                        </>
                    ) : (
                        <p className="ln-frame">
                            Choose the method and whether a representation is already stored, predict, then
                            press Run.
                        </p>
                    )}
                </div>
            </div>
            <figcaption className="ln-label mt-4">
                {pane === 'learn' ? (
                    <>
                        The open cartridge is the GET request. It sits in the nest or on the pad, which is the
                        message&apos;s place. The plate in the slot is the stored representation. On this pass
                        it stays, because GET does not ask the resource to change it. The cartridge lights
                        when it is the response.
                    </>
                ) : (
                    <>
                        The press stays still until Run. An open cartridge is GET, a solid block is PUT, and a
                        block with a tooth is POST. The plate stays plain, becomes the enclosed block, or
                        gains a tab from this resource&apos;s processing. Previous and Next stop on the three
                        places the model names.
                    </>
                )}
            </figcaption>
        </figure>
    );
}
