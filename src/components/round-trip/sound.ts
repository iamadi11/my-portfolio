/** A low drone, wind that rises with speed, and a chime per project ring. Silent until switched on. */
export type Sound = {
    toggle: () => Promise<boolean>;
    ping: (k: number) => void;
    wind: (speed: number) => void;
};

const NOTES = [523.25, 587.33, 659.25, 783.99, 880, 987.77];

function build(ctx: AudioContext, master: GainNode): { bp: BiquadFilterNode; gain: GainNode } {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 360;
    lp.connect(master);
    for (const f of [55, 55.35, 82.4]) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.value = f;
        g.gain.value = 0.025;
        o.connect(g).connect(lp);
        o.start();
    }
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 0.8;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    src.connect(bp).connect(gain).connect(master);
    src.start();
    return { bp, gain };
}

export function createSound(): Sound {
    let ctx: AudioContext | null = null;
    let master: GainNode | null = null;
    let wind: { bp: BiquadFilterNode; gain: GainNode } | null = null;
    let on = false;
    const live = (): boolean => on && ctx?.state === 'running';
    return {
        async toggle() {
            if (!ctx) {
                ctx = new AudioContext();
                master = ctx.createGain();
                master.gain.value = 0;
                master.connect(ctx.destination);
                wind = build(ctx, master);
            }
            on = !on;
            if (on) await ctx.resume();
            master?.gain.setTargetAtTime(on ? 0.9 : 0, ctx.currentTime, on ? 0.4 : 0.15);
            return on;
        },
        ping(k) {
            if (!live() || !ctx || !master) return;
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            const t = ctx.currentTime;
            o.frequency.value = NOTES[k % NOTES.length];
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.06, t + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
            o.connect(g).connect(master);
            o.start(t);
            o.stop(t + 2.3);
        },
        wind(speed) {
            if (!live() || !ctx || !wind) return;
            wind.gain.gain.setTargetAtTime(0.015 + speed * 0.2, ctx.currentTime, 0.1);
            wind.bp.frequency.setTargetAtTime(280 + speed * 2200, ctx.currentTime, 0.1);
        },
    };
}
