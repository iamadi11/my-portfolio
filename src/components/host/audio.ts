import type { Visemes } from '@/components/host/face';
import type { Line } from '@/components/host/script';

type Clip = Visemes & { buffer: AudioBuffer | null; duration: number };
type Playing = { source: AudioBufferSourceNode | null; startAt: number; clip: Clip; timer: number };

const NO_VISEMES: Visemes = { visemes: [], vtimes: [], vdurations: [] };

export type Voice = {
    stop(): void;
    prefetch(lines: Line[]): void;
    play(line: Line, onEnd: () => void): Promise<void>;
    now(): { visemes: Visemes; ms: number } | null;
    setMuted(muted: boolean): void;
    swell(seconds: number): void;
    chime(): void;
    close(): void;
};

/**
 * Plays pre-rendered lines (public/voice/<id>.mp3 + .json) and keeps the clock lip-sync reads.
 * Create it inside the Start click, so the browser lets the AudioContext make sound.
 * A missing clip still "plays" for its reading time, so captions and the tour keep going.
 */
export function createVoice(): Voice {
    const ctx = new AudioContext();
    const out = ctx.createGain();
    out.connect(ctx.destination);
    const clips = new Map<string, Promise<Clip>>();
    let current: Playing | null = null;
    /** Bumped by every play/stop so a clip that finishes loading late never starts. */
    let seq = 0;

    const fetchClip = async (line: Line): Promise<Clip> => {
        try {
            const [meta, audio] = await Promise.all([
                fetch(`/voice/${line.id}.json`).then((r) => (r.ok ? r.json() : Promise.reject(r.status))),
                fetch(`/voice/${line.id}.mp3`).then((r) =>
                    r.ok ? r.arrayBuffer() : Promise.reject(r.status)
                ),
            ]);
            const buffer = await ctx.decodeAudioData(audio);
            return { ...(meta as Visemes), buffer, duration: buffer.duration * 1000 };
        } catch {
            // ponytail: no audio for this line; read time at ~2.6 words/s.
            return { ...NO_VISEMES, buffer: null, duration: (line.text.split(/\s+/).length / 2.6) * 1000 };
        }
    };

    const load = (line: Line): Promise<Clip> => {
        const cached = clips.get(line.id);
        if (cached) return cached;
        const clip = fetchClip(line);
        clips.set(line.id, clip);
        return clip;
    };

    const envelope = (t: number, seconds: number, peak: number): GainNode => {
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(peak, t + seconds * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
        return gain;
    };

    const stop = (): void => {
        seq++;
        if (!current) return;
        window.clearTimeout(current.timer);
        current.source?.stop();
        current = null;
    };

    return {
        stop,

        /** Warm the cache for lines that are likely next. */
        prefetch(lines: Line[]): void {
            lines.forEach((line) => void load(line));
        },

        async play(line: Line, onEnd: () => void): Promise<void> {
            stop();
            const mine = seq;
            const clip = await load(line);
            if (ctx.state === 'suspended') await ctx.resume();
            if (mine !== seq) return;
            const startAt = ctx.currentTime + 0.05;
            let source: AudioBufferSourceNode | null = null;
            if (clip.buffer) {
                source = ctx.createBufferSource();
                source.buffer = clip.buffer;
                source.connect(out);
                source.start(startAt);
            }
            const playing: Playing = {
                source,
                startAt,
                clip,
                timer: window.setTimeout(() => {
                    if (current !== playing) return;
                    current = null;
                    onEnd();
                }, clip.duration + 80),
            };
            current = playing;
        },

        /** Visemes and elapsed ms of the line now playing, or null. */
        now(): { visemes: Visemes; ms: number } | null {
            return current ? { visemes: current.clip, ms: (ctx.currentTime - current.startAt) * 1000 } : null;
        },

        setMuted(muted: boolean): void {
            out.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.02);
        },

        /** The 2D → 3D moment: filtered noise rising under a two-note swell. */
        swell(seconds: number): void {
            const t = ctx.currentTime;
            const noise = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
            const data = noise.getChannelData(0);
            for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
            const hiss = ctx.createBufferSource();
            hiss.buffer = noise;
            const band = ctx.createBiquadFilter();
            band.type = 'bandpass';
            band.Q.value = 6;
            band.frequency.setValueAtTime(260, t);
            band.frequency.exponentialRampToValueAtTime(3200, t + seconds);
            hiss.connect(band)
                .connect(envelope(t, seconds, 0.22))
                .connect(out);
            hiss.start(t);

            for (const [from, to] of [
                [220, 440],
                [330, 660],
            ]) {
                const tone = ctx.createOscillator();
                tone.frequency.setValueAtTime(from, t);
                tone.frequency.exponentialRampToValueAtTime(to, t + seconds);
                tone.connect(envelope(t, seconds, 0.06)).connect(out);
                tone.start(t);
                tone.stop(t + seconds + 0.1);
            }
        },

        chime(): void {
            const t = ctx.currentTime;
            for (const freq of [880, 1320]) {
                const tone = ctx.createOscillator();
                tone.frequency.value = freq;
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0.0001, t);
                gain.gain.exponentialRampToValueAtTime(0.08, t + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
                tone.connect(gain).connect(out);
                tone.start(t);
                tone.stop(t + 1.3);
            }
        },

        close(): void {
            stop();
            void ctx.close();
        },
    };
}
