import { clamp, lerp, smooth } from '@/components/round-trip/math';
import type { Sound } from '@/components/round-trip/sound';
import { tilt } from '@/components/round-trip/tilt';
import type { FrameOut, Mark, World } from '@/components/round-trip/world';

/** three.js and the world live in a separate chunk: fetched on idle, built on the first scroll or Start. */
const prefetchWorld = (): Promise<unknown> => import('@/components/round-trip/world');

export type DriveOptions = {
    /** Project titles, for the title card of each landscape. */
    titles: string[];
    rings: string[];
    ringAt: number[];
    recordAt: number[];
    sound: () => Sound | null;
};

type Els = {
    secs: HTMLElement[];
    route: HTMLElement[];
    req: HTMLElement | null;
    ms: Array<HTMLElement | null>;
    skills: HTMLElement[];
    projects: HTMLElement[];
    dots: HTMLElement[];
    records: HTMLElement[];
    chips: HTMLElement[];
    ringTags: HTMLElement[];
    recordTags: HTMLElement[];
    slate: HTMLElement | null;
};

/** Where each stop is, for the title card that opens it (the hero and space need none). */
const PLACES: Record<string, [hop: number, name: string]> = {
    city: [2, 'Night city'],
    grass: [3, 'Grassland'],
    desert: [3, 'Dunes'],
    canyon: [3, 'Canyon'],
    alpine: [3, 'Peaks'],
    volcano: [3, 'Lava fields'],
    ocean: [4, 'Open sea'],
    ice: [4, 'Pack ice'],
    orbit: [5, 'Orbit, sunrise'],
};
const HOPS = ['Browser', 'Wire', 'Edge', 'Services', 'Data', '200 OK'];

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
        projects: all('[data-project]'),
        dots: all('[data-dot]'),
        records: all('[data-record]'),
        chips: all('[data-chip]'),
        ringTags: all('[data-ring-tag]'),
        recordTags: all('[data-record-tag]'),
        slate: root.querySelector('[data-slate]'),
    };
}

const webgl = (): boolean => {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') ?? c.getContext('webgl'));
};

