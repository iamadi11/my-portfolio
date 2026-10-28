'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import Choice from '@/components/learn/kit/Choice';
import { revealAfterRender } from '@/components/learn/kit/reveal';
import Transport from '@/components/learn/kit/Transport';
import { useClock } from '@/components/learn/kit/useClock';
import { verdict as judge } from '@/components/learn/kit/verdict';
import {
    LEARN_CHECKS,
    OUTCOME_LABEL,
    endTime,
    events,
    frameAt,
    outcomeOf,
    type Body,
    type Frame,
    type Outcome,
} from '@/lib/learn/tls-model';

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
 * A sealing bench. One cartridge is the body. Its screen position is frameAt().place
 * and along. The lid is on only when sealed is true. The inner piece is drawn only
 * when plaintextInside is true. The plunger is down only when nameChecked is true.
 */

const REST: Point3 = [0, 0, 0];
const SLUG: Plan = { x: 0, y: 0, w: 14, d: 10, r: 1.1 };
const LID: Plan = { x: 1, y: 1, w: 12, d: 8, r: 0.8 };
const CLIENT_BAY: Point3 = [34, -4, 27];
const SERVER_BAY: Point3 = [270, -4, 27];
const PIN_UP: Point3 = [64, -16, 30];
const PIN_DOWN: Point3 = [64, -16, 21];

const CHECKS = ['check', 'skip'] as const;
type CheckOption = (typeof CHECKS)[number];
const OUTCOMES: Outcome[] = ['checked', 'unchecked'];

function toCheck(option: CheckOption): boolean {
    return option === 'check';
}

function fromCheck(checkName: boolean): CheckOption {
    return checkName ? 'check' : 'skip';
}

/** Screen pose of the cartridge. Nothing here is decided outside the body fields. */
function poseOf(body: Body): Point3 {
    const origin = body.from === 'client' ? CLIENT_BAY : SERVER_BAY;
    const dest = body.from === 'client' ? SERVER_BAY : CLIENT_BAY;
    const at = body.place === 'sender' ? origin : dest;
    if (body.place !== 'wire') return at;
    return [
        origin[0] + body.along * (dest[0] - origin[0]),
        origin[1] + body.along * (dest[1] - origin[1]),
        origin[2] + body.along * (dest[2] - origin[2]),
    ];
}

function liveLine(frame: Frame): string {
    const { body } = frame;
    const where =
        body.place === 'wire'
            ? 'On the wire'
            : body.place === 'sender'
              ? 'At the sender'
              : 'At the other machine';
    const seal = body.sealed
        ? 'sealed, so this wire body is not the plaintext'
        : 'open, so the other side can read it as a step';
    const inside = body.plaintextInside
        ? 'The plaintext is inside the receiver.'
        : 'No plaintext is inside the receiver.';
    const name = frame.nameChecked ? 'The name was checked.' : 'The name has not been checked.';
    return `${where}, ${seal}. ${inside} ${name}`;
}

type Part = { key: string; paths: ReturnType<typeof block> };

