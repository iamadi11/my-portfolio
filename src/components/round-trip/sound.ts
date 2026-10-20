/**
 * The trip's sound, all synthesised, silent until switched on. Spatial where it counts: the ship's
 * engine sits where the ship is on screen (HRTF), each portal's chime rings from the ring, and
 * every place has its own bed (rain over the city, wind on the dunes, surf, the hum under the
 * aurora) that crossfades as the title card lands. A whoosh on every jump; a roar through the air.
 */
export type Sound = {
    toggle: () => Promise<boolean>;
    /** A chime as the ship passes project ring k, from where the ring is on screen (-1..1). */
    ping: (k: number, x: number) => void;
    /** Wind over the hull, 0–1 with speed. */
    wind: (speed: number) => void;
    /** The engine: where the ship is on screen (-1..1) and how hard it is pushing (0–1). */
    engine: (x: number, thrust: number) => void;
    /** The bed for the place on screen ("city", "grass#0", "ocean", ...). */
    place: (stop: string) => void;
    /** A jump begins; its thump lands on the cut, `lead` seconds from now. */
    jump: (lead: number) => void;
    /** A riser in project k's note as the ship rushes at its portal (0–1); k < 0 for none. */
    rise: (k: number, level: number) => void;
    /** 0–1: burning through the air (entry and exit). */
    roar: (heat: number) => void;
};

const NOTES = [523.25, 587.33, 659.25, 783.99, 880, 987.77];

/** Which bed each place uses; landscapes drop their "#k". */
const BEDS: Record<string, string> = {
    space: 'drone',
    orbit: 'drone',
    city: 'rain',
    grass: 'meadow',
    desert: 'dunes',
    canyon: 'canyon',
    alpine: 'peaks',
    volcano: 'lava',
    ocean: 'surf',
    ice: 'pole',
};

function noise(ctx: AudioContext, brown: boolean): AudioBufferSourceNode {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
        const w = Math.random() * 2 - 1;
        if (brown) {
            last = (last + 0.02 * w) / 1.02;
            d[i] = last * 3.5;
        } else d[i] = w;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.start();
    return src;
}

/** A slow wobble on a gain (wind gusting, surf breathing). */
function lfo(ctx: AudioContext, target: AudioParam, hz: number, depth: number): void {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = hz;
    g.gain.value = depth;
    o.connect(g).connect(target);
    o.start();
}

function filtered(
    ctx: AudioContext,
    src: AudioNode,
    type: BiquadFilterType,
    hz: number,
    q: number,
    out: AudioNode
): GainNode {
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = hz;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.value = 0;
    src.connect(f).connect(g).connect(out);
    return g;
}

/** The beds: each is a gain that `place()` fades up to its level. */
function beds(ctx: AudioContext, out: GainNode): Record<string, { gain: GainNode; level: number }> {
    const white = noise(ctx, false);
    const brown = noise(ctx, true);
    const bed = (gain: GainNode, level: number): { gain: GainNode; level: number } => ({ gain, level });
    // Space: three detuned saws under a low-pass, as before.
    const drone = ctx.createGain();
    drone.gain.value = 0;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 320;
    lp.connect(drone).connect(out);
    for (const f of [55, 55.35, 82.4]) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.value = f;
        g.gain.value = 0.025;
        o.connect(g).connect(lp);
        o.start();
    }
    // Rain: a steady hiss plus a wet rumble of traffic below.
    const rain = ctx.createGain();
    rain.gain.value = 0;
    rain.connect(out);
    filtered(ctx, white, 'highpass', 2600, 0.5, rain).gain.value = 0.05;
    filtered(ctx, brown, 'lowpass', 140, 0.7, rain).gain.value = 0.12;
    // Winds: band-passed noise, each gusting at its own pace.
    const windBed = (hz: number, q: number, gustHz: number, gust: number): GainNode => {
        const g = ctx.createGain();
        g.gain.value = 0;
        g.connect(out);
        const w = filtered(ctx, white, 'bandpass', hz, q, g);
        w.gain.value = 0.11;
        lfo(ctx, w.gain, gustHz, gust);
        return g;
    };
    const meadow = windBed(500, 0.5, 0.11, 0.05);
    // Crickets in the grass: a thin band chirping at 18 Hz.
    const chirp = filtered(ctx, white, 'bandpass', 4200, 12, meadow);
    chirp.gain.value = 0.012;
    lfo(ctx, chirp.gain, 18, 0.012);
    const dunes = windBed(700, 0.6, 0.07, 0.07);
    const canyon = windBed(380, 0.9, 0.05, 0.06);
    const peaks = windBed(1100, 0.7, 0.13, 0.08);
    // Lava: a deep rumble and a hiss of gas.
    const lava = ctx.createGain();
    lava.gain.value = 0;
    lava.connect(out);
    filtered(ctx, brown, 'lowpass', 90, 0.8, lava).gain.value = 0.2;
    const hiss = filtered(ctx, white, 'bandpass', 1800, 1.2, lava);
    hiss.gain.value = 0.02;
    lfo(ctx, hiss.gain, 0.3, 0.015);
    // Surf: brown noise breathing every nine seconds or so.
    const surf = ctx.createGain();
    surf.gain.value = 0;
    surf.connect(out);
    const wave = filtered(ctx, brown, 'lowpass', 420, 0.6, surf);
    wave.gain.value = 0.12;
    lfo(ctx, wave.gain, 0.11, 0.08);
    // The pole: a high thin wind and the hum people say the aurora makes.
    const pole = windBed(1400, 0.8, 0.09, 0.06);
    const hum = ctx.createOscillator();
    const humGain = ctx.createGain();
    hum.frequency.value = 110;
    humGain.gain.value = 0.012;
    lfo(ctx, hum.frequency, 0.2, 2);
    hum.connect(humGain).connect(pole);
    hum.start();
    return {
        drone: bed(drone, 1),
        rain: bed(rain, 1),
        meadow: bed(meadow, 1),
        dunes: bed(dunes, 1),
        canyon: bed(canyon, 1),
        peaks: bed(peaks, 1),
        lava: bed(lava, 1),
        surf: bed(surf, 1),
        pole: bed(pole, 1),
    };
}