/** Scroll → which section, how far through it, and where on the route the request should be. */
function scrollState(els: Els): {
    y: number;
    vh: number;
    sec: number;
    q: (i: number) => number;
    pathU: (seg: number[]) => number;
} {
    const y = scrollY;
    const vh = innerHeight;
    const tops = els.secs.map((s) => s.offsetTop);
    const hs = els.secs.map((s) => s.offsetHeight);
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
    els.secs.forEach((s, i) =>
        s.classList.toggle('in', y >= tops[i] - vh * 0.4 && y < tops[i] + hs[i] - vh * 0.45)
    );
    return { y, vh, sec, q, pathU };
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
    let lastPlace: string | null = null;
    let raf = 0;
    let dead = false;

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
            small,
            reduce,
        });
        phase = 'live';
    };
    const wake = (): void => {
        if (phase !== 'idle') return;
        if (!webgl()) {
            phase = 'flat';
            return;
        }
        phase = 'building';
        build().catch(() => (phase = 'flat'));
    };

    const panels = (q: (i: number) => number): void => {
        setOn('skills', els.skills, pick(q(2), els.skills.length));
        const p = pick(q(3), els.projects.length);
        if (p !== lastPick) forced = null;
        lastPick = p;
        setOn('projects', els.projects, forced ?? p);
        setOn('dots', els.dots, forced ?? p);
        const r = pick(q(4), els.records.length);
        setOn('records', els.records, r);
        setOn('chips', els.chips, r);
    };

    const hud = (sec: number, ms: number): void => {
        if (active.get('zone') !== sec) {
            active.set('zone', sec);
            // A tick in the hand at each hop while tilt is scrolling.
            if (tilted.scrolling()) navigator.vibrate?.(10);
            els.route.forEach((li) => {
                const r = Number(li.dataset.r);
                li.classList.toggle('on', r === sec);
                li.classList.toggle('past', r < sec);
                li.style.setProperty('--z', ZONES[r]);
            });
        }
        const text = `${ms} ms`;
        const req = els.req?.querySelector('em');
        if (req) req.textContent = `· ${text}`;
        const tag = els.ms[sec];
        if (tag) tag.textContent = `· ${text}`;
    };

    /** A title card as each new place comes on screen: hop, place, and the project it holds. */
    const slate = (stop: string): void => {
        if (stop === lastPlace) return;
        const first = lastPlace === null;
        lastPlace = stop;
        const [kind, zone] = stop.split('#');
        const at = PLACES[kind];
        const el = els.slate;
        if (first || !at || !el) return;
        const [hop, name] = at;
        const k = zone === undefined ? -1 : Number(zone);
        const title = k >= 0 ? o.titles[k] : '';
        const count = k >= 0 ? ` · ${k + 1}/${o.titles.length}` : '';
        el.children[0].textContent = `${String(hop).padStart(2, '0')} · ${HOPS[hop]}${count}`;
        el.children[1].textContent = title ? `${name} · ${title}` : name;
        el.classList.remove('on');
        void el.offsetWidth;
        el.classList.add('on');
    };

    const draw = (s: ReturnType<typeof scrollState>, map: number, resp: number): void => {
        if (!world) return;
        const out: FrameOut = world.frame({ u: s.pathU(world.seg), map, resp, pointer });
        slate(out.place);
        const top = small
            ? (els.secs[s.sec]?.querySelector('.rt-panel')?.getBoundingClientRect().top ?? innerHeight)
            : innerHeight;
        els.ringTags.forEach((el, k) => place(el, out.rings[k], s.sec === 3 && map < 0.1, small, top));
        els.recordTags.forEach((el, k) => place(el, out.records[k], s.sec === 4 && map < 0.1, small, top));
        const sound = o.sound();
        const panOf = (m: Mark): number => (m ? (m.x / innerWidth - 0.5) * 2 : 0);
        if (out.passed !== null) {
            sound?.ping(out.passed, panOf(out.rings[out.passed]));
            // A small tick in the hand as the request flies through a project's ring.
            if (coarse) navigator.vibrate?.(12);
        }
        // A longer pulse in the hand as the ship jumps to the next place.
        if (out.jumped && coarse) navigator.vibrate?.([8, 30, 16]);
        if (out.jumped) sound?.jump();
        sound?.wind(out.speed);
        sound?.engine(panOf(out.ship), Math.min(1, out.speed + out.rush));
        sound?.roar(out.rush);
        sound?.place(out.place);
        root.classList.add('rt-live');
    };

    const tick = (): void => {
        raf = requestAnimationFrame(tick);
        const s = scrollState(els);
        // Reveals are armed in the same frame the visible section is marked, so nothing blinks.
        root.classList.add('rt-js');
        root.classList.toggle('rt-scrolled', s.y > 40);
        if (s.y > 4) wake();
        panels(s.q);
        // The way out takes most of the last section: the climb, the cut at the halfway point of
        // `map`, the rise into orbit; only then does the ship turn and leave.
        const map = smooth(0, 0.8, s.q(5));
        const resp = 1 - smooth(0.55, 0.96, s.q(5));
        const toEnd = clamp(s.y / Math.max(1, els.secs[5]?.offsetTop ?? 1));
        hud(s.sec, Math.round(toEnd * 180 + (1 - resp) * 58));
        draw(s, map, resp);
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
        wake();
        document
            .getElementById(start.dataset.start ?? '')
            ?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    };
    const onFocus = (e: FocusEvent): void => {
        // A keyboard user tabbing into a project that is not on screen brings it forward.
        const el = (e.target as HTMLElement).closest<HTMLElement>('[data-project]');
        if (el) forced = els.projects.indexOf(el);
    };
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