function sceneOf() {
    const base: Plan = { x: -16, y: -44, w: 360, d: 108, r: 6 };
    const foot = (x: number, y: number): Plan => ({ x, y, w: 16, d: 16, r: 1 });
    const feet = [
        foot(base.x + 16, base.y + 14),
        foot(base.x + base.w - 32, base.y + 14),
        foot(base.x + 16, base.y + base.d - 30),
        foot(base.x + base.w - 32, base.y + base.d - 30),
    ];
    const client: Plan = { x: 8, y: -28, w: 86, d: 64, r: 2 };
    const bed: Plan = { x: 18, y: -18, w: 58, d: 42, r: 1 };
    const gland: Plan = { x: 84, y: -14, w: 18, d: 20, r: 1 };
    const cable: Plan = { x: 104, y: -10, w: 156, d: 12, r: 1 };
    const saddles = [140, 196].map((x) => ({ x, y: -8, w: 14, d: 8, r: 0.6 }));
    const stops = [104, 246].map((x) => ({ x, y: -12, w: 8, d: 16, r: 0.8 }));
    const server: Plan = { x: 252, y: -28, w: 84, d: 64, r: 2 };
    const well: Plan = { x: 264, y: -16, w: 26, d: 22, r: 1 };
    const pocket: Plan = { x: 300, y: -14, w: 24, d: 20, r: 1 };
    const riser: Plan = { x: 324, y: -22, w: 8, d: 44, r: 1 };
    const rail: Plan = { x: 258, y: 22, w: 70, d: 6, r: 1 };
    const strip: Plan = { x: 20, y: 40, w: 280, d: 8, r: 1 };
    const plate: Plan = { x: 24, y: -40, w: 36, d: 8, r: 0.6 };
    const projection = fit(
        corners([
            { plan: base, z: 0, h: 6 },
            ...feet.map((plan) => ({ plan, z: -8, h: 8 })),
            { plan: client, z: 6, h: 16 },
            { plan: bed, z: 22, h: 4 },
            { plan: gland, z: 14, h: 12 },
            { plan: cable, z: 20, h: 4 },
            { plan: server, z: 6, h: 16 },
            { plan: pocket, z: 22, h: 4 },
            { plan: riser, z: 22, h: 16 },
            { plan: strip, z: 6, h: 2 },
            { plan: SLUG, z: 0, h: 32 },
            { plan: { x: 34, y: -16, w: 250, d: 40, r: 0 }, z: 18, h: 22 },
        ]),
        780,
        400
    );
    const part = (key: string, plan: Plan, z: number, height: number): Part => ({
        key,
        paths: block(plan, z, height, projection),
    });
    const ticks = topTicks(strip.x + 6, strip.x + strip.w - 6, 10, 4, strip.y, 8, [1.6, 3.2], projection);
    return {
        projection,
        ticks,
        feet: feet.map((plan) => part(`foot-${plan.x}`, plan, -8, 8)),
        screws: feet.map((plan) => ({
            key: `screw-${plan.x}`,
            paths: cylinder(plan.x + 8, plan.y + 8, 1.8, 6, 2.2, projection, 10, 0.3),
        })),
        base: block(base, 0, 6, projection),
        plate: block(plate, 6, 1, projection),
        strip: block(strip, 6, 2, projection),
        client: block(client, 6, 16, projection),
        bed: block(bed, 22, 4, projection),
        knob: cylinder(36, -28, 6, 22, 6, projection, 14, 0.4),
        gland: block(gland, 14, 12, projection),
        collar: cylinder(PIN_UP[0], PIN_UP[1], 4.4, 22, 5, projection, 12, 0.3),
        plunger: cylinder(PIN_UP[0], PIN_UP[1], 2.1, PIN_UP[2], 9, projection, 12, 0.2),
        posts: [118, 236].map((x) => ({
            key: `post-${x}`,
            paths: cylinder(x, -4, 3.6, 6, 14, projection, 12, 0.3),
        })),
        cable: block(cable, 20, 4, projection),
        saddles: saddles.map((plan) => part(`saddle-${plan.x}`, plan, 16, 4)),
        stops: stops.map((plan) => part(`stop-${plan.x}`, plan, 20, 8)),
        server: block(server, 6, 16, projection),
        well: block(well, 22, 3, projection),
        pocket: block(pocket, 22, 3, projection),
        riser: block(riser, 22, 16, projection),
        rail: block(rail, 22, 3, projection),
        slug: block(SLUG, 0, 5, projection),
        lid: block(LID, 5, 3, projection),
        clasp: cylinder(7, 5, 1.5, 8, 2, projection, 8, 0.2),
        plain: block({ x: 304, y: -12, w: 14, d: 12, r: 1 }, 25, 5, projection),
    };
}

