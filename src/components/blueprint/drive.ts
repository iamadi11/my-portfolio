/**
 * Runs every `[data-sheet]` scene on the page. A scene maps scroll (or, for `clock`, time since load) to scene time
 * `t ∈ [0, T]`, then sets each registered element from `t` alone, never from the previous frame, so jumping
 * anywhere on the page lands on the right drawing. Kinds (from `pen.tsx` and `scene.tsx`):
 *
 *   d  drawn stroke: dash offset 1 → 0 (ease-in-out), fill fades in over the last 45 %
 *   f  faded: opacity (ease-out)
 *   v  HTML: sets `--e` (0 → 1, ease-out) for CSS to use
 *   n  HTML number: text tweens from `data-from` to `data-to` with `data-dec` decimals
 *   m  morph group: matrix flat → iso, lifted by z
 *
 * Modes: `pin` (tall section, sticky stage: progress = how far through the section), `flow` (progress = how far
 * the section's top has passed 90 % of the viewport, in section heights: an element at fraction f of the
 * section draws around f), `clock` (seconds since the scene first came into view).
 *
 * Reduced motion: every scene is set to its end state once and nothing listens to scroll.
 */

type Mat = [number, number, number, number, number, number];
type Key = [number, number, number, number]; // t, cx, cy, z

type Reg = {
    el: HTMLElement | SVGElement;
    k: string;
    a: number;
    b: number;
    last: number;
    m?: { flat: Mat; iso: Mat; z: number };
    from?: number;
    to?: number;
    dec?: number;
};

type Scene = {
    root: HTMLElement;
    mode: 'pin' | 'flow' | 'clock';
    T: number;
    /** Pin: viewport heights of lead-in before the stage pins (progress starts while it scrolls in). */
    lead: number;
    regs: Reg[];
    cam?: { el: SVGGElement; keys: Key[]; keysSm?: Key[]; w: number; h: number; last: string };
    t0?: number;
    on: boolean;
    lastT: number;
};

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const eo = (p: number): number => 1 - (1 - p) * (1 - p) * (1 - p);
const eio = (p: number): number => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const q = (v: number): number => Math.round(v * 400) / 400;

function window2(el: Element): [number, number] {
    const [a, b] = (el.getAttribute('data-w') ?? '0 1').split(' ').map(Number);
    return [a, b > a ? b : a + 0.001];
}

function build(root: HTMLElement): Scene {
    const regs: Reg[] = [];
    root.querySelectorAll<HTMLElement | SVGElement>('[data-k]').forEach((el) => {
        const k = el.getAttribute('data-k') ?? 'f';
        if (k === 'm') {
            const m = JSON.parse(el.getAttribute('data-m') ?? '{}');
            regs.push({ el, k, a: m.a, b: m.b, last: -1, m });
            return;
        }
        const [a, b] = window2(el);
        const r: Reg = { el, k, a, b, last: -1 };
        if (k === 'n') {
            r.from = Number(el.getAttribute('data-from'));
            r.to = Number(el.getAttribute('data-to'));
            r.dec = Number(el.getAttribute('data-dec') ?? 0);
        }
        regs.push(r);
    });
    const s: Scene = {
        root,
        mode: (root.getAttribute('data-mode') as Scene['mode']) ?? 'flow',
        T: Number(root.getAttribute('data-t') ?? 1),
        lead: Number(root.getAttribute('data-lead') ?? 0),
        regs,
        on: false,
        lastT: -1,
    };
    const camEl = root.querySelector<SVGGElement>('.bp-cam');
    const keys = root.getAttribute('data-cam');
    if (camEl && keys) {
        const vb = camEl.ownerSVGElement?.viewBox.baseVal;
        s.cam = {
            el: camEl,
            keys: JSON.parse(keys),
            keysSm: root.hasAttribute('data-cam-sm')
                ? JSON.parse(root.getAttribute('data-cam-sm')!)
                : undefined,
            w: vb?.width ?? 0,
            h: vb?.height ?? 0,
            last: '',
        };
    }
    return s;
}

function camera(c: NonNullable<Scene['cam']>, t: number, small: boolean): void {
    const keys = (small && c.keysSm) || c.keys;
    let i = 0;
    while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
    const [t0, x0, y0, z0] = keys[i];
    const [t1, x1, y1, z1] = keys[Math.min(i + 1, keys.length - 1)];
    const p = t1 > t0 ? eio(clamp01((t - t0) / (t1 - t0))) : 1;
    const cx = x0 + (x1 - x0) * p;
    const cy = y0 + (y1 - y0) * p;
    const z = Math.exp(Math.log(z0) + (Math.log(z1) - Math.log(z0)) * p);
    const tr = `translate(${(c.w / 2 - cx * z).toFixed(2)} ${(c.h / 2 - cy * z).toFixed(2)}) scale(${z.toFixed(4)})`;
    if (tr === c.last) return;
    c.last = tr;
    c.el.setAttribute('transform', tr);
}

