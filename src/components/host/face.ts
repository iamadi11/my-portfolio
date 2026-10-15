import type { Face } from '@/components/host/Avatar';

/** Viseme timings from `npm run voice` (HeadTTS, Oculus viseme ids, milliseconds). */
export type Visemes = { visemes: string[]; vtimes: number[]; vdurations: number[] };

/** Oculus viseme → ARKit blendshapes. Hand-tuned; weights are peaks, blended by an envelope. */
const SHAPES: Record<string, Face> = {
    sil: {},
    PP: { mouthClose: 0.55, mouthPressLeft: 0.4, mouthPressRight: 0.4 },
    FF: { jawOpen: 0.08, mouthRollLower: 0.5, mouthUpperUpLeft: 0.2, mouthUpperUpRight: 0.2 },
    TH: { jawOpen: 0.16, tongueOut: 0.22 },
    DD: { jawOpen: 0.22, mouthShrugUpper: 0.15 },
    kk: { jawOpen: 0.28 },
    CH: { jawOpen: 0.18, mouthFunnel: 0.45, mouthPucker: 0.2 },
    SS: { jawOpen: 0.1, mouthStretchLeft: 0.3, mouthStretchRight: 0.3 },
    nn: { jawOpen: 0.16 },
    RR: { jawOpen: 0.18, mouthFunnel: 0.3, mouthPucker: 0.2 },
    aa: { jawOpen: 0.58 },
    E: { jawOpen: 0.32, mouthStretchLeft: 0.32, mouthStretchRight: 0.32 },
    I: { jawOpen: 0.2, mouthStretchLeft: 0.42, mouthStretchRight: 0.42 },
    O: { jawOpen: 0.4, mouthFunnel: 0.55, mouthPucker: 0.25 },
    U: { jawOpen: 0.18, mouthPucker: 0.6, mouthFunnel: 0.3 },
};

/** Ramp in/out around each viseme so shapes overlap like co-articulated speech. */
const EDGE = 70;

export function mouth(v: Visemes, ms: number): Face {
    const out: Face = {};
    for (let i = 0; i < v.visemes.length; i++) {
        const start = v.vtimes[i];
        const end = start + v.vdurations[i];
        if (ms < start - EDGE || ms > end + EDGE) continue;
        const env = Math.min(1, (ms - (start - EDGE)) / (2 * EDGE), (end + EDGE - ms) / (2 * EDGE));
        const shape = SHAPES[v.visemes[i]] ?? {};
        for (const key in shape) out[key] = Math.max(out[key] ?? 0, shape[key] * env);
    }
    return out;
}

/** Blinks every 2.6–5.4 s and a resting smile, so the head is alive between lines. */
export function ambience(): (now: number, speaking: boolean) => Face {
    let next = 1800;
    return (now, speaking) => {
        if (now > next + 140) next = now + 2600 + Math.random() * 2800;
        const blink = now > next ? Math.sin(((now - next) / 140) * Math.PI) : 0;
        const rest = speaking ? 0.04 : 0.14;
        return {
            eyeBlinkLeft: blink,
            eyeBlinkRight: blink,
            mouthSmileLeft: rest,
            mouthSmileRight: rest,
        };
    };
}
