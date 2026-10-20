import { clamp, lerp, smooth } from '@/components/round-trip/math';
import type { Sound } from '@/components/round-trip/sound';
import { push, type Push, tilt } from '@/components/round-trip/tilt';
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
    handoff: HTMLElement | null;
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
        handoff: root.querySelector('[data-handoff]'),
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

/**
 * The portal's signature: on the cut into a project's landscape, its title shows large in the
 * ring's colour in the middle of the flash, then flies into the panel's own heading while the new
 * place resolves. A fixed overlay moved by transform and opacity only, so nothing on the page shifts.
 */
function handoff(el: HTMLElement, h3: HTMLElement, colour: string): void {
    const box = h3.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(h3);
    const text = range.getBoundingClientRect();
    // The incoming item rises 10px as it comes on: land where it will be, not where it is.
    const top = box.top - (h3.closest('.on') ? 0 : 10);
    const ox = text.left - box.left + text.width / 2;
    const oy = text.top - box.top + text.height / 2;
    el.textContent = h3.textContent;
    Object.assign(el.style, {
        left: `${box.left}px`,
        top: `${top}px`,
        width: `${box.width}px`,
        color: colour,
        transformOrigin: `${ox}px ${oy}px`,
    });
    const k = clamp((innerWidth * 0.8) / Math.max(1, text.width), 1, 2.4);
    const big = `translate(${innerWidth / 2 - box.left - ox}px, ${innerHeight / 2 - top - oy}px) scale(${k})`;
    document.querySelectorAll('.rt-handing').forEach((h) => {
        h.getAnimations().forEach((a) => a.cancel());
        h.classList.remove('rt-handing');
    });
    el.getAnimations().forEach((a) => a.cancel());
    const timing = { duration: 760 };
    el.animate(
        [
            { transform: big, opacity: 0 },
            { transform: big, opacity: 1, offset: 0.12, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
            { transform: 'none', opacity: 1, offset: 0.88 },
            { transform: 'none', opacity: 0 },
        ],
        timing
    );
    // The real heading, hidden meanwhile, fades back in under the copy as it lands (same clock).
    h3.classList.add('rt-handing');
    h3.animate([{ opacity: 0 }, { opacity: 0, offset: 0.82 }, { opacity: 1 }], timing).onfinish = () =>
        h3.classList.remove('rt-handing');
}

/** Where J and K stop: each section's top, then each project's landscape and each record's stretch. */
function stopsOf({ tops, hs }: Layout, ringAt: number[], recordAt: number[], end: number): number[] {
    // Item k's stretch begins halfway between mark k-1 and mark k; the first begins at the top.
    const within = (i: number, at: number[]): number[] =>
        at.slice(1).map((a, k) => tops[i] + (hs[i] * (at[k] + a)) / 2);
    const ys = [...tops, ...within(3, ringAt), ...within(4, recordAt), end]
        .map(Math.round)
        .sort((a, b) => a - b);
    return ys.filter((y, i) => i === 0 || y - ys[i - 1] > 40);
}

const FIELD = 'input, textarea, select, [contenteditable]';
/** A press here is not a press on the world. */
const NOT_WORLD = 'a, button, summary, .rt-panel, .rt-hud';
const BOOST = 2200;

type Count = { head: string; from: number; to: number; dp: number; tail: string; minus: string };

/**
 * How an impact value counts, from the endpoints its own string states: the last number moves,
 * from the first one ("70% → 15%": 70 to 15; "15 → 3 min": 15 to 3) or from 0 when it is alone
 * ("200+": 0 to 200; "−30%": 0 to −30). Null when there is no number to count.
 */
function countOf(v: string): Count | null {
    const nums = [...v.matchAll(/\d+(?:\.\d+)?/g)];
    const last = nums.at(-1);
    if (!last) return null;
    // A sign belongs to a number only at the start or after a space ("−30%", not "2-3").
    const signOf = (m: RegExpMatchArray): string => {
        const i = m.index ?? 0;
        return /[−-]/.test(v[i - 1] ?? '') && (i === 1 || /\s/.test(v[i - 2] ?? '')) ? v[i - 1] : '';
    };
    const valueOf = (m: RegExpMatchArray): number => (signOf(m) ? -1 : 1) * Number(m[0]);
    const at = last.index ?? 0;
    const sign = signOf(last);
    return {
        head: v.slice(0, at - sign.length),
        from: nums.length > 1 ? valueOf(nums[0]) : 0,
        to: valueOf(last),
        dp: last[0].split('.')[1]?.length ?? 0,
        tail: v.slice(at + last[0].length),
        minus: sign || '−',
    };
}

/** The value at t (0–1) of the count; a trailing "+" only once it has landed. */
function countAt(c: Count, t: number): string {
    const x = lerp(c.from, c.to, 1 - Math.pow(1 - t, 3));
    const mag = Math.abs(x).toFixed(c.dp);
    const sign = x < 0 && Number(mag) !== 0 ? c.minus : '';
    return c.head + sign + mag + (t < 1 ? c.tail.replace(/\+$/, '') : c.tail);
}

/**
 * Wire: each impact value counts up as the section comes on. The real value stays in the DOM
 * (hidden from sight, not from screen readers) and the moving digits sit over it, aria-hidden,
 * so the box never changes size and the text that is read is always the one in site.ts.
 */
function counter(dds: HTMLElement[]): { run: () => void; stop: () => void } {
    const items = dds.flatMap((dd) => {
        const c = countOf(dd.querySelector('span')?.textContent ?? '');
        const tick = dd.querySelector<HTMLElement>('.rt-tick');
        return c && tick ? [{ dd, c, tick }] : [];
    });
    let raf = 0;
    let t0 = 0;
    const frame = (now: number): void => {
        let busy = false;
        items.forEach(({ dd, c, tick }, i) => {
            // In step with the stagger of the fade that brings each one in.
            const t = clamp((now - t0 - (i + 1) * 60 - 120) / 1200);
            const done = t >= 1;
            dd.classList.toggle('rt-counting', !done);
            tick.textContent = done ? '' : countAt(c, t);
            busy ||= !done;
        });
        raf = busy ? requestAnimationFrame(frame) : 0;
    };
    return {
        run: () => {
            cancelAnimationFrame(raf);
            t0 = performance.now();
            raf = requestAnimationFrame(frame);
        },
        stop: () => cancelAnimationFrame(raf),
    };
}

/** The trip's real clock, e.g. "1 min 12 s". */
const clockText = (ms: number): string => {
    const t = Math.floor(ms / 1000);
    return t < 60 ? `${t} s` : `${Math.floor(t / 60)} min ${t % 60} s`;
};

/** How still the visitor has been, from what they last did: 0 until 4 s, rising to 1 by 7 s. */
function stillness(): { idle: () => number; touched: () => void; stop: () => void } {
    let last = performance.now();
    let angle = 0;
    const touched = (): void => {
        last = performance.now();
    };
    // A phone in the hand is never quite still: only a turn of a couple of degrees counts.
    const onOrient = (e: DeviceOrientationEvent): void => {
        const a = (e.beta ?? 0) + (e.gamma ?? 0);
        if (Math.abs(a - angle) < 2) return;
        angle = a;
        touched();
    };
    const kinds = ['scroll', 'pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'];
    kinds.forEach((k) => addEventListener(k, touched, { passive: true }));
    addEventListener('deviceorientation', onOrient);
    return {
        idle: () => smooth(4, 7, (performance.now() - last) / 1000),
        touched,
        stop: () => {
            kinds.forEach((k) => removeEventListener(k, touched));
            removeEventListener('deviceorientation', onOrient);
        },
    };
}

const plainKey = (e: KeyboardEvent): string | null => {
    const k = e.key.toLowerCase();
    if (k !== 'j' && k !== 'k') return null;
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return null;
    return (e.target as Element | null)?.closest?.(FIELD) ? null : k;
};

/** The panels' text is not clickable (it lets presses through to the world), so test where it is. */
const overPanel = (root: HTMLElement, x: number, y: number): boolean =>
    [...root.querySelectorAll('.rt-sec.in .rt-panel')].some((el) => {
        const r = el.getBoundingClientRect();
        return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    });

type Hands = { stop: () => void };

/**
 * J and K step between stops. Holding J, or pressing and holding on the world (a mouse for
 * 180 ms; a finger for 350 ms without moving), boosts until let go. Reduced motion: a hold on the
 * world steps to the next stop instead, and holding J does nothing more than its first step.
 */
function hands(
    root: HTMLElement,
    page: Push,
    reduce: boolean,
    step: (dir: 1 | -1) => void,
    onInput: () => void
): Hands {
    let timer = 0;
    let held = false;
    let down: { id: number; x: number; y: number } | null = null;
    const start = (): void => {
        held = true;
        if (reduce) step(1);
        else page.aim('boost', BOOST, 2.5);
    };
    const end = (): void => {
        clearTimeout(timer);
        down = null;
        if (held && !reduce) page.aim('boost', 0, 5);
        held = false;
    };
    const onKeyDown = (e: KeyboardEvent): void => {
        const k = plainKey(e);
        if (!k) return;
        e.preventDefault();
        onInput();
        if (e.repeat) return;
        step(k === 'j' ? 1 : -1);
        clearTimeout(timer);
        if (k === 'j' && !reduce) timer = window.setTimeout(start, 350);
    };
    const onKeyUp = (e: KeyboardEvent): void => {
        if (e.key.toLowerCase() === 'j') end();
    };
    const onDown = (e: PointerEvent): void => {
        if (!e.isPrimary || e.button !== 0) return;
        if ((e.target as Element).closest(NOT_WORLD) || overPanel(root, e.clientX, e.clientY)) return;
        down = { id: e.pointerId, x: e.clientX, y: e.clientY };
        clearTimeout(timer);
        timer = window.setTimeout(start, e.pointerType === 'mouse' ? 180 : 350);
    };
    const onMove = (e: PointerEvent): void => {
        // A finger that moves is swiping, not holding.
        if (!down || e.pointerId !== down.id || e.pointerType === 'mouse') return;
        if (Math.hypot(e.clientX - down.x, e.clientY - down.y) >= 8) end();
    };
    const onUp = (e: PointerEvent): void => {
        if (down?.id === e.pointerId) end();
    };
    const onMenu = (e: Event): void => {
        if (down || held) e.preventDefault();
    };
    addEventListener('keydown', onKeyDown);
    addEventListener('keyup', onKeyUp);
    addEventListener('blur', end);
    root.addEventListener('pointerdown', onDown);
    addEventListener('pointermove', onMove, { passive: true });
    addEventListener('pointerup', onUp);
    addEventListener('pointercancel', onUp);
    root.addEventListener('contextmenu', onMenu);
    return {
        stop: () => {
            end();
            removeEventListener('keydown', onKeyDown);
            removeEventListener('keyup', onKeyUp);
            removeEventListener('blur', end);
            root.removeEventListener('pointerdown', onDown);
            removeEventListener('pointermove', onMove);
            removeEventListener('pointerup', onUp);
            removeEventListener('pointercancel', onUp);
            root.removeEventListener('contextmenu', onMenu);
        },
    };
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
    const page = push();
    const tilted = tilt(pointer, root.querySelector<HTMLButtonElement>('[data-tilt]'), page);
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
    let shownClock = '';
    // Real time on the trip: from the first scroll (or Start) until the ship has left.
    let started = 0;
    let ended = 0;
    const still = stillness();
    const counts = counter([...root.querySelectorAll<HTMLElement>('[data-count]')]);
    let wireIn = false;
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

    const hud = (sec: number, clock: string, hop: number): void => {
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
            shownClock = '';
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
        if (clock === shownClock) return;
        shownClock = clock;
        const text = `· ${clock}`;
        const req = els.req?.querySelector('em');
        if (req) req.textContent = text;
        const tag = els.ms[sec];
        if (tag) tag.textContent = text;
    };

    // The cut: the scene swaps, so the panel blinks out of focus and the hand feels it, on the same
    // beat; into a project's landscape, its title is handed from the flash to the panel.
    const cutBeat = (sec: number, zone: string | undefined): void => {
        if (coarse) navigator.vibrate?.(20);
        if (reduce) return;
        const h3 = zone === undefined ? null : els.projects[Number(zone)]?.querySelector<HTMLElement>('h3');
        if (sec === 3 && h3 && els.handoff) handoff(els.handoff, h3, o.rings[Number(zone)] ?? '#fff');
        const panel = els.secs[sec]?.querySelector('.rt-panel');
        panel?.classList.add('rt-cut');
        clearTimeout(cutTimer);
        cutTimer = window.setTimeout(() => panel?.classList.remove('rt-cut'), 120);
    };

    const draw = (s: ReturnType<typeof scrollState>, map: number, resp: number, top: number): void => {
        if (!world) return;
        const boost = clamp(page.speed('boost') / BOOST);
        const idle = reduce ? 0 : still.idle();
        const out: FrameOut = world.frame({ u: s.pathU(world.seg), map, resp, pointer, boost, idle });
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
        if (out.cut) cutBeat(s.sec, zone);
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
        if (s.inView(1) && !wireIn && !reduce) counts.run();
        wireIn = s.inView(1);
        // Reveals are armed in the same frame the visible section is marked, so nothing blinks.
        if (!root.classList.contains('rt-js')) {
            root.classList.add('rt-js');
            reserveSkills();
        }
        root.classList.toggle('rt-scrolled', s.y > 40);
        if (s.y > 4) wake();
        // Boosting into the end of the page stops there.
        if (s.y >= layout.tops[5] + layout.hs[5] - vh - 2) page.halt('boost');
        panels(s.q);
        // The way out takes most of the last section: the climb, the cut at the halfway point of
        // `map`, the rise into orbit; only then does the ship turn and leave.
        const map = smooth(0, 0.8, s.q(5));
        const resp = 1 - smooth(0.55, 0.96, s.q(5));
        const now = performance.now();
        if (s.y > 4 && !started) started = now;
        // The ship has left: the clock stops, and Send again comes up.
        const left = resp < 0.02;
        ended = left ? ended || now : 0;
        root.classList.toggle('rt-left', left);
        hud(s.sec, clockText(started ? (ended || now) - started : 0), s.hop(s.sec));
        draw(s, map, resp, top);
    };

    // J and K: the next stop from where a smooth scroll is heading, not from where it has got to.
    let aim: { y: number; at: number } | null = null;
    const step = (dir: 1 | -1): void => {
        wake();
        const ys = stopsOf(layout, o.ringAt, o.recordAt, document.documentElement.scrollHeight - vh);
        const from = aim && performance.now() - aim.at < 1000 ? aim.y : scrollY;
        const to = dir > 0 ? ys.find((y) => y > from + 4) : [...ys].reverse().find((y) => y < from - 4);
        if (to === undefined) return;
        aim = { y: to, at: performance.now() };
        scrollTo({ top: to, behavior: reduce ? 'instant' : 'smooth' });
    };
    const held = hands(root, page, reduce, step, still.touched);

    // Send again: the screen goes dark, the page goes back to the top under it, the trip restarts.
    let veilTimer = 0;
    const again = (): void => {
        const home = (): void => {
            scrollTo({ top: 0, behavior: 'instant' });
            started = 0;
            ended = 0;
            root.querySelector<HTMLElement>('.rt-cue [data-start]')?.focus({ preventScroll: true });
            root.classList.remove('rt-veil');
        };
        clearTimeout(veilTimer);
        if (reduce) {
            home();
            return;
        }
        root.classList.add('rt-veil');
        veilTimer = window.setTimeout(home, 300);
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
        if ((e.target as HTMLElement).closest('[data-again]')) {
            again();
            return;
        }
        const start = (e.target as HTMLElement).closest<HTMLElement>('[data-start]');
        if (!start) return;
        if (start instanceof HTMLAnchorElement) e.preventDefault();
        wake();
        document
            .getElementById(start.dataset.start ?? '')
            ?.scrollIntoView({ behavior: reduce ? 'instant' : 'smooth' });
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
        clearTimeout(veilTimer);
        still.stop();
        counts.stop();
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
        held.stop();
        page.stop();
        (world as World | null)?.dispose();
    };
}
