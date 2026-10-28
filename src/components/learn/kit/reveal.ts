/**
 * After a Run, bring the figure's result into view when it is off-screen (on phones the controls sit above the
 * drawing, so a run would otherwise change nothing the learner can see). Scrolls only as far as needed; jumps
 * instead of gliding when the reader asks for reduced motion. Focus stays where it was.
 */
export function revealAfterRender(el: () => HTMLElement | null): void {
    requestAnimationFrame(() => {
        const node = el();
        if (!node) return;
        const r = node.getBoundingClientRect();
        if (r.top >= 0 && r.top < window.innerHeight - 120) return;
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        node.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    });
}