/** A sound placed in front of the listener, `x` across the screen, through HRTF. */
function placed(ctx: AudioContext, out: AudioNode): PannerNode {
    const p = ctx.createPanner();
    p.panningModel = 'HRTF';
    p.distanceModel = 'inverse';
    p.refDistance = 4;
    p.positionY.value = -0.5;
    p.positionZ.value = -6;
    p.connect(out);
    return p;
}

/** `given` is made inside the visitor's click, so the browser lets it play once this chunk has loaded. */
export function createSound(given?: AudioContext): Sound {
    let ctx: AudioContext | null = null;
    let master: GainNode | null = null;
    let wind: GainNode | null = null;
    let windBp: BiquadFilterNode | null = null;
    let engine: { pan: PannerNode; gain: GainNode; lp: BiquadFilterNode } | null = null;
    let roar: GainNode | null = null;
    let all: ReturnType<typeof beds> | null = null;
    let riser: { a: OscillatorNode; b: OscillatorNode; gain: GainNode; lp: BiquadFilterNode } | null = null;
    let riseK = 0;
    // Until then a jump is resolving the riser, and the frame's level leaves it alone.
    let riseHeld = 0;
    let bedOn = '';
    let on = false;
    const live = (): boolean => on && ctx?.state === 'running';

    const setup = (): void => {
        ctx = given ?? new AudioContext();
        master = ctx.createGain();
        master.gain.value = 0;
        master.connect(ctx.destination);
        all = beds(ctx, master);
        const white = noise(ctx, false);
        windBp = ctx.createBiquadFilter();
        windBp.type = 'bandpass';
        windBp.Q.value = 0.8;
        wind = ctx.createGain();
        wind.gain.value = 0;
        white.connect(windBp).connect(wind).connect(master);
        // The engine: two saws an octave apart and a breath of hiss, from where the ship is.
        const pan = placed(ctx, master);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 180;
        const gain = ctx.createGain();
        gain.gain.value = 0;
        lp.connect(gain).connect(pan);
        for (const f of [48, 96.5]) {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'sawtooth';
            o.frequency.value = f;
            g.gain.value = 0.05;
            o.connect(g).connect(lp);
            o.start();
        }
        filtered(ctx, white, 'bandpass', 900, 0.7, gain).gain.value = 0.03;
        engine = { pan, gain, lp };
        // The riser: the portal's note and its fifth under a low-pass that opens as it climbs.
        const rlp = ctx.createBiquadFilter();
        rlp.type = 'lowpass';
        rlp.frequency.value = 400;
        const rg = ctx.createGain();
        rg.gain.value = 0;
        rlp.connect(rg).connect(master);
        const osc = (type: OscillatorType, hz: number): OscillatorNode => {
            const o = ctx!.createOscillator();
            o.type = type;
            o.frequency.value = hz;
            o.connect(rlp);
            o.start();
            return o;
        };
        riser = { a: osc('triangle', 260), b: osc('sawtooth', 390), gain: rg, lp: rlp };
        // The roar through the air: brown noise through a low-pass that opens with the heat.
        roar = ctx.createGain();
        roar.gain.value = 0;
        roar.connect(master);
        filtered(ctx, noise(ctx, true), 'lowpass', 500, 0.5, roar).gain.value = 0.5;
    };

    /** On the cut the riser lands on the portal's note and rings out. */
    const resolve = (t: number, at: number): void => {
        if (!riser) return;
        riseHeld = at + 1.6;
        const note = NOTES[riseK % NOTES.length];
        const g = riser.gain.gain;
        const was = g.value;
        for (const [o, m] of [
            [riser.a, 1],
            [riser.b, 1.5],
        ] as const) {
            o.frequency.cancelScheduledValues(t);
            o.frequency.setValueAtTime(o.frequency.value, t);
            o.frequency.exponentialRampToValueAtTime(note * m * 0.97, at);
            o.frequency.setValueAtTime(note * m, at);
        }
        g.cancelScheduledValues(t);
        g.setValueAtTime(was, t);
        g.linearRampToValueAtTime(was > 0.004 ? Math.max(was, 0.04) : 0, at);
        g.setTargetAtTime(0, at, 0.45);
    };

    return {
        async toggle() {
            if (!ctx) setup();
            if (!ctx || !master) return false;
            on = !on;
            if (on) await ctx.resume();
            master.gain.setTargetAtTime(on ? 0.9 : 0, ctx.currentTime, on ? 0.4 : 0.15);
            return on;
        },
        ping(k, x) {
            if (!live() || !ctx || !master) return;
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            const p = placed(ctx, master);
            p.positionX.value = x * 5;
            const t = ctx.currentTime;
            o.frequency.value = NOTES[k % NOTES.length];
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.08, t + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
            o.connect(g).connect(p);
            o.start(t);
            o.stop(t + 2.5);
        },
        wind(speed) {
            if (!live() || !ctx || !wind || !windBp) return;
            wind.gain.setTargetAtTime(0.012 + speed * 0.16, ctx.currentTime, 0.1);
            windBp.frequency.setTargetAtTime(280 + speed * 2200, ctx.currentTime, 0.1);
        },
        engine(x, thrust) {
            if (!live() || !ctx || !engine) return;
            const t = ctx.currentTime;
            engine.pan.positionX.setTargetAtTime(x * 5, t, 0.08);
            engine.gain.gain.setTargetAtTime(0.35 + thrust * 0.5, t, 0.12);
            engine.lp.frequency.setTargetAtTime(150 + thrust * 500, t, 0.12);
        },
        place(stop) {
            if (!ctx || !all) return;
            const name = BEDS[stop.split('#')[0]] ?? 'drone';
            if (name === bedOn) return;
            bedOn = name;
            for (const [key, b] of Object.entries(all))
                b.gain.gain.setTargetAtTime(
                    key === name ? b.level : 0,
                    ctx.currentTime,
                    key === name ? 1.2 : 0.6
                );
        },
        jump(lead) {
            if (!live() || !ctx || !master) return;
            // Noise swept up through a band-pass to the cut, then a soft thump as the scene swaps.
            const t = ctx.currentTime;
            const at = t + (lead > 0 ? lead : 0.5);
            const src = noise(ctx, false);
            const bp = ctx.createBiquadFilter();
            bp.type = 'bandpass';
            bp.Q.value = 1.2;
            bp.frequency.setValueAtTime(180, t);
            bp.frequency.exponentialRampToValueAtTime(3200, at + 0.4);
            bp.frequency.exponentialRampToValueAtTime(300, at + 1.3);
            const g = ctx.createGain();
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.22, at);
            g.gain.exponentialRampToValueAtTime(0.0001, at + 1.4);
            src.connect(bp).connect(g).connect(master);
            src.stop(at + 1.5);
            const thump = ctx.createOscillator();
            const tg = ctx.createGain();
            thump.frequency.setValueAtTime(90, at);
            thump.frequency.exponentialRampToValueAtTime(35, at + 0.6);
            tg.gain.setValueAtTime(0, at);
            tg.gain.linearRampToValueAtTime(0.3, at + 0.05);
            tg.gain.exponentialRampToValueAtTime(0.0001, at + 0.8);
            thump.connect(tg).connect(master);
            thump.start(at);
            thump.stop(at + 0.9);
            resolve(t, at);
        },
        rise(k, level) {
            if (!live() || !ctx || !riser || ctx.currentTime < riseHeld) return;
            if (k >= 0) riseK = k;
            const lv = k < 0 ? 0 : level;
            const t = ctx.currentTime;
            // Climbs an octave from below the note, stopping just short of it: the cut resolves it.
            const hz = (NOTES[riseK % NOTES.length] / 2) * Math.pow(2, lv * 0.92);
            riser.a.frequency.setTargetAtTime(hz, t, 0.08);
            riser.b.frequency.setTargetAtTime(hz * 1.5, t, 0.08);
            riser.lp.frequency.setTargetAtTime(400 + lv * 2400, t, 0.1);
            riser.gain.gain.setTargetAtTime(lv * lv * 0.05, t, 0.1);
        },
        roar(heat) {
            if (!live() || !ctx || !roar) return;
            roar.gain.setTargetAtTime(heat * 0.6, ctx.currentTime, 0.2);
        },
    };
}
