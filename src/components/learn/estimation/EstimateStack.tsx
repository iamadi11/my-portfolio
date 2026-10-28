'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
    KNOBS,
    LEARN_ASSUMPTIONS,
    LEARN_ESTIMATE,
    MAX_PLATES,
    PAN_FLOOR_Z,
    PLATE_THICKNESS,
    PREDICTIONS,
    SCALE_TICKS,
    assumptionLine,
    assumptionsFor,
    estimate,
    judge,
    knobLabel,
    maxPlates,
    outcomeText,
    plateMarks,
    plateUnitLine,
    plateZ,
    predictionLabel,
    stackCaption,
    stackTop,
    visiblePlates,
    type Estimate,
    type Knob,
    type PredictionId,
} from '@/lib/learn/estimation-model';

import { Metal, block, cylinder, fit, type Plan, type Point3, type Projection } from '../anatomy/metal';
import Choice from '../kit/Choice';
import Transport from '../kit/Transport';
import { useClock } from '../kit/useClock';

/**
 * One platform scale. Three pans. Each pan's plates are one computed product
 * divided by that pan's assumed unit. Deleting the plates deletes the lesson.
 */

type Paths = ReturnType<typeof block>;

interface Part {
    key: string;
    paths: Paths;
    lit?: boolean;
}

const PLINTH: Plan = { x: 16, y: 22, w: 272, d: 140, r: 8 };
const DECK: Plan = { x: 28, y: 36, w: 248, d: 100, r: 4 };
const SQUARE: Plan = { x: 40, y: 58, w: 56, d: 56, r: 2 };
const SQUARE_PLATE: Plan = { x: 50, y: 68, w: 36, d: 36, r: 1 };
const TRAY: Plan = { x: 178, y: 64, w: 88, d: 48, r: 2 };
const TRAY_PLATE: Plan = { x: 188, y: 74, w: 68, d: 28, r: 1 };
const ROUND = { cx: 132, cy: 88, body: 22, lip: 26, plate: 14 };

function envelope(): Projection {
    const top = stackTop(MAX_PLATES) + 16;
    const points: Point3[] = [
        [4, 10, -12],
        [304, 176, top],
    ];
    return fit(points, 720, 440);
}

function push(parts: Part[], key: string, paths: Paths, lit = false): void {
    parts.push({ key, paths, lit });
}

function walls(parts: Part[], plan: Plan, prefix: string, projection: Projection): void {
    const lip = 5;
    const z = PAN_FLOOR_Z;
    const h = 2.4;
    push(parts, `${prefix}-west`, block({ x: plan.x, y: plan.y, w: lip, d: plan.d, r: 1 }, z, h, projection));
    push(
        parts,
        `${prefix}-east`,
        block({ x: plan.x + plan.w - lip, y: plan.y, w: lip, d: plan.d, r: 1 }, z, h, projection)
    );
    push(
        parts,
        `${prefix}-front`,
        block({ x: plan.x + lip, y: plan.y, w: plan.w - lip * 2, d: lip, r: 1 }, z, h, projection)
    );
    push(
        parts,
        `${prefix}-back`,
        block(
            { x: plan.x + lip, y: plan.y + plan.d - lip, w: plan.w - lip * 2, d: lip, r: 1 },
            z,
            h,
            projection
        )
    );
}

