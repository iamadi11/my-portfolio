'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * The signature: an engineering drawing of the page, read live from the DOM.
 * Fine pointers get a loupe over the hero. Everyone gets the Inspect key (full-screen wipe).
 * One canvas, redrawn only when visible and something moved. No loop while idle.
 */

const SPEC = '#1f33e0';
const LINE = 'rgba(255, 255, 255, 0.94)';
const SOFT = 'rgba(255, 255, 255, 0.22)';
const FAINT = 'rgba(255, 255, 255, 0.07)';
const FOCUS = '#ffb38f';
const LENS = 116;
const INTRO_MS = 1700;
/** Share of the remaining distance covered per 60fps frame. Same feel as --ease. */
const FOLLOW = 0.2;

const SELECTOR = '[data-line], h2, h3, p, dt, dd, a, button, .ins-mark, section, .ins-tags li';

type Kind = 'stroke' | 'text' | 'target' | 'box' | 'section';
type Item = { el: Element; kind: Kind; label: string; font: string; upper: boolean; spacing: string };
type RGBA = [number, number, number, number];

function parse(value: string): RGBA | null {
    const n = value.match(/[\d.]+/g)?.map(Number);
    if (!n || n.length < 3) return null;
    const k = value.startsWith('color(') ? 255 : 1;
    return [n[0] * k, n[1] * k, n[2] * k, n[3] ?? 1];
}

