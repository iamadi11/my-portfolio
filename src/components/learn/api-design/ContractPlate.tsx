'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import Choice from '@/components/learn/kit/Choice';
import { revealAfterRender } from '@/components/learn/kit/reveal';
import Transport from '@/components/learn/kit/Transport';
import { useClock } from '@/components/learn/kit/useClock';
import { verdict as judgeGuess } from '@/components/learn/kit/verdict';
import {
    END,
    MARKS,
    NAMED_ERROR,
    SUCCESS_STATUS,
    guessOf,
    judge,
    outcome,
    readout,
    type Offer,
    type Place,
} from '@/lib/learn/api-design-model';

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
    type Projection,
} from '../anatomy/metal';

type SolidPaths = ReturnType<typeof block>;

/**
 * One caller and one contract plate. The body is the call. Its place is
 * `judge().place`: seated when the call matches, off the seat when a promised
 * part breaks. Learn plays the match. The lab waits for Run. No word is cut
 * into the metal.
 */

const OFFERS: Offer[] = ['match', 'break'];
const GUESSES: Place[] = ['accepted', 'refused'];
const OFFER_LABEL: Record<Offer, string> = {
    match: 'Matches the contract',
    break: 'Breaks a promised part',
};
const GUESS_LABEL: Record<Place, string> = {
    accepted: 'Accepted',
    refused: 'Refused',
};

const BODY_W = 16;
const BODY_D = 14;
const BODY_H = 10;
const REST: Point3 = [32, 58, 28];
const SEAT: Point3 = [180, 48, 24];
const LEDGE: Point3 = [112, 104, 34];

type Drawn = { key: string; part: string; paths: SolidPaths };

function bodyPlan(at: Point3): Plan {
    return { x: at[0], y: at[1], w: BODY_W, d: BODY_D, r: 1.1 };
}

function slide(rest: Point3, dest: Point3, t: number, projection: Projection): string {
    const u = Math.min(1, Math.max(0, t));
    const at: Point3 = [
        rest[0] + (dest[0] - rest[0]) * u,
        rest[1] + (dest[1] - rest[1]) * u,
        rest[2] + (dest[2] - rest[2]) * u,
    ];
    return place(rest, at, projection);
}

