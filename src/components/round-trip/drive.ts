import { clamp, lerp, smooth } from '@/components/round-trip/math';
import type { Sound } from '@/components/round-trip/sound';
import { tilt } from '@/components/round-trip/tilt';
import type { FrameOut, Mark, World } from '@/components/round-trip/world';

/** three.js and the world live in a separate chunk: fetched on idle, built on the first scroll or Start. */
const prefetchWorld = (): Promise<unknown> => import('@/components/round-trip/world');

export type DriveOptions = {
    rings: string[];
    ringAt: number[];
    recordAt: number[];
    skills: Array<{ group: string; items: string }>;
    sound: () => Sound | null;
};

type Els = {
    secs: HTMLElement[];
    route: HTMLElement[];
    req: HTMLElement | null;
    ms: Array<HTMLElement | null>;
    skills: HTMLElement[];
    skillBox: HTMLElement | null;
    skillItems: HTMLElement[];
    projects: HTMLElement[];
    dots: HTMLElement[];
    records: HTMLElement[];
    chips: HTMLElement[];
    ringTags: HTMLElement[];
    recordTags: HTMLElement[];
    vitals: HTMLElement | null;
    huds: HTMLElement[];
};

const ZONES = ['#ffffff', '#8fd3ff', '#ffb35c', '#ff7ad9', '#7af0ff', '#ffffff'];
const SCROLL_KEYS = new Set([' ', 'ArrowDown', 'PageDown', 'End']);

function find(root: HTMLElement): Els {
    const all = (sel: string): HTMLElement[] => [...root.querySelectorAll<HTMLElement>(sel)];
    return {
        secs: all('[data-sec]'),
        route: all('[data-route] li'),
        req: root.querySelector('[data-req]'),
        ms: [0, 1, 2, 3, 4, 5].map((i) => root.querySelector<HTMLElement>(`[data-ms="${i}"]`)),
        skills: all('[data-skill]'),
        skillBox: root.querySelector('[data-skill-box]'),
        skillItems: all('[data-skill-items]'),
        projects: all('[data-project]'),
        dots: all('[data-dot]'),
        records: all('[data-record]'),
        chips: all('[data-chip]'),
        ringTags: all('[data-ring-tag]'),
        recordTags: all('[data-record-tag]'),
        vitals: root.querySelector('[data-vitals]'),
        huds: all('.rt-hud'),
    };
}

const webgl = (): boolean => {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') ?? c.getContext('webgl'));
};

/** Where each section sits; measured on resize, not every frame, so a frame never forces layout. */
type Layout = { tops: number[]; hs: number[] };
const measure = (els: Els): Layout => ({
    tops: els.secs.map((s) => s.offsetTop),
    hs: els.secs.map((s) => s.offsetHeight),
});

/** Scroll → which section, how far through it, and where on the route the request should be. Reads only. */
function scrollState(
    { tops, hs }: Layout,
    vh: number
): {
    y: number;
    vh: number;
    sec: number;
    q: (i: number) => number;
    pathU: (seg: number[]) => number;
    inView: (i: number) => boolean;
    /** How far from section i's top to the next section's top (0–1): the hop in the HUD. */
    hop: (i: number) => number;
} {
    const y = scrollY;
    let sec = 0;
    tops.forEach((t, i) => {
        if (y >= t - vh * 0.5) sec = i;
    });
    const q = (i: number): number => clamp((y - tops[i]) / Math.max(1, hs[i] - vh));
    const pathU = (seg: number[]): number => {
        for (let i = 0; i < 5; i++)
            if (y < tops[i + 1])
                return lerp(seg[i], seg[i + 1], clamp((y - tops[i]) / (tops[i + 1] - tops[i])));
        return 1;
    };
    const inView = (i: number): boolean => y >= tops[i] - vh * 0.4 && y < tops[i] + hs[i] - vh * 0.45;
    const hop = (i: number): number =>
        i + 1 < tops.length ? clamp((y - tops[i]) / Math.max(1, tops[i + 1] - tops[i])) : 1;
    return { y, vh, sec, q, pathU, inView, hop };
}

