/**
 * Per-scene atmosphere tokens. Indexed by scene order in data.ts. Progression
 * rule (STORY_SPEC §1): luminosity rises monotonically — mysterious start,
 * expansive finale.
 */

export type ScenePalette = {
    /** Base backdrop color behind everything in this chapter. */
    bg: string;
    /** Primary radial glow (rgba — needs alpha baked in). */
    glow: string;
    /** Accent for kickers, fact markers, thread node ignition. */
    accent: string;
    /** Accent as "r,g,b" for canvas alpha compositing. */
    accentRgb: string;
};

export const scenePalettes: ScenePalette[] = [
    { bg: '#04050a', glow: 'rgba(34,211,238,0.07)', accent: '#22d3ee', accentRgb: '34,211,238' },
    { bg: '#05070f', glow: 'rgba(129,140,248,0.09)', accent: '#818cf8', accentRgb: '129,140,248' },
    { bg: '#04100b', glow: 'rgba(52,211,153,0.10)', accent: '#34d399', accentRgb: '52,211,153' },
    { bg: '#0a0714', glow: 'rgba(167,139,250,0.12)', accent: '#a78bfa', accentRgb: '167,139,250' },
    { bg: '#06101a', glow: 'rgba(56,189,248,0.13)', accent: '#38bdf8', accentRgb: '56,189,248' },
    { bg: '#120d04', glow: 'rgba(251,191,36,0.12)', accent: '#fbbf24', accentRgb: '251,191,36' },
    { bg: '#0a0a1c', glow: 'rgba(192,132,252,0.14)', accent: '#c084fc', accentRgb: '192,132,252' },
    { bg: '#10121a', glow: 'rgba(248,250,252,0.12)', accent: '#e2e8f0', accentRgb: '226,232,240' },
];
