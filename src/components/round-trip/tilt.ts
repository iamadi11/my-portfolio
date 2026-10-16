import { clamp } from '@/components/round-trip/math';

type Ask = { requestPermission?: () => Promise<'granted' | 'denied'> };

/**
 * Phone tilt → the same -1…1 steering the mouse gives on desktop, so the camera looks around as the
 * phone moves. Android streams orientation straight away; iOS needs a tap on the Tilt button first.
 * The forward angle re-centres slowly, so however the phone is held becomes "straight ahead".
 */
export function tilt(pointer: { x: number; y: number }, button: HTMLButtonElement | null): () => void {
    if (!matchMedia('(pointer: coarse)').matches || typeof DeviceOrientationEvent === 'undefined')
        return () => undefined;
    let base: number | null = null;
    const onTilt = (e: DeviceOrientationEvent): void => {
        if (e.beta === null || e.gamma === null) return;
        const angle = screen.orientation?.angle ?? 0;
        const [side, fwd] =
            angle === 90 ? [e.beta, -e.gamma] : angle === 270 ? [-e.beta, e.gamma] : [e.gamma, e.beta];
        base = base === null ? fwd : base + (fwd - base) * 0.01;
        pointer.x = clamp(side / 25, -1, 1);
        pointer.y = clamp((fwd - base) / 20, -1, 1);
    };
    const listen = (): void => addEventListener('deviceorientation', onTilt);
    const ask = (DeviceOrientationEvent as unknown as Ask).requestPermission;
    const onAsk = (): void => {
        ask?.()
            .then((r) => {
                if (r === 'granted') listen();
                if (button) button.hidden = true;
            })
            .catch(() => undefined);
    };
    if (ask && button) {
        button.hidden = false;
        button.addEventListener('click', onAsk);
    } else listen();
    return () => {
        removeEventListener('deviceorientation', onTilt);
        button?.removeEventListener('click', onAsk);
    };
}