/** What this visit actually measured: the 200 OK shows real numbers, not a story's. */
function measured(lcp: number): string {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const js = performance
        .getEntriesByType('resource')
        .filter((r) => r.name.split('?')[0].endsWith('.js'))
        .reduce((sum, r) => {
            const t = r as PerformanceResourceTiming;
            return sum + (t.transferSize || t.encodedBodySize);
        }, 0);
    return [
        nav && nav.responseStart > 0 ? `first byte ${Math.round(nav.responseStart)} ms` : '',
        lcp > 0 ? `largest paint ${Math.round(lcp)} ms` : '',
        js > 0 ? `${Math.round(js / 1024)} kB of JavaScript` : '',
    ]
        .filter(Boolean)
        .join(' · ');
}

/** Labels follow rings and records on screen, but never sit on the text panel (`top` is its edge). */
function place(el: HTMLElement, m: Mark, show: boolean, small: boolean, top: number): void {
    const w = innerWidth;
    const h = innerHeight;
    const clear =
        m !== null &&
        (small
            ? m.y > 70 && m.y < Math.min(h * 0.42, top - 28) && m.x > 0 && m.x < w - 170
            : m.x > w * 0.52 && m.x < w - 220 && m.y > 60 && m.y < h - 60);
    el.classList.toggle('on', show && clear);
    if (show && clear && m) el.style.transform = `translate(${m.x + 14}px, ${m.y - 8}px)`;
}

