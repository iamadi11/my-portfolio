import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

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
 * Reduced motion: finish scenes with a whole-sheet camera; react to preference, viewport and print changes.
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
    cam?: {
        el: SVGGElement;
        keys: Key[];
        keysSm?: Key[];
        keysStill?: Key[];
        w: number;
        h: number;
        last: string;
    };
    /** Smoothed scene time (scroll scenes ease toward their target; -1 = not yet seen, jump straight there). */
    cur: number;
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
        // An element belongs to its nearest scene: a scene nested inside this one (e.g. a lettered title in a
        // pinned sheet) runs its own elements.
        if (el.parentElement?.closest('[data-sheet]') !== root) return;
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
        cur: -1,
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
            keysStill: root.hasAttribute('data-cam-still')
                ? ([[0, ...JSON.parse(root.getAttribute('data-cam-still')!)]] as Key[])
                : undefined,
            w: vb?.width ?? 0,
            h: vb?.height ?? 0,
            last: '',
        };
    }
    return s;
}

function camera(c: NonNullable<Scene['cam']>, t: number, small: boolean, still: boolean): void {
    const keys = still ? (c.keysStill ?? c.keys) : (small && c.keysSm) || c.keys;
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

function apply(s: Scene, t: number, small: boolean, still = false): void {
    const inspected = s.root.getAttribute('data-inspection-time');
    if (!still && inspected !== null && Number.isFinite(Number(inspected)))
        t = Math.max(0, Math.min(s.T, Number(inspected)));
    // Camera composition depends on viewport/mode even when scene time is unchanged.
    if (s.cam) camera(s.cam, t, small, still);
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
}

/**
 * Live measurements: an SVG <text data-measure="w|h" data-label="W"> inside a drawing shows the drawing's real
 * size in CSS pixels ("W = 1238 PX") and follows it on resize. The server renders the bare label.
 */
function measure(): () => void {
    const labels = Array.from(document.querySelectorAll<SVGTextElement>('[data-measure]'));
    if (!labels.length || !('ResizeObserver' in window)) return () => {};
    // ResizeObserver reports the layout box, untouched by transforms (e.g. the hero's opening zoom).
    const ro = new ResizeObserver((entries) => {
        for (const e of entries)
            for (const el of labels) {
                if (el.ownerSVGElement !== e.target) continue;
                const v =
                    el.getAttribute('data-measure') === 'h' ? e.contentRect.height : e.contentRect.width;
                el.textContent = `${el.getAttribute('data-label') ?? ''} = ${Math.round(v)} PX`;
            }
    });
    labels.forEach((el) => el.ownerSVGElement && ro.observe(el.ownerSVGElement));
    return () => ro.disconnect();
}

/** GSAP owns time and scroll smoothing; apply() alone owns the drawing at that time. */
export function drive(): () => void {
    const scenes = Array.from(document.querySelectorAll<HTMLElement>('[data-sheet]')).map(build);
    const small = window.matchMedia('(max-width: 640px)');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const unmeasure = measure();
    let context: gsap.Context | undefined;
    let printing = false;
    const clocks: { scene: Scene; timeline: gsap.core.Timeline; visible: boolean }[] = [];
    const still = (): void => scenes.forEach((scene) => apply(scene, scene.T, small.matches, true));
    const create = (): void => {
        context?.revert();
        clocks.length = 0;
        document.documentElement.classList.toggle('bp-still', motion.matches);
        document.documentElement.classList.toggle('bp-live', !motion.matches);
        scenes.forEach((scene) => {
            scene.cur = 0;
            scene.lastT = -1;
            if (scene.cam) scene.cam.last = '';
        });
        if (motion.matches || printing) {
            still();
            return;
        }
        context = gsap.context(() => {
            for (const scene of scenes) {
                const cursor = { time: 0 };
                const timeline = gsap.timeline({
                    paused: true,
                    onUpdate: () => {
                        scene.cur = cursor.time;
                        apply(scene, cursor.time, small.matches);
                    },
                });
                timeline.to(cursor, { time: scene.T, duration: scene.T, ease: 'none' });
                if (scene.mode === 'clock') {
                    const clock = { scene, timeline, visible: false };
                    clocks.push(clock);
                    ScrollTrigger.create({
                        trigger: scene.root,
                        start: 'top 95%',
                        end: 'bottom top',
                        onToggle: (self) => {
                            clock.visible = self.isActive;
                            if (self.isActive && !document.hidden && !printing) timeline.play();
                            else timeline.pause();
                        },
                    });
                } else {
                    const start = (): number =>
                        window.scrollY +
                        scene.root.getBoundingClientRect().top -
                        (scene.mode === 'pin' ? scene.lead * window.innerHeight : 0.9 * window.innerHeight);
                    const end = (): number => {
                        const height = scene.root.getBoundingClientRect().height;
                        const natural =
                            start() +
                            Math.max(
                                1,
                                scene.mode === 'pin'
                                    ? height - window.innerHeight + scene.lead * window.innerHeight
                                    : height
                            );
                        return Math.max(start() + 1, Math.min(natural, ScrollTrigger.maxScroll(window)));
                    };
                    ScrollTrigger.create({
                        trigger: scene.root,
                        animation: timeline,
                        start,
                        end,
                        scrub: 0.16,
                        invalidateOnRefresh: true,
                    });
                }
            }
        });
        ScrollTrigger.refresh();
    };
    const resize = (): void => {
        if (motion.matches || printing) {
            still();
            return;
        }
        scenes.forEach((scene) => {
            if (scene.cam) {
                scene.cam.last = '';
                apply(scene, Math.max(0, scene.cur), small.matches);
            }
        });
        ScrollTrigger.refresh();
    };
    const inspect = (event: Event): void => {
        const scene = scenes.find((item) => item.root === event.target);
        if (!scene) return;
        const time = (event as CustomEvent<{ time: number | null }>).detail?.time;
        if (typeof time === 'number' && Number.isFinite(time))
            scene.root.setAttribute('data-inspection-time', String(Math.max(0, Math.min(scene.T, time))));
        else scene.root.removeAttribute('data-inspection-time');
        apply(scene, typeof time === 'number' ? time : Math.max(0, scene.cur), small.matches);
    };
    document.addEventListener('bp-inspect', inspect);
    const beforePrint = (): void => {
        printing = true;
        context?.revert();
        clocks.length = 0;
        still();
    };
    const afterPrint = (): void => {
        printing = false;
        create();
    };
    const visibility = (): void => {
        for (const clock of clocks) {
            if (document.hidden || printing) clock.timeline.pause();
            else if (clock.visible) clock.timeline.play();
        }
    };
    window.addEventListener('beforeprint', beforePrint);
    window.addEventListener('afterprint', afterPrint);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', visibility);
    small.addEventListener('change', resize);
    motion.addEventListener('change', create);
    create();
    return () => {
        context?.revert();
        unmeasure();
        clocks.length = 0;
        window.removeEventListener('beforeprint', beforePrint);
        window.removeEventListener('afterprint', afterPrint);
        window.removeEventListener('resize', resize);
        document.removeEventListener('bp-inspect', inspect);
        document.removeEventListener('visibilitychange', visibility);
        small.removeEventListener('change', resize);
        motion.removeEventListener('change', create);
        document.documentElement.classList.remove('bp-live', 'bp-still');
    };
}
