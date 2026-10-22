import { clamp } from '@/components/round-trip/math';

type Ask = { requestPermission?: () => Promise<'granted' | 'denied'> };

const DEAD = 3; // degrees of forward/back tilt ignored around "level"
const FULL = 12; // degrees past the dead zone for full speed (so ~15° in all)
const MAX = 1500; // px per second at full tilt
/** Flip to -1 if a device reports pitch the other way round. */
const FORWARD = 1;

type Source = 'tilt' | 'boost';

/** The one scroll loop for everything that pushes the page along: tilt, and holding to boost. */
export type Push = {
    /** What a source wants (px per second) and how quickly the page follows it (per second). */
    aim: (src: Source, target: number, rate: number) => void;
    /** Stops a source dead. */
    halt: (src: Source) => void;
    /** A source's speed now, px per second. */
    speed: (src: Source) => number;
    stop: () => void;
};

export function push(): Push {
    const all: Record<Source, { vel: number; target: number; rate: number }> = {
        tilt: { vel: 0, target: 0, rate: 6 },
        boost: { vel: 0, target: 0, rate: 5 },
    };
    let raf = 0;
    let last = 0;
    const tick = (now: number): void => {
        const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
        last = now;
        let v = 0;
        let busy = false;
        for (const s of Object.values(all)) {
            s.vel += (s.target - s.vel) * (1 - Math.exp(-dt * s.rate));
            if (s.target === 0 && Math.abs(s.vel) < 2) s.vel = 0;
            v += s.vel;
            busy ||= s.target !== 0 || s.vel !== 0;
        }
        // Instant steps: the page's smooth scrolling would restart every frame and never move.
        if (Math.abs(v) > 2) scrollBy({ top: v * dt, behavior: 'instant' });
        raf = busy ? requestAnimationFrame(tick) : 0;
        if (!busy) last = 0;
    };
    return {
        aim(src, target, rate) {
            all[src].target = target;
            all[src].rate = rate;
            if (!raf) raf = requestAnimationFrame(tick);
        },
        halt(src) {
            all[src].vel = 0;
            all[src].target = 0;
        },
        speed: (src) => all[src].vel,
        stop: () => cancelAnimationFrame(raf),
    };
}

export type Tilt = { stop: () => void; scrolling: () => boolean };

/**
 * Phones. Side-to-side tilt always turns the camera a little (like the mouse on desktop; iOS asks
 * permission first). The Tilt button adds tilt to scroll: tilt the top edge away from you to scroll
 * down, towards you to scroll up. "Level" is however the phone is held when it is switched on, and
 * re-levels whenever a finger lifts. It pauses while a finger is on the screen, so it never fights a swipe.
 */
export function tilt(pointer: { x: number; y: number }, button: HTMLButtonElement | null, page: Push): Tilt {
    const none: Tilt = { stop: () => undefined, scrolling: () => false };
    if (!matchMedia('(pointer: coarse)').matches || typeof DeviceOrientationEvent === 'undefined')
        return none;
    let listening = false;
    let on = false;
    let level: number | null = null;
    let pitch = 0;
    let seen = false;
    let touching = false;

    /** Tilting forward makes the pitch smaller, which scrolls down. */
    const steer = (): void => {
        if (!on) return;
        const d = level === null ? 0 : pitch - level;
        const over = Math.max(0, Math.abs(d) - DEAD);
        const target = touching ? 0 : -Math.sign(d) * FORWARD * MAX * Math.pow(clamp(over / FULL), 1.4);
        page.aim('tilt', target, 6);
        button?.style.setProperty('--tilt', String(Math.abs(page.speed('tilt')) / MAX));
    };
    const onTilt = (e: DeviceOrientationEvent): void => {
        if (e.beta === null || e.gamma === null) return;
        const angle = screen.orientation?.angle ?? 0;
        const [side, fwd] =
            angle === 90 ? [e.beta, -e.gamma] : angle === 270 ? [-e.beta, e.gamma] : [e.gamma, e.beta];
        pitch = fwd;
        seen = true;
        if (level === null) level = fwd;
        pointer.x = clamp(side / 25, -1, 1);
        steer();
    };
    const listen = (): void => {
        if (listening) return;
        listening = true;
        addEventListener('deviceorientation', onTilt);
    };
    const onDown = (): void => {
        touching = true;
        steer();
    };
    const onUp = (): void => {
        touching = false;
        if (seen) level = pitch;
        steer();
    };
    const setScroll = (next: boolean): void => {
        on = next;
        page.halt('tilt');
        level = seen ? pitch : null;
        button?.setAttribute('aria-pressed', String(on));
        if (button) {
            button.textContent = on ? 'Tilt on' : 'Tilt to scroll';
            button.setAttribute(
                'aria-label',
                on ? 'Tilt on — click to turn off' : 'Tilt to scroll — off until you turn it on'
            );
        }
        button?.style.setProperty('--tilt', '0');
    };
    const ask = (DeviceOrientationEvent as unknown as Ask).requestPermission;
    const onClick = async (): Promise<void> => {
        if (!on && ask && !listening) {
            if ((await ask().catch(() => 'denied')) !== 'granted') return;
            listen();
        }
        setScroll(!on);
    };
    if (!ask) listen();
    if (button) {
        button.hidden = false;
        button.addEventListener('click', onClick);
    }
    addEventListener('touchstart', onDown, { passive: true });
    addEventListener('touchend', onUp, { passive: true });
    return {
        stop: () => {
            page.halt('tilt');
            removeEventListener('deviceorientation', onTilt);
            removeEventListener('touchstart', onDown);
            removeEventListener('touchend', onUp);
            button?.removeEventListener('click', onClick);
        },
        scrolling: () => on,
    };
}