function luminance([r, g, b]: RGBA): number {
    const lin = (c: number): number => {
        const v = c / 255;
        return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function backdrop(el: Element): RGBA {
    for (let node: Element | null = el; node; node = node.parentElement) {
        const c = parse(getComputedStyle(node).backgroundColor);
        if (c && c[3] > 0.5) return c;
    }
    return [241, 240, 236, 1];
}

function contrast(fg: string, el: Element): number {
    const a = parse(fg);
    if (!a) return 0;
    const [l1, l2] = [luminance(a), luminance(backdrop(el))].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
}

/** next/font names look like "__Barlow_Condensed_6b1e2c"; show the real family. */
const family = (stack: string): string =>
    stack
        .split(',')[0]
        .replace(/['"]/g, '')
        .replace(/^_+/, '')
        .replace(/_[0-9a-f]{5,}$/i, '')
        .replace(/_/g, ' ')
        .trim();

const grade = (ratio: number, size: number): string => {
    if (ratio >= 7) return 'AAA';
    return ratio >= 4.5 || (ratio >= 3 && size >= 24) ? 'AA' : 'below AA';
};

/** "h1 · Barlow Condensed 700 · 239/0.84 · 16.9:1 AAA", read from the element's real styles. */
function textLabel(el: Element, cs: CSSStyleDeclaration, tag: string): string {
    const size = parseFloat(cs.fontSize);
    const ratio = contrast(cs.color, el);
    const lh = cs.lineHeight === 'normal' ? 1.2 : parseFloat(cs.lineHeight) / size;
    return `${tag} · ${family(cs.fontFamily)} ${cs.fontWeight} · ${Math.round(size)}/${lh.toFixed(2)} · ${ratio.toFixed(1)}:1 ${grade(ratio, size)}`;
}

function describe(el: Element, labelLine: boolean): Item {
    const tag = el.tagName.toLowerCase();
    const cs = getComputedStyle(el);
    const base = {
        el,
        font: `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`,
        upper: cs.textTransform === 'uppercase',
        spacing: cs.letterSpacing,
    };
    if (tag === 'section') return { ...base, kind: 'section', label: `section#${el.id}` };
    if (el.classList.contains('ins-mark')) return { ...base, kind: 'box', label: 'svg' };
    if (tag === 'a' || tag === 'button') return { ...base, kind: 'target', label: tag };
    const isLine = el.hasAttribute('data-line');
    const label = isLine && !labelLine ? '' : textLabel(el, cs, isLine ? 'h1' : tag);
    return { ...base, kind: parseFloat(cs.fontSize) >= 28 ? 'stroke' : 'text', label };
}

function build(root: HTMLElement): Item[] {
    const els = Array.from(root.querySelectorAll(SELECTOR)).filter(
        (el) => !el.closest('.ins-dock, [popover]')
    );
    const firstLine = els.find((el) => el.hasAttribute('data-line'));
    return els.map((el) => describe(el, el === firstLine));
}

function lineRects(el: Element): DOMRect[] {
    const range = document.createRange();
    range.selectNodeContents(el);
    return Array.from(range.getClientRects()).filter((r) => r.width > 2 && r.height > 2);
}

function drawTag(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): void {
    if (!text) return;
    const w = ctx.measureText(text).width;
    const top = Math.max(2, y - 15);
    ctx.fillStyle = SPEC;
    ctx.fillRect(x - 1, top, w + 8, 14);
    ctx.fillStyle = LINE;
    ctx.fillText(text, x + 3, top + 10.5);
}

function strokeLine(ctx: CanvasRenderingContext2D, item: Item, rect: DOMRect): void {
    const text = (item.el.textContent ?? '').trim();
    ctx.save();
    ctx.font = item.font;
    if ('letterSpacing' in ctx && item.spacing !== 'normal') ctx.letterSpacing = item.spacing;
    const content = item.upper ? text.toUpperCase() : text;
    const ascent = ctx.measureText(content).fontBoundingBoxAscent || rect.height * 0.8;
    ctx.lineWidth = 1;
    ctx.strokeStyle = LINE;
    ctx.strokeText(content, rect.left, rect.top + ascent);
    ctx.restore();
}

const px = (n: number): number => Math.round(n) + 0.5;

/** 8px spacing unit (anchored to the document) and the page's real layout columns. */
function drawGrid(ctx: CanvasRenderingContext2D, root: HTMLElement, w: number, h: number): void {
    ctx.fillStyle = SPEC;
    ctx.fillRect(0, 0, w, h);
    ctx.beginPath();
    for (let y = -(window.scrollY % 8); y < h; y += 8) {
        ctx.moveTo(0, Math.round(y) + 0.5);
        ctx.lineTo(w, Math.round(y) + 0.5);
    }
    ctx.strokeStyle = FAINT;
    ctx.lineWidth = 1;
    ctx.stroke();

    const wrap = root.querySelector('.ins-wrap');
    if (!wrap) return;
    const r = wrap.getBoundingClientRect();
    const cs = getComputedStyle(wrap);
    const cols = parseInt(cs.getPropertyValue('--cols'), 10) || 12;
    const gap = parseFloat(cs.columnGap) || 0;
    const col = (r.width - gap * (cols - 1)) / cols;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.045)';
    for (let i = 0; i < cols; i++) ctx.fillRect(r.left + i * (col + gap), 0, col, h);
}

type Painter = (ctx: CanvasRenderingContext2D, item: Item, r: DOMRect, mono: string) => void;

const PAINT: Record<Kind, Painter> = {
    section(ctx, item, r) {
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = SOFT;
        ctx.strokeRect(px(r.left + 4), px(r.top), r.width - 8, r.height);
        ctx.setLineDash([]);
        const y = Math.min(Math.max(r.top + 18, 18), r.bottom - 4);
        drawTag(ctx, `${item.label} · ${Math.round(r.height)}px`, r.left + 10, y);
    },
    box(ctx, _item, r) {
        ctx.strokeStyle = LINE;
        ctx.strokeRect(px(r.left), px(r.top), r.width, r.height);
        ctx.strokeStyle = SOFT;
        ctx.beginPath();
        ctx.moveTo(r.left, r.top);
        ctx.lineTo(r.right, r.bottom);
        ctx.moveTo(r.right, r.top);
        ctx.lineTo(r.left, r.bottom);
        ctx.stroke();
        drawTag(ctx, `svg · ${Math.round(r.width)}×${Math.round(r.height)}`, r.left, r.top);
    },
    target(ctx, item, r, mono) {
        const ok = r.width >= 44 && r.height >= 44;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(r.left, r.top, r.width, r.height);
        ctx.strokeStyle = LINE;
        ctx.strokeRect(px(r.left), px(r.top), r.width, r.height);
        const lines = parseFloat(item.font.split(' ')[1]) >= 28 ? lineRects(item.el) : [];
        if (lines.length === 1) strokeLine(ctx, item, lines[0]);
        ctx.font = `500 10px ${mono}`;
        const size = `${Math.round(r.width)}×${Math.round(r.height)}`;
        drawTag(ctx, `${item.label} · ${size} ${ok ? '≥44 ✓' : '<44'}`, r.left, r.top);
    },
    stroke(ctx, item, r, mono) {
        const lines = lineRects(item.el);
        if (lines.length !== 1) {
            PAINT.text(ctx, item, r, mono);
            return;
        }
        ctx.setLineDash([2, 3]);
        ctx.strokeStyle = SOFT;
        ctx.strokeRect(px(lines[0].left), px(lines[0].top), lines[0].width, lines[0].height);
        ctx.setLineDash([]);
        strokeLine(ctx, item, lines[0]);
        ctx.font = `500 10px ${mono}`;
        drawTag(ctx, item.label, r.left, r.top);
    },
    text(ctx, item, r) {
        ctx.fillStyle = SOFT;
        for (const line of lineRects(item.el)) {
            const bar = Math.max(3, line.height * 0.42);
            ctx.fillRect(line.left, line.top + (line.height - bar) / 2, line.width, bar);
        }
        drawTag(ctx, item.label, r.left, r.top);
    },
};

function drawFocus(ctx: CanvasRenderingContext2D, root: HTMLElement): void {
    const focused = document.activeElement;
    if (!(focused instanceof HTMLElement) || !root.contains(focused) || !focused.matches(':focus-visible'))
        return;
    const r = focused.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.strokeStyle = FOCUS;
    ctx.strokeRect(r.left - 3, r.top - 3, r.width + 6, r.height + 6);
    ctx.lineWidth = 1;
    ctx.fillStyle = FOCUS;
    ctx.fillText('focus-visible', r.left, r.bottom + 16);
}

function draw(
    ctx: CanvasRenderingContext2D,
    items: Item[],
    root: HTMLElement,
    w: number,
    h: number,
    mono: string
): void {
    drawGrid(ctx, root, w, h);
    ctx.font = `500 10px ${mono}`;
    ctx.setLineDash([]);
    for (const item of items) {
        const r = item.el.getBoundingClientRect();
        if (r.width > 0 && r.bottom >= -24 && r.top <= h + 24) PAINT[item.kind](ctx, item, r, mono);
    }
    drawFocus(ctx, root);
}

type Spring = { x: number; y: number; r: number; tx: number; ty: number; tr: number };

/** Eases the loupe toward its target. Returns whether it is still moving. */
function follow(s: Spring, dt: number, reduce: boolean): boolean {
    const k = reduce ? 1 : 1 - (1 - FOLLOW) ** (dt / 16.7);
    s.x += (s.tx - s.x) * k;
    s.y += (s.ty - s.y) * k;
    s.r += (s.tr - s.r) * k;
    const moving = Math.abs(s.tx - s.x) > 0.3 || Math.abs(s.ty - s.y) > 0.3 || Math.abs(s.tr - s.r) > 0.3;
    if (!moving) Object.assign(s, { x: s.tx, y: s.ty, r: s.tr });
    return moving;
}

/** Name of the drawn element under the pointer, for the loupe readout. */
function under(x: number, y: number): string {
    const el = document.elementFromPoint(x, y)?.closest(SELECTOR);
    if (!el) return 'grid';
    return el.matches('[data-line]') ? 'h1' : el.tagName.toLowerCase();
}

export default function Lens(): React.JSX.Element {
    const [on, setOn] = useState(false);
    const layerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ringRef = useRef<HTMLDivElement>(null);
    const readoutRef = useRef<HTMLSpanElement>(null);
    const keyRef = useRef<HTMLButtonElement>(null);
    const setFull = useRef<(next: boolean) => void>(() => undefined);

    useEffect(() => {
        const root = document.querySelector<HTMLElement>('.ins-root');
        const layer = layerRef.current;
        const canvas = canvasRef.current;
        const ring = ringRef.current;
        const readout = readoutRef.current;
        const key = keyRef.current;
        const ctx = canvas?.getContext('2d');
        if (!root || !layer || !canvas || !ring || !readout || !key || !ctx) return undefined;

        const hero = root.querySelector('.ins-hero');
        const name = root.querySelector('.ins-name');
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        const mono =
            getComputedStyle(root).getPropertyValue('--font-geist-mono') || 'ui-monospace, monospace';

        const s: Spring = { x: 0, y: 0, r: 0, tx: 0, ty: 0, tr: 0 };
        let full = false;
        let items = build(root);
        let dirty = true;
        let raf = 0;
        let last = performance.now();
        let intro: { start: number; y: number; r: number } | null = null;
        let pointer: { x: number; y: number } | null = null;
        let w = 0;
        let h = 0;

        const size = (): void => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = window.innerWidth;
            h = window.innerHeight;
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            dirty = true;
        };

        const cover = (x: number, y: number): number =>
            Math.hypot(Math.max(x, w - x), Math.max(y, h - y)) + 2;

        const apply = (): void => {
            const visible = s.r > 0.5;
            layer.style.visibility = visible ? 'visible' : 'hidden';
            layer.style.clipPath = `circle(${s.r.toFixed(1)}px at ${s.x.toFixed(1)}px ${s.y.toFixed(1)}px)`;
            ring.style.opacity = visible && !full ? '1' : '0';
            ring.style.transform = `translate3d(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px, 0)`;
            ring.style.setProperty('--s', (s.r / LENS).toFixed(3));
        };

        /** The one-time scan across the name. Returns whether it is still running. */
        const stepIntro = (now: number, run: { start: number; y: number; r: number }): boolean => {
            const t = Math.min(1, Math.max(0, (now - run.start) / INTRO_MS));
            const e = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
            const grow = Math.min(1, t / 0.14) * Math.min(1, (1 - t) / 0.14);
            Object.assign(s, { x: -run.r + (w + run.r * 2) * e, y: run.y, r: run.r * grow });
            Object.assign(s, { tx: s.x, ty: s.y, tr: s.r });
            readout.textContent = 'scanning · drawing';
            if (t < 1) return true;
            intro = null;
            s.r = s.tr = 0;
            key.classList.add('is-hint');
            window.setTimeout(() => key.classList.remove('is-hint'), 2400);
            return false;
        };

        const frame = (now: number): void => {
            raf = 0;
            const dt = Math.min(64, now - last);
            last = now;
            const moving = intro ? stepIntro(now, intro) : follow(s, dt, reduce);
            apply();
            if (s.r > 0.5 && dirty) {
                draw(ctx, items, root, w, h, mono);
                dirty = false;
            }
            if (pointer && !full && s.r > 0.5) {
                readout.textContent = `${under(pointer.x, pointer.y)} · ${Math.round(pointer.x)}, ${Math.round(pointer.y)}`;
            }
            if (moving && !raf) raf = requestAnimationFrame(frame);
        };

        const schedule = (): void => {
            if (!raf) raf = requestAnimationFrame(frame);
        };

        setFull.current = (next: boolean): void => {
            if (next === full) return;
            full = next;
            intro = null;
            const k = key.getBoundingClientRect();
            const cx = k.left + k.width / 2;
            const cy = k.top + k.height / 2;
            if (full) Object.assign(s, { x: cx, y: cy });
            Object.assign(s, { tx: cx, ty: cy, tr: full ? cover(cx, cy) : 0 });
            dirty = true;
            schedule();
        };

        const onMove = (event: PointerEvent): void => {
            if (full || event.pointerType !== 'mouse') return;
            pointer = { x: event.clientX, y: event.clientY };
            const box = hero?.getBoundingClientRect();
            const inside = !!box && event.clientY >= box.top && event.clientY <= box.bottom;
            if (inside && intro) intro = null;
            if (intro) return;
            if (inside && s.r < 1) Object.assign(s, { x: pointer.x, y: pointer.y });
            Object.assign(s, { tx: pointer.x, ty: pointer.y, tr: inside ? LENS : 0 });
            schedule();
        };
        const onLeave = (): void => {
            if (full || intro) return;
            pointer = null;
            s.tr = 0;
            schedule();
        };
        const onScroll = (): void => {
            dirty = true;
            if (intro && window.scrollY > 40) {
                intro = null;
                s.tr = 0;
            }
            if (s.r > 0.5 || s.tr > 0) schedule();
        };
        const onResize = (): void => {
            size();
            items = build(root);
            if (full) {
                const k = key.getBoundingClientRect();
                s.r = s.tr = cover(k.left + k.width / 2, k.top + k.height / 2);
            }
            schedule();
        };
        const onFocus = (): void => {
            dirty = true;
            if (s.r > 0.5) schedule();
        };
        const onKey = (event: KeyboardEvent): void => {
            if (event.key !== 'Escape' || !full) return;
            if (document.querySelector(':popover-open')) return;
            setOn(false);
        };

        size();
        apply();
        const resized = new ResizeObserver(() => {
            items = build(root);
            dirty = true;
            if (s.r > 0.5) schedule();
        });
        resized.observe(root);

        if (fine) {
            window.addEventListener('pointermove', onMove, { passive: true });
            document.documentElement.addEventListener('pointerleave', onLeave);
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize);
        document.addEventListener('focusin', onFocus);
        document.addEventListener('keydown', onKey);

        let cancelled = false;
        document.fonts.ready.then(() => {
            if (cancelled) return;
            items = build(root);
            dirty = true;
            const box = name?.getBoundingClientRect();
            if (reduce || !box || window.scrollY > 40 || document.hidden || root.dataset.intro === 'off')
                return;
            const r = Math.min(Math.max(Math.min(w, h) * 0.2, 84), 180);
            // Let the page settle first; the scan reads as the page measuring itself.
            intro = { start: Math.max(performance.now() + 250, 900), y: box.top + box.height / 2, r };
            last = performance.now();
            schedule();
        });

        return () => {
            cancelled = true;
            cancelAnimationFrame(raf);
            resized.disconnect();
            window.removeEventListener('pointermove', onMove);
            document.documentElement.removeEventListener('pointerleave', onLeave);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onResize);
            document.removeEventListener('focusin', onFocus);
            document.removeEventListener('keydown', onKey);
            setFull.current = () => undefined;
        };
    }, []);

    useEffect(() => {
        setFull.current(on);
    }, [on]);

    return (
        <>
            <button
                ref={keyRef}
                type="button"
                className="ins-key ins-inspect"
                aria-pressed={on}
                aria-describedby="ins-inspect-hint"
                onClick={() => setOn((value) => !value)}
            >
                <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                    <circle cx="8.5" cy="8.5" r="5.5" />
                    <path d="M12.6 12.6 17 17M8.5 5.5v6M5.5 8.5h6" />
                </svg>
                Inspect
            </button>
            <span id="ins-inspect-hint" className="ins-sr">
                Shows the drawing under the page: boxes, type sizes, contrast and target sizes.
            </span>
            <div ref={layerRef} className="ins-spec" aria-hidden="true">
                <canvas ref={canvasRef} />
            </div>
            <div ref={ringRef} className="ins-loupe" aria-hidden="true">
                <span ref={readoutRef} className="ins-loupe-readout" />
            </div>
        </>
    );
}