function scene(projection: Projection, request: number, storage: number, wire: number): Part[] {
    const parts: Part[] = [];
    const feet: Array<[number, number]> = [
        [40, 146],
        [264, 146],
        [40, 40],
        [264, 40],
    ];
    feet.forEach(([x, y], index) => {
        push(parts, `flange-${index}`, cylinder(x, y, 7, -7, 2, projection, 18, 0.3));
        push(parts, `foot-${index}`, cylinder(x, y, 5, -5, 5, projection, 18, 0.2));
    });
    push(parts, 'plinth', block(PLINTH, 0, 10, projection));
    push(parts, 'deck', block(DECK, 10, 2, projection));
    const screws: Array<[number, number]> = [
        [42, 48],
        [262, 48],
        [42, 124],
        [262, 124],
    ];
    screws.forEach(([x, y], index) => {
        push(parts, `screw-${index}`, cylinder(x, y, 2.1, 12, 1.1, projection, 12, 0.2));
    });
    const plate: Plan = { x: 36, y: 40, w: 42, d: 14, r: 1 };
    push(parts, 'nameplate', block(plate, 12, 0.9, projection));
    push(parts, 'name-screw-w', cylinder(plate.x + 6, plate.y + 7, 1.3, 12.9, 0.6, projection, 10));
    push(parts, 'name-screw-e', cylinder(plate.x + plate.w - 6, plate.y + 7, 1.3, 12.9, 0.6, projection, 10));
    const rail: Plan = { x: 32, y: 134, w: 240, d: 12, r: 2 };
    push(parts, 'rail', block(rail, 12, 5, projection));
    push(parts, 'post-w', cylinder(48, 140, 4, 12, 16, projection, 16, 0.3));
    push(parts, 'post-e', cylinder(252, 140, 4, 12, 16, projection, 16, 0.3));
    push(parts, 'collar', cylinder(148, 140, 8, 12, 3, projection, 20, 0.3));
    const mastTop = stackTop(MAX_PLATES) + 8;
    push(parts, 'mast', cylinder(148, 140, 4.5, 15, mastTop - 15, projection, 20, 0.2));
    SCALE_TICKS.forEach((count) => {
        push(
            parts,
            `tick-${count}`,
            block({ x: 142, y: 124, w: 12, d: 14, r: 0.6 }, stackTop(count) - 0.4, 0.8, projection)
        );
    });
    push(parts, 'square-body', block(SQUARE, 12, 4, projection));
    walls(parts, SQUARE, 'square', projection);
    push(parts, 'square-clamp', block({ x: 58, y: 50, w: 16, d: 8, r: 1 }, 12, 3, projection));
    push(parts, 'round-body', cylinder(ROUND.cx, ROUND.cy, ROUND.body, 12, 4, projection, 24, 0.4));
    push(parts, 'round-lip', cylinder(ROUND.cx, ROUND.cy, ROUND.lip, 15.2, 0.8, projection, 24, 0.2));
    push(parts, 'round-clamp', block({ x: 124, y: 58, w: 16, d: 8, r: 1 }, 12, 3, projection));
    push(parts, 'tray-body', block(TRAY, 12, 4, projection));
    walls(parts, TRAY, 'tray', projection);
    push(parts, 'tray-clamp', block({ x: 210, y: 56, w: 18, d: 8, r: 1 }, 12, 3, projection));
    for (let index = 0; index < request; index += 1) {
        push(
            parts,
            `request-${plateZ(index)}`,
            block(SQUARE_PLATE, plateZ(index), PLATE_THICKNESS, projection),
            index === request - 1
        );
    }
    for (let index = 0; index < storage; index += 1) {
        push(
            parts,
            `stored-${plateZ(index)}`,
            cylinder(ROUND.cx, ROUND.cy, ROUND.plate, plateZ(index), PLATE_THICKNESS, projection, 20, 0.35),
            index === storage - 1
        );
    }
    for (let index = 0; index < wire; index += 1) {
        push(
            parts,
            `wire-${plateZ(index)}`,
            block(TRAY_PLATE, plateZ(index), PLATE_THICKNESS, projection),
            index === wire - 1
        );
    }
    return parts;
}

function counts(value: Estimate, step: number): { request: number; storage: number; wire: number } {
    return {
        request: visiblePlates(value.requestPlates, step),
        storage: visiblePlates(value.storagePlates, step),
        wire: visiblePlates(value.wirePlates, step),
    };
}