function sceneOf() {
    const plate: Plan = { x: 0, y: 0, w: 228, d: 148, r: 5 };
    const foot = (x: number, y: number): Plan => ({ x, y, w: 16, d: 14, r: 1 });
    const feet = [foot(12, 10), foot(196, 10), foot(12, 118), foot(196, 118)];
    const callerPlinth: Plan = { x: 18, y: 42, w: 52, d: 50, r: 1.2 };
    const callerBed: Plan = { x: 24, y: 50, w: 40, d: 32, r: 0.6 };
    const callerBack: Plan = { x: 22, y: 48, w: 6, d: 36, r: 0.3 };
    const cheekFar: Plan = { x: 28, y: 48, w: 34, d: 3.5, r: 0.2 };
    const cheekNear: Plan = { x: 28, y: 78, w: 34, d: 3.5, r: 0.2 };
    const railFar: Plan = { x: 72, y: 52, w: 96, d: 3, r: 0.2 };
    const railNear: Plan = { x: 72, y: 68, w: 96, d: 3, r: 0.2 };
    const ruler: Plan = { x: 74, y: 74, w: 88, d: 4, r: 0.2 };
    const fixture: Plan = { x: 158, y: 28, w: 62, d: 52, r: 1.2 };
    const pocket: Plan = { x: 176, y: 42, w: 24, d: 22, r: 0.4 };
    const jawBack: Plan = { x: 176, y: 36, w: 24, d: 6, r: 0.2 };
    const jawLeft: Plan = { x: 170, y: 40, w: 6, d: 28, r: 0.2 };
    const jawRight: Plan = { x: 200, y: 40, w: 6, d: 28, r: 0.2 };
    const lip: Plan = { x: 176, y: 64, w: 24, d: 5, r: 0.2 };
    const pedestal: Plan = { x: 104, y: 98, w: 36, d: 28, r: 1 };
    const nameplate: Plan = { x: 168, y: 118, w: 40, d: 14, r: 0.6 };
    const boxes: { plan: Plan; z: number; h: number }[] = [
        { plan: plate, z: 0, h: 8 },
        ...feet.map((plan) => ({ plan, z: -10, h: 10 })),
        { plan: callerPlinth, z: 8, h: 10 },
        { plan: callerBed, z: 18, h: 10 },
        { plan: callerBack, z: 28, h: 16 },
        { plan: cheekFar, z: 28, h: 12 },
        { plan: cheekNear, z: 28, h: 12 },
        { plan: railFar, z: 22, h: 3 },
        { plan: railNear, z: 22, h: 3 },
        { plan: ruler, z: 20, h: 2 },
        { plan: fixture, z: 8, h: 8 },
        { plan: pocket, z: 16, h: 8 },
        { plan: jawBack, z: 24, h: 16 },
        { plan: jawLeft, z: 24, h: 16 },
        { plan: jawRight, z: 24, h: 16 },
        { plan: lip, z: 24, h: 6 },
        { plan: pedestal, z: 8, h: 26 },
        { plan: nameplate, z: 8, h: 2 },
        { plan: bodyPlan(REST), z: REST[2], h: BODY_H },
        { plan: bodyPlan(SEAT), z: SEAT[2], h: BODY_H },
        { plan: bodyPlan(LEDGE), z: LEDGE[2], h: BODY_H },
        { plan: { x: 36, y: 36, w: 14, d: 14, r: 7 }, z: 44, h: 8 },
    ];
    const projection = fit(corners(boxes), 720, 420);
    const screw = (cx: number, cy: number, z: number, key: string): Drawn => ({
        key,
        part: key,
        paths: cylinder(cx, cy, 1.35, z, 2.2, projection, 8, 0.25),
    });
    const pin = (cx: number, cy: number, key: string): Drawn => ({
        key,
        part: key,
        paths: cylinder(cx, cy, 1.5, 16, 10, projection, 10, 0.2),
    });
    return {
        projection,
        feet: feet.map((plan) => ({
            key: `foot-${plan.x}-${plan.y}`,
            part: `foot-${plan.x}-${plan.y}`,
            paths: block(plan, -10, 10, projection),
        })),
        footScrews: feet.map((plan) =>
            screw(plan.x + plan.w / 2, plan.y + plan.d / 2, 8, `screw-${plan.x}-${plan.y}`)
        ),
        plate: block(plate, 0, 8, projection),
        nameplate: block(nameplate, 8, 2, projection),
        callerPlinth: block(callerPlinth, 8, 10, projection),
        callerBed: block(callerBed, 18, 10, projection),
        callerBack: block(callerBack, 28, 16, projection),
        cheekFar: block(cheekFar, 28, 12, projection),
        cheekNear: block(cheekNear, 28, 12, projection),
        post: cylinder(48, 44, 2.2, 28, 18, projection, 10, 0.25),
        knob: cylinder(25, 66, 4.2, 44, 5, projection, 14, 0.3),
        collar: cylinder(25, 66, 2.1, 49, 2.4, projection, 10, 0.2),
        railFar: block(railFar, 22, 3, projection),
        railNear: block(railNear, 22, 3, projection),
        bushings: [
            { key: 'bush-far-a', paths: cylinder(86, 53.5, 2.4, 22, 5, projection, 10, 0.2) },
            { key: 'bush-far-b', paths: cylinder(150, 53.5, 2.4, 22, 5, projection, 10, 0.2) },
            { key: 'bush-near-a', paths: cylinder(86, 69.5, 2.4, 22, 5, projection, 10, 0.2) },
            { key: 'bush-near-b', paths: cylinder(150, 69.5, 2.4, 22, 5, projection, 10, 0.2) },
        ],
        ruler: block(ruler, 20, 2, projection),
        ticks: topTicks(80, 154, 8, 4, 78, 22, [1.4, 2.6], projection, 'x'),
        fixture: block(fixture, 8, 8, projection),
        pocket: block(pocket, 16, 8, projection),
        jawBack: block(jawBack, 24, 16, projection),
        jawLeft: block(jawLeft, 24, 16, projection),
        jawRight: block(jawRight, 24, 16, projection),
        pins: [pin(166, 40, 'pin-a'), pin(166, 52, 'pin-b'), pin(166, 64, 'pin-c')],
        clampScrews: [screw(173, 44, 40, 'clamp-a'), screw(203, 44, 40, 'clamp-b')],
        pedestal: block(pedestal, 8, 26, projection),
        lip: block(lip, 24, 6, projection),
        body: block(bodyPlan(REST), REST[2], BODY_H, projection),
        rest: REST,
        seat: SEAT,
        ledge: LEDGE,
    };
}