export default function TlsHandshake({ pane = 'lab' }: { pane?: 'learn' | 'lab' }): React.JSX.Element {
    const figId = pane === 'lab' ? 'fig-tls-h' : 'fig-tls-learn';
    const [choice, setChoice] = useState(LEARN_CHECKS);
    const [guess, setGuess] = useState<Outcome | null>(null);
    const [started, setStarted] = useState(false);
    const checkName = pane === 'learn' ? LEARN_CHECKS : choice;
    const running = pane === 'learn' || started;
    const result = useRef<HTMLDivElement>(null);
    const figure = useRef<HTMLElement>(null);
    const story = useMemo(() => (running ? events(checkName) : []), [running, checkName]);
    const marks = useMemo(() => (story.length ? story.map((event) => event.t) : [0]), [story]);
    const end = story.length ? endTime() : 0;
    const clock = useClock({ marks, end, rate: 4, target: figure });
    const { restart } = clock;
    useEffect(() => {
        if (pane !== 'learn') return undefined;
        restart();
        return undefined;
    }, [pane, restart]);
    const scene = useMemo(() => sceneOf(), []);
    const frame = running ? frameAt(checkName, clock.t) : null;
    const index = Math.max(0, clock.at);
    const step = story[index];
    const finished = frame !== null && clock.t >= end - 1e-6;
    const clear = (): void => {
        setStarted(false);
        clock.reset();
    };
    const go = (): void => {
        setStarted(true);
        clock.restart();
        revealAfterRender(() => result.current);
    };
    const verdict = frame ? judge(guess, outcomeOf(checkName), OUTCOME_LABEL) : '';
    const body = frame?.body ?? null;
    const litCartridge = body !== null && body.sealed && !body.plaintextInside;
    return (
        <figure ref={figure} className="bp-sheet ln-fig" aria-labelledby={figId}>
            <div className="ln-fig-head">
                <span id={figId}>
                    {pane === 'learn'
                        ? 'The body stays open until the handshake finishes'
                        : 'Fig. 1 · Skip the name check'}
                </span>
                <span>Teaching model, not a trace of a live connection</span>
            </div>
            <div className={pane === 'lab' ? 'ln-fig-grid' : 'ln-fig-grid ln-fig-grid-one'}>
                {pane === 'lab' ? (
                    <div className="ln-controls">
                        <Choice
                            legend="Does the client check that the server is the expected one?"
                            options={CHECKS}
                            label={(option) => (option === 'check' ? 'Check the name' : 'Skip the check')}
                            value={fromCheck(choice)}
                            onChange={(option) => {
                                setChoice(toCheck(option));
                                clear();
                            }}
                        />
                        <div className="ln-predict">
                            <Choice
                                legend="Predict first, for when the sealed body has arrived"
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
                        <svg className="bp-svg ln-svg iso-svg" viewBox="0 0 780 400" aria-hidden="true">
                            {scene.feet.map((item) => (
                                <Metal key={item.key} paths={item.paths} />
                            ))}
                            {scene.screws.map((item) => (
                                <Metal key={item.key} paths={item.paths} />
                            ))}
                            <Metal paths={scene.base} />
                            <Metal paths={scene.plate} />
                            <Metal paths={scene.strip} />
                            <path className="iso-line" data-tone="lo" d={scene.ticks.minor} />
                            <path className="iso-line" data-tone="mid" d={scene.ticks.major} />
                            {scene.saddles.map((item) => (
                                <Metal key={item.key} paths={item.paths} />
                            ))}
                            {scene.posts.map((item) => (
                                <Metal key={item.key} paths={item.paths} />
                            ))}
                            <Metal paths={scene.cable} />
                            {scene.stops.map((item) => (
                                <Metal key={item.key} paths={item.paths} />
                            ))}
                            <Metal paths={scene.client} />
                            <Metal paths={scene.bed} />
                            <Metal paths={scene.knob} />
                            <Metal paths={scene.gland} />
                            <Metal paths={scene.collar} />
                            <Metal paths={scene.server} />
                            <Metal paths={scene.well} />
                            <Metal paths={scene.pocket} />
                            <Metal paths={scene.riser} />
                            <Metal paths={scene.rail} />
                            <g
                                data-name-checked={frame?.nameChecked ? 'true' : 'false'}
                                transform={place(
                                    PIN_UP,
                                    frame?.nameChecked ? PIN_DOWN : PIN_UP,
                                    scene.projection
                                )}
                            >
                                <Metal paths={scene.plunger} />
                            </g>
                            {body ? (
                                <g
                                    data-step={body.step}
                                    data-from={body.from}
                                    data-place={body.place}
                                    data-along={body.along.toFixed(3)}
                                    data-sealed={body.sealed ? 'true' : 'false'}
                                    data-wire={body.wire}
                                    transform={place(REST, poseOf(body), scene.projection)}
                                >
                                    <Metal
                                        paths={scene.slug}
                                        lit={litCartridge || (!body.sealed && body.place === 'wire')}
                                    />
                                    {body.sealed ? <Metal paths={scene.lid} lit={litCartridge} /> : null}
                                    {body.sealed ? <Metal paths={scene.clasp} /> : null}
                                </g>
                            ) : null}
                            {body?.plaintextInside ? (
                                <g data-plaintext="inside">
                                    <Metal paths={scene.plain} lit />
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
                                {step.said} {liveLine(frame)}
                            </p>
                            <Transport
                                label="Handshake controls"
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
                                    {OUTCOME_LABEL[outcomeOf(checkName)]}. {verdict}
                                </p>
                            ) : null}
                        </>
                    ) : (
                        <p className="ln-frame">
                            Choose whether the name is checked, predict, then press Run.
                        </p>
                    )}
                </div>
            </div>
            <figcaption className="ln-label mt-4">
                {pane === 'learn' ? (
                    <>
                        The cartridge is the body. Where it sits is the model&apos;s place, and the lid is on
                        only when sealed is true. The small piece in the far pocket is the plaintext, drawn
                        only when that field is true. The plunger drops only when the name was checked. Four
                        ticks on the wire and two ticks of rest are assumed.
                    </>
                ) : (
                    <>
                        The run stays empty until Run. Skipping the check leaves the plunger up. The sealed
                        body still arrives, and the line after the last event says whether the name was
                        checked. Previous and Next stop on the model&apos;s events.
                    </>
                )}
            </figcaption>
        </figure>
    );
}