export default function EstimateStack({ pane = 'learn' }: { pane?: 'learn' | 'lab' }): React.JSX.Element {
    const figId = pane === 'lab' ? 'fig-est-h' : 'fig-est-learn';
    const figure = useRef<HTMLElement>(null);
    const [knob, setKnob] = useState<Knob>('users');
    const [guess, setGuess] = useState<PredictionId | null>(null);
    const [run, setRun] = useState<Knob | null>(null);
    const [missed, setMissed] = useState(false);
    const showing: Estimate = pane === 'lab' && run ? estimate(assumptionsFor(run)) : LEARN_ESTIMATE;
    const end = pane === 'learn' ? maxPlates(LEARN_ESTIMATE) : 0;
    const marks = useMemo(() => plateMarks(end), [end]);
    const clock = useClock({ marks, end, rate: 2, target: figure });
    const { reduced, restart, seek } = clock;

    useEffect(() => {
        if (pane !== 'learn') return;
        if (reduced) {
            seek(end);
            return;
        }
        restart();
    }, [pane, reduced, end, seek, restart]);

    const step = pane === 'learn' ? Math.floor(clock.t + 1e-9) : maxPlates(showing);
    const drawn = counts(showing, step);
    const projection = useMemo(() => envelope(), []);
    const parts = useMemo(
        () => scene(projection, drawn.request, drawn.storage, drawn.wire),
        [projection, drawn.request, drawn.storage, drawn.wire]
    );
    const chooseKnob = (next: Knob): void => {
        setKnob(next);
        setGuess(null);
        setRun(null);
        setMissed(false);
    };
    const go = (): void => {
        if (guess === null) {
            setMissed(true);
            return;
        }
        setMissed(false);
        setRun(knob);
    };

    return (
        <figure ref={figure} className="bp-sheet ln-fig" aria-labelledby={figId}>
            <div className="ln-fig-head">
                <span id={figId}>
                    {pane === 'learn' ? 'Three pans on one scale' : 'Fig. 1 · Which stack changes height'}
                </span>
                <span>Assumed inputs, computed products</span>
            </div>
            <div className={pane === 'lab' ? 'ln-fig-grid' : 'ln-fig-grid ln-fig-grid-one'}>
                {pane === 'lab' ? (
                    <div className="ln-controls">
                        <Choice
                            legend="Change one assumed input"
                            options={KNOBS}
                            label={knobLabel}
                            value={knob}
                            onChange={chooseKnob}
                        />
                        <div className="ln-predict">
                            <Choice
                                legend="Predict which quantities change height"
                                options={PREDICTIONS}
                                label={predictionLabel}
                                value={guess}
                                onChange={(id) => {
                                    setGuess(id);
                                    setRun(null);
                                    setMissed(false);
                                }}
                            />
                        </div>
                        <button type="button" className="ln-btn" onClick={go}>
                            Run
                        </button>
                    </div>
                ) : null}
                <div>
                    <div className="iso" data-theme="light">
                        <svg
                            className="bp-svg ln-svg iso-svg"
                            viewBox="0 0 720 440"
                            aria-hidden="true"
                            data-request-plates={drawn.request}
                            data-storage-plates={drawn.storage}
                            data-wire-plates={drawn.wire}
                        >
                            {parts.map((part) => (
                                <Metal key={part.key} paths={part.paths} part={part.key} lit={part.lit} />
                            ))}
                        </svg>
                    </div>
                    {pane === 'learn' ? (
                        <>
                            <p className="m-0 mt-2" data-current-step>
                                {assumptionLine(LEARN_ASSUMPTIONS)} {stackCaption(LEARN_ESTIMATE, step)}
                            </p>
                            <p className="m-0 mt-2">{plateUnitLine()}</p>
                            <Transport
                                label="Estimate scale"
                                playing={clock.playing}
                                atStart={clock.t <= 0}
                                atEnd={clock.t >= end - 1e-6}
                                onPlay={clock.play}
                                onPause={clock.pause}
                                onPrev={clock.prev}
                                onNext={clock.next}
                                onReset={clock.reset}
                            />
                        </>
                    ) : run ? (
                        <p className="m-0 mt-2" data-result>
                            {stackCaption(showing, step)} {outcomeText(run)} {judge(guess, run)}
                        </p>
                    ) : (
                        <p className="ln-frame">
                            {missed
                                ? 'Predict which quantities change height, then press Run.'
                                : 'The pans hold the notebook from the lesson. Change one assumed input, predict which quantities change height, then press Run.'}
                        </p>
                    )}
                </div>
            </div>
        </figure>
    );
}