export default function ContractPlate({ pane = 'lab' }: { pane?: 'learn' | 'lab' }): React.JSX.Element {
    const learn = pane === 'learn';
    const figId = learn ? 'fig-api-learn' : 'fig-api-h';
    const [offer, setOffer] = useState<Offer>('match');
    const [guess, setGuess] = useState<Place | null>(null);
    const [started, setStarted] = useState(learn);
    const result = useRef<HTMLDivElement>(null);
    const figure = useRef<HTMLElement>(null);
    const clock = useClock({ marks: [...MARKS], end: END, rate: 0.35, target: figure });
    const { restart } = clock;
    useEffect(() => {
        if (!learn) return undefined;
        restart();
        return undefined;
    }, [learn, restart]);
    const scene = useMemo(() => sceneOf(), []);
    const judgement = judge(learn ? 'match' : offer);
    const active = learn || started;
    const t = active ? Math.min(END, clock.t) : 0;
    const arrived = active && t >= END - 1e-6;
    const dest = judgement.place === 'accepted' ? scene.seat : scene.ledge;
    const seated = arrived && judgement.place === 'accepted';
    const pick = (next: Offer): void => {
        setOffer(next);
        setStarted(false);
        setGuess(null);
        clock.reset();
    };
    const go = (): void => {
        setStarted(true);
        clock.restart();
        revealAfterRender(() => result.current);
    };
    const line = active ? readout(judgement, t) : '';
    const verdict = arrived ? judgeGuess(guess, guessOf(offer), GUESS_LABEL) : '';
    return (
        <figure
            ref={figure}
            className="bp-sheet ln-fig"
            aria-labelledby={figId}
            data-place={arrived ? judgement.place : 'caller'}
        >
            <div className="ln-fig-head">
                <span id={figId}>{learn ? 'A call that matches' : 'Fig. 1 · Match or break'}</span>
                <span>One plate, not a product</span>
            </div>
            <div className={pane === 'lab' ? 'ln-fig-grid' : 'ln-fig-grid ln-fig-grid-one'}>
                {pane === 'lab' ? (
                    <div className="ln-controls">
                        <Choice
                            legend="Call"
                            options={OFFERS}
                            label={(item) => OFFER_LABEL[item]}
                            value={offer}
                            onChange={pick}
                        />
                        <div className="ln-predict">
                            <Choice
                                legend="Predict first"
                                options={GUESSES}
                                label={(item) => GUESS_LABEL[item]}
                                value={guess}
                                onChange={(next) => {
                                    setGuess(next);
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
                            <Metal paths={scene.nameplate} part="nameplate" />
                            <Metal paths={scene.callerPlinth} part="caller-plinth" />
                            <Metal paths={scene.callerBed} part="caller-bed" />
                            <Metal paths={scene.callerBack} part="caller-back" />
                            <Metal paths={scene.cheekFar} part="cheek-far" />
                            <Metal paths={scene.cheekNear} part="cheek-near" />
                            <Metal paths={scene.post} part="post" />
                            <Metal paths={scene.knob} part="knob" />
                            <Metal paths={scene.collar} part="collar" />
                            <Metal paths={scene.railFar} part="rail-far" />
                            <Metal paths={scene.railNear} part="rail-near" />
                            {scene.bushings.map((part) => (
                                <Metal key={part.key} paths={part.paths} part={part.key} />
                            ))}
                            <Metal paths={scene.ruler} part="ruler" />
                            <path className="iso-line" data-tone="lo" d={scene.ticks.minor} />
                            <path className="iso-line" data-tone="mid" d={scene.ticks.major} />
                            <Metal paths={scene.fixture} part="fixture" />
                            <Metal paths={scene.pocket} part="pocket" />
                            <Metal paths={scene.jawBack} part="jaw-back" />
                            <Metal paths={scene.jawLeft} part="jaw-left" />
                            <Metal paths={scene.jawRight} part="jaw-right" />
                            {scene.pins.map((part) => (
                                <Metal key={part.key} paths={part.paths} part={part.part} />
                            ))}
                            {scene.clampScrews.map((part) => (
                                <Metal key={part.key} paths={part.paths} part={part.part} />
                            ))}
                            <Metal paths={scene.pedestal} part="pedestal" />
                            <g data-call-body="" transform={slide(scene.rest, dest, t, scene.projection)}>
                                <Metal paths={scene.body} lit={seated} part="call-body" />
                            </g>
                            <Metal paths={scene.lip} part="lip" />
                        </svg>
                    </div>
                    {active ? (
                        <>
                            <p className="m-0 mt-2" data-current-step>
                                {line}
                            </p>
                            <Transport
                                label="Contract plate"
                                playing={clock.playing}
                                atStart={clock.t <= 0}
                                atEnd={clock.t >= END - 1e-6}
                                onPlay={clock.play}
                                onPause={clock.pause}
                                onPrev={clock.prev}
                                onNext={clock.next}
                                onReset={clock.reset}
                            />
                            {arrived && pane === 'lab' ? (
                                <p className="m-0 mt-2" data-result>
                                    {outcome(offer)} {verdict}
                                </p>
                            ) : null}
                        </>
                    ) : (
                        <p className="ln-frame">
                            Choose a call that matches this plate or a call that breaks a promised part.
                            Predict accepted or refused, then press Run.
                        </p>
                    )}
                </div>
            </div>
            <figcaption className="ln-label mt-4">
                Assumed: this plate allows only GET, and a current representation exists for that method on
                the teaching target item. Status {SUCCESS_STATUS} means the request succeeded. Status{' '}
                {NAMED_ERROR} means the method is not supported by the target resource. Both codes are from
                RFC 9110. item is a teaching label. Not a product API. Not a measurement.
            </figcaption>
        </figure>
    );
}
