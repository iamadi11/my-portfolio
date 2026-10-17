import { clamp } from '@/components/round-trip/math';

type Ask = { requestPermission?: () => Promise<'granted' | 'denied'> };

const DEAD = 6; // degrees of forward/back tilt ignored around "level"
const FULL = 24; // degrees past the dead zone for full speed
const MAX = 1500; // px per second at full tilt
/** Flip to -1 if a device reports pitch the other way round. */
const FORWARD = 1;

export type Tilt = { stop: () => void; scrolling: () => boolean };

/**
 * Phones. Side-to-side tilt always turns the camera a little (like the mouse on desktop; iOS asks
 * permission first). The Tilt button adds tilt to scroll: tilt the top edge away from you to scroll
 * down, towards you to scroll up. "Level" is however the phone is held when it is switched on, and
 * re-levels whenever a finger lifts. It pauses while a finger is on the screen, so it never fights a swipe.
 */
export function tilt(pointer: { x: number; y: number }, button: HTMLButtonElement | null): Tilt {
    const none: Tilt = { stop: () => undefined, scrolling: () => false };
    if (!matchMedia('(pointer: coarse)').matches || typeof DeviceOrientationEvent === 'undefined')
        return none;
    let listening = false;
    let on = false;
    let level: number | null = null;
    let pitch = 0;
    let seen = false;
    let touching = false;
    let vel = 0;
    let raf = 0;
    let last = 0;

    const onTilt = (e: DeviceOrientationEvent): void => {
        if (e.beta === null || e.gamma === null) return;
        const angle = screen.orientation?.angle ?? 0;
        const [side, fwd] =
            angle === 90 ? [e.beta, -e.gamma] : angle === 270 ? [-e.beta, e.gamma] : [e.gamma, e.beta];
        pitch = fwd;
        seen = true;
        if (level === null) level = fwd;
        pointer.x = clamp(side / 25, -1, 1);
    };
    const listen = (): void => {
        if (listening) return;
        listening = true;
        addEventListener('deviceorientation', onTilt);
    };
    const tick = (now: number): void => {
        raf = requestAnimationFrame(tick);
        const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
        last = now;
        const d = level === null ? 0 : pitch - level;
        const over = Math.max(0, Math.abs(d) - DEAD);
        // Tilting forward makes the pitch smaller, which scrolls down.
        const target = touching ? 0 : -Math.sign(d) * FORWARD * MAX * Math.pow(clamp(over / FULL), 1.6);
        vel += (target - vel) * (1 - Math.exp(-dt * 6));
        // Instant steps: the page's smooth scrolling would restart every frame and never move.
        if (Math.abs(vel) > 2) scrollBy({ top: vel * dt, behavior: 'instant' });
        button?.style.setProperty('--tilt', String(Math.abs(vel) / MAX));
    };
    const onDown = (): void => {
        touching = true;
    };
    const onUp = (): void => {
        touching = false;
        if (seen) level = pitch;
    };
    const setScroll = (next: boolean): void => {
        on = next;
        cancelAnimationFrame(raf);
        vel = 0;
        last = 0;
        level = seen ? pitch : null;
        if (on) raf = requestAnimationFrame(tick);
        button?.setAttribute('aria-pressed', String(on));
        if (button) button.textContent = on ? 'Tilt on' : 'Tilt to scroll';
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
            cancelAnimationFrame(raf);
            removeEventListener('deviceorientation', onTilt);
            removeEventListener('touchstart', onDown);
            removeEventListener('touchend', onUp);
            button?.removeEventListener('click', onClick);
        },
        scrolling: () => on,
    };
}