export function drive(root: HTMLElement, canvas: HTMLCanvasElement, o: DriveOptions): () => void {
    const els = find(root);
    const small = matchMedia('(max-width: 760px)').matches;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Haptics only once the visitor has touched the page (the browser refuses them before).
    let coarse = false;
    const onTouch = (): void => {
        coarse = matchMedia('(pointer: coarse)').matches;
    };
    const pointer = { x: 0, y: 0 };
    const tilted = tilt(pointer, root.querySelector<HTMLButtonElement>('[data-tilt]'));
    const active = new Map<string, number>();
    let world: World | null = null;
    let phase: 'idle' | 'building' | 'live' | 'flat' = 'idle';
    let forced: number | null = null;
    let lastPick = -1;
    let forcedRecord: number | null = null;
    let lastRecord = -1;
    let raf = 0;
    let dead = false;
    // The stack: the rows never grow; the passing group's items sit in one slot (as tall as the
    // tallest group), moved beside its name with a transform on wide screens, so nothing shifts.
    let skillTops: number[] = [];
    const moveSkills = (idx: number): void => {
        if (els.skillBox) els.skillBox.style.transform = small ? '' : `translateY(${skillTops[idx] ?? 0}px)`;
    };
    const reserveSkills = (): void => {
        const wrap = els.skillBox?.parentElement;
        if (!wrap || !els.skillBox || small || !root.classList.contains('rt-js')) return;
        wrap.style.minHeight = '';
        skillTops = els.skills.map((li) => li.offsetTop);
        const reach = Math.max(...skillTops) + els.skillBox.offsetHeight;
        wrap.style.minHeight = `${Math.max(wrap.offsetHeight, reach)}px`;
        moveSkills(active.get('skills') ?? 0);
    };
    let layout = measure(els);
    let vh = innerHeight;
    let shownMs = -1;
    let vitalsDone = false;
    const remeasure = (): void => {
        reserveSkills();
        layout = measure(els);
        vh = innerHeight;
    };
    const resized = new ResizeObserver(remeasure);
    resized.observe(root);
    // Web fonts change line wraps: measure again once they are in.
    void document.fonts?.ready.then(() => !dead && remeasure());
    const fills = new Map<HTMLElement, string>();
    const fill = (el: HTMLElement, prop: string, v: number): void => {
        const val = v.toFixed(2);
        if (fills.get(el) === val) return;
        fills.set(el, val);
        el.style.setProperty(prop, val);
    };
    let lcp = 0;
    const lcpSeen = new PerformanceObserver((list) => {
        const last = list.getEntries().at(-1);
        if (last) lcp = last.startTime;
    });
    try {
        lcpSeen.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
        // not measured in this browser; the line leaves it out
    }
    let cutTimer = 0;
    // The project whose landscape the world is showing; its panel changes at the portal's flash,
    // with the world, not ahead of it as the scroll arrives.
    let shownProject: number | null = null;

    const setOn = (key: string, list: HTMLElement[], idx: number): void => {
        if (active.get(key) === idx) return;
        active.set(key, idx);
        list.forEach((el, i) => el.classList.toggle('on', i === idx));
    };
    const pick = (q: number, n: number): number => clamp(Math.floor(q * n), 0, n - 1);

    const build = async (): Promise<void> => {
        const { createWorld } = await import('@/components/round-trip/world');
        if (dead) return;
        world = createWorld({
            canvas,
            rings: o.rings,
            ringAt: o.ringAt,
            recordAt: o.recordAt,
            skills: o.skills,
            small,
            reduce,
        });
        phase = 'live';
    };
    const wake = (): void => {
        if (phase !== 'idle') return;
        if (!webgl()) {
            phase = 'flat';
            root.dataset.phase = phase;
            return;
        }
        phase = 'building';
        root.dataset.phase = phase;
        build()
            .catch(() => (phase = 'flat'))
            .then(() => (root.dataset.phase = phase));
    };

    const panels = (q: (i: number) => number): void => {
        const g = pick(q(2), els.skills.length);
        if (active.get('skills') !== g) moveSkills(g);
        setOn('skills', els.skills, g);
        setOn('skillItems', els.skillItems, g);
        const p = shownProject ?? pick(q(3), els.projects.length);
        if (p !== lastPick) forced = null;
        lastPick = p;
        setOn('projects', els.projects, forced ?? p);
        setOn('dots', els.dots, forced ?? p);
        // Each project's dot fills as the ship closes on its portal.
        const n = els.dots.length;
        const through = clamp(q(3) * n - p);
        els.dots.forEach((d, k) => fill(d, '--p', k < p ? 1 : k === p ? through : 0));
        const r = pick(q(4), els.records.length);
        if (r !== lastRecord) forcedRecord = null;
        lastRecord = r;
        setOn('records', els.records, forcedRecord ?? r);
        setOn('chips', els.chips, forcedRecord ?? r);
    };

    const hud = (sec: number, ms: number, hop: number): void => {
        // The wire to the next hop fills as the request travels it.
        els.route.forEach((li) => fill(li, '--fill', Number(li.dataset.r) === sec + 1 ? hop : 0));
        // Filled while the 200 OK panel is still off screen (from Data on), so nothing shifts.
        if (sec >= 4 && !vitalsDone && els.vitals) {
            vitalsDone = true;
            const line = measured(lcp);
            els.vitals.textContent = line && `Measured on this visit: ${line}.`;
            els.vitals.hidden = !line;
        }
        if (active.get('zone') !== sec) {
            active.set('zone', sec);
            shownMs = -1;
            // A tick in the hand at each hop while tilt is scrolling.
            if (tilted.scrolling()) navigator.vibrate?.(10);
            els.route.forEach((li) => {
                const r = Number(li.dataset.r);
                li.classList.toggle('on', r === sec);
                li.classList.toggle('past', r < sec);
                li.style.setProperty('--z', ZONES[r]);
                const a = li.querySelector('a');
                if (r === sec) a?.setAttribute('aria-current', 'step');
                else a?.removeAttribute('aria-current');
            });
        }
        if (ms === shownMs) return;
        shownMs = ms;
        const text = `· ${ms} ms`;
        const req = els.req?.querySelector('em');
        if (req) req.textContent = text;
        const tag = els.ms[sec];
        if (tag) tag.textContent = text;
    };

    // The cut: the scene swaps, so the panel blinks out of focus and the hand feels it, on the same beat.
    const cutBeat = (sec: number): void => {
        if (coarse) navigator.vibrate?.(20);
        if (reduce) return;
        const panel = els.secs[sec]?.querySelector('.rt-panel');
        panel?.classList.add('rt-cut');
        clearTimeout(cutTimer);
        cutTimer = window.setTimeout(() => panel?.classList.remove('rt-cut'), 120);
    };

    const draw = (s: ReturnType<typeof scrollState>, map: number, resp: number, top: number): void => {
        if (!world) return;
        const out: FrameOut = world.frame({ u: s.pathU(world.seg), map, resp, pointer, boost: 0, idle: 0 });
        const zone = out.place.split('#')[1];
        shownProject = s.sec === 3 && zone !== undefined ? Number(zone) : null;
        // Set on the two HUD bars only: a variable on the root would restyle the whole page each frame.
        els.huds.forEach((el) => fill(el, '--flash', out.flash));
        els.ringTags.forEach((el, k) => place(el, out.rings[k], s.sec === 3 && map < 0.1, small, top));
        els.recordTags.forEach((el, k) => place(el, out.records[k], s.sec === 4 && map < 0.1, small, top));
        const sound = o.sound();
        const panOf = (m: Mark): number => (m ? (m.x / innerWidth - 0.5) * 2 : 0);
        if (out.passed !== null) {
            sound?.ping(out.passed, panOf(out.rings[out.passed]));
            // A small tick in the hand as the request flies through a project's ring.
            if (coarse) navigator.vibrate?.(12);
        }
        if (out.jumped) {
            // A wind-up in the hand as the jump begins (the ring's tick stands in when it is the
            // same frame); the thump is timed to land on the cut.
            if (coarse && out.passed === null) navigator.vibrate?.(6);
            sound?.jump(out.lead);
        }
        if (out.cut) cutBeat(s.sec);
        sound?.wind(out.speed);
        sound?.engine(panOf(out.ship), Math.min(1, out.speed + out.rush));
        sound?.roar(out.rush);
        sound?.place(out.place);
        root.classList.add('rt-live');
    };

    const tick = (): void => {
        raf = requestAnimationFrame(tick);
        const s = scrollState(layout, vh);
        // Phones keep world labels clear of the panel: read its edge before this frame writes anything.
        const top =
            small && world
                ? (els.secs[s.sec]?.querySelector('.rt-panel')?.getBoundingClientRect().top ?? vh)
                : vh;
        els.secs.forEach((el, i) => el.classList.toggle('in', s.inView(i)));
        // Reveals are armed in the same frame the visible section is marked, so nothing blinks.
        if (!root.classList.contains('rt-js')) {
            root.classList.add('rt-js');
            reserveSkills();
        }
        root.classList.toggle('rt-scrolled', s.y > 40);
        if (s.y > 4) wake();
        panels(s.q);
        // The way out takes most of the last section: the climb, the cut at the halfway point of
        // `map`, the rise into orbit; only then does the ship turn and leave.
        const map = smooth(0, 0.8, s.q(5));
        const resp = 1 - smooth(0.55, 0.96, s.q(5));
        const toEnd = clamp(s.y / Math.max(1, layout.tops[5] ?? 1));
        hud(s.sec, Math.round(toEnd * 180 + (1 - resp) * 58), s.hop(s.sec));
        draw(s, map, resp, top);
    };

    const onKey = (e: KeyboardEvent): void => {
        if (SCROLL_KEYS.has(e.key)) wake();
    };
    const onPointer = (e: PointerEvent): void => {
        if (e.pointerType === 'touch') return; // phones steer by tilt
        pointer.x = (e.clientX / innerWidth - 0.5) * 2;
        pointer.y = (e.clientY / innerHeight - 0.5) * 2;
    };
    const onClick = (e: MouseEvent): void => {
        const start = (e.target as HTMLElement).closest<HTMLElement>('[data-start]');
        if (!start) return;
        if (start instanceof HTMLAnchorElement) e.preventDefault();
        wake();
        document
            .getElementById(start.dataset.start ?? '')
            ?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    };
    const onFocus = (e: FocusEvent): void => {
        // A keyboard user tabbing into a project or record that is not on screen brings it forward.
        const el = (e.target as HTMLElement).closest<HTMLElement>('[data-project], [data-record]');
        if (!el) return;
        if (el.hasAttribute('data-project')) forced = els.projects.indexOf(el);
        else forcedRecord = els.records.indexOf(el);
    };
    addEventListener('resize', remeasure);
    addEventListener('keydown', onKey);
    addEventListener('wheel', wake, { passive: true });
    addEventListener('touchstart', wake, { passive: true });
    addEventListener('touchstart', onTouch, { passive: true, once: true });
    addEventListener('pointermove', onPointer, { passive: true });
    root.addEventListener('click', onClick);
    root.addEventListener('focusin', onFocus);

    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1200));
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (!saveData) idle(() => void prefetchWorld().catch(() => undefined));
    raf = requestAnimationFrame(tick);

    return () => {
        dead = true;
        cancelAnimationFrame(raf);
        clearTimeout(cutTimer);
        lcpSeen.disconnect();
        resized.disconnect();
        removeEventListener('resize', remeasure);
        removeEventListener('keydown', onKey);
        removeEventListener('wheel', wake);
        removeEventListener('touchstart', wake);
        removeEventListener('touchstart', onTouch);
        removeEventListener('pointermove', onPointer);
        root.removeEventListener('click', onClick);
        root.removeEventListener('focusin', onFocus);
        tilted.stop();
        (world as World | null)?.dispose();
    };
}
