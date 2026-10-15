'use client';

import { useEffect } from 'react';

/**
 * Small enhancements on top of server HTML. Everything here is optional:
 * without it the page still reads, links work, and spec sheets open (native popover).
 */
export default function Behavior(): null {
    useEffect(() => {
        const root = document.querySelector<HTMLElement>('.ins-root');
        if (!root) return undefined;
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Draw-in once; ambient motion only while on screen.
        const reveal = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue;
                    entry.target.classList.add('is-in');
                    reveal.unobserve(entry.target);
                }
            },
            { rootMargin: '0px 0px -12% 0px' }
        );
        const live = new IntersectionObserver((entries) => {
            for (const entry of entries) entry.target.classList.toggle('is-live', entry.isIntersecting);
        });
        root.querySelectorAll('[data-reveal], .ins-plate-art').forEach((node) => reveal.observe(node));
        root.querySelectorAll('.ins-mark').forEach((node) => live.observe(node));

        // Annotations show real measurements of this layout.
        const measure = (): void => {
            const lines = root.querySelectorAll('.ins-name [data-line]');
            let width = 0;
            lines.forEach((line) => {
                const range = document.createRange();
                range.selectNodeContents(line);
                width = Math.max(width, range.getBoundingClientRect().width);
            });
            const dim = root.querySelector<HTMLElement>('.ins-dim');
            const value = root.querySelector('[data-measure="name"]');
            if (dim && value && width) {
                dim.style.setProperty('--dim-w', `${Math.round(width)}px`);
                value.textContent = `${Math.round(width)} px`;
            }
            // Construction lines: cap height and baseline of the name, from the font's own metrics.
            const name = root.querySelector<HTMLElement>('.ins-name');
            const first = lines[0];
            const pen = document.createElement('canvas').getContext('2d');
            if (name && first && pen) {
                const cs = getComputedStyle(first);
                pen.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
                const m = pen.measureText('H');
                const base =
                    (parseFloat(cs.lineHeight) - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 +
                    m.fontBoundingBoxAscent;
                name.style.setProperty('--base', `${base.toFixed(1)}px`);
                name.style.setProperty('--cap', `${(base - m.actualBoundingBoxAscent).toFixed(1)}px`);
                name.classList.add('is-measured');
            }
            root.querySelectorAll('[data-measure="section"]').forEach((node) => {
                const section = node.closest('section');
                if (section) node.textContent = `${Math.round(section.getBoundingClientRect().height)} px`;
            });
        };
        const resized = new ResizeObserver(measure);
        resized.observe(root);
        document.fonts.ready.then(measure);

        // Spec sheets: the plate's drawing morphs into the sheet where View Transitions exist.
        const invokers = new Map<Element, HTMLElement>();
        const onClick = (event: MouseEvent): void => {
            const target = event.target instanceof Element ? event.target : null;
            const opener = target?.closest<HTMLButtonElement>('[data-spec-open]');
            if (opener) {
                const id = opener.dataset.specOpen;
                const sheet = document.getElementById(`${id}-spec`);
                const from = root.querySelector<HTMLElement>(`[data-art="${id}"]`);
                const to = root.querySelector<HTMLElement>(`[data-sheet-art="${id}"]`);
                if (!sheet) return;
                invokers.set(sheet, opener);
                if (
                    reduce ||
                    !from ||
                    !to ||
                    !document.startViewTransition ||
                    sheet.matches(':popover-open')
                ) {
                    return;
                }
                event.preventDefault();
                from.style.viewTransitionName = 'ins-spec-art';
                const transition = document.startViewTransition(() => {
                    from.style.viewTransitionName = '';
                    to.style.viewTransitionName = 'ins-spec-art';
                    sheet.showPopover();
                });
                transition.finished.finally(() => {
                    to.style.viewTransitionName = '';
                });
                return;
            }

            const copy = target?.closest<HTMLButtonElement>('[data-copy]');
            if (copy) {
                const status = root.querySelector('[data-copy-status]');
                const label = copy.textContent;
                const done = (text: string): void => {
                    copy.textContent = text;
                    if (status) status.textContent = text;
                    window.setTimeout(() => {
                        copy.textContent = label;
                    }, 2000);
                };
                navigator.clipboard
                    ?.writeText(copy.dataset.copy ?? '')
                    .then(() => done('Copied'))
                    .catch(() => done('Copy blocked'));
            }
        };

        // Focus goes into the sheet on open and back to the key that opened it on close.
        const onToggle = (event: Event): void => {
            const sheet = event.currentTarget as HTMLElement;
            const open = (event as ToggleEvent).newState === 'open';
            if (open) {
                sheet.focus({ preventScroll: true });
                return;
            }
            const lost = document.activeElement === document.body || sheet.contains(document.activeElement);
            if (lost) invokers.get(sheet)?.focus({ preventScroll: true });
        };
        const sheets = root.querySelectorAll<HTMLElement>('[popover]');
        sheets.forEach((sheet) => sheet.addEventListener('toggle', onToggle));
        root.addEventListener('click', onClick);

        return () => {
            reveal.disconnect();
            live.disconnect();
            resized.disconnect();
            root.removeEventListener('click', onClick);
            sheets.forEach((sheet) => sheet.removeEventListener('toggle', onToggle));
        };
    }, []);

    return null;
}