function apply(s: Scene, t: number, small: boolean): void {
    if (t === s.lastT) return;
    s.lastT = t;
    s.root.style.setProperty('--p', String(q(t / s.T)));
    for (const r of s.regs) {
        const raw = clamp01((t - r.a) / (r.b - r.a));
        const p = q(raw);
        if (p === r.last) continue;
        r.last = p;
        const st = r.el.style;
        switch (r.k) {
            case 'd': {
                const e = eio(p);
                st.opacity = t > r.a ? '1' : '0';
                st.strokeDashoffset = String(1 - e);
                st.fillOpacity = String(clamp01((e - 0.55) / 0.45));
                break;
            }
            case 'v':
                st.setProperty('--e', String(q(eo(p))));
                break;
            case 'n': {
                const v = r.from! + (r.to! - r.from!) * eio(p);
                r.el.textContent = v.toFixed(r.dec);
                break;
            }
            case 'm': {
                const { flat, iso, z } = r.m!;
                const e = eio(p);
                const M = flat.map((f, i) => f + (iso[i] - f) * e);
                M[5] -= z * e;
                r.el.setAttribute('transform', `matrix(${M.map((v) => v.toFixed(3)).join(' ')})`);
                st.setProperty('--u', String(1 / Math.sqrt(Math.abs(M[0] * M[3] - M[1] * M[2]))));
                st.opacity = t >= r.a ? '1' : '0';
                break;
            }
            default:
                st.opacity = String(eo(p));
        }
    }
    if (s.cam) camera(s.cam, t, small);
}

function progress(s: Scene, vh: number, atEnd: boolean, now: number): number {
    if (s.mode === 'clock') {
        if (s.t0 == null) return 0;
        return Math.min(s.T, (now - s.t0) / 1000);
    }
    const r = s.root.getBoundingClientRect();
    if (s.mode === 'pin') {
        const pre = s.lead * vh;
        return s.T * clamp01((pre - r.top) / Math.max(1, r.height - vh + pre));
    }
    if (atEnd && r.top < vh) return s.T;
    return s.T * clamp01((0.9 * vh - r.top) / Math.max(1, r.height));
}

/** Start every scene on the page. Returns a cleanup. */
export function drive(): () => void {
    const scenes = Array.from(document.querySelectorAll<HTMLElement>('[data-sheet]')).map(build);
    const smq = window.matchMedia('(max-width: 640px)');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        scenes.forEach((s) => apply(s, s.T, smq.matches));
        document.documentElement.classList.add('bp-still');
        return () => {};
    }

    let raf = 0;
    const tick = (now: number): void => {
        raf = 0;
        const vh = window.innerHeight;
        const atEnd = window.scrollY + vh >= document.documentElement.scrollHeight - 2;
        let clockRunning = false;
        for (const s of scenes) {
            if (!s.on) continue;
            if (s.mode === 'clock' && s.t0 == null) s.t0 = now;
            const t = progress(s, vh, atEnd, now);
            apply(s, t, smq.matches);
            if (s.mode === 'clock' && t < s.T) clockRunning = true;
        }
        if (clockRunning) raf = requestAnimationFrame(tick);
    };
    const schedule = (): void => {
        if (!raf) raf = requestAnimationFrame(tick);
    };
    const resize = (): void => {
        scenes.forEach((s) => {
            s.lastT = -1;
            if (s.cam) s.cam.last = '';
        });
        schedule();
    };

    const io = new IntersectionObserver(
        (entries) => {
            for (const e of entries) {
                const s = scenes.find((x) => x.root === e.target);
                if (s) s.on = e.isIntersecting;
            }
            schedule();
        },
        { rootMargin: '25% 0px' }
    );
    scenes.forEach((s) => io.observe(s.root));
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', resize);
    smq.addEventListener('change', resize);
    document.documentElement.classList.add('bp-live');

    return () => {
        io.disconnect();
        window.removeEventListener('scroll', schedule);
        window.removeEventListener('resize', resize);
        smq.removeEventListener('change', resize);
        if (raf) cancelAnimationFrame(raf);
    };
}
