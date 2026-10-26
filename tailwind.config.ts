import type { Config } from 'tailwindcss';

/** Monochrome only: paper, ink and grays come from the tokens in `globals.css`. */
export default {
    content: ['./src/components/**/*.{js,ts,jsx,tsx,mdx}', './src/app/**/*.{js,ts,jsx,tsx,mdx}'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-arimo)', 'Helvetica', 'Arial', 'sans-serif'],
            },
            colors: {
                paper: 'var(--paper)',
                ink: { DEFAULT: 'var(--ink)', 2: 'var(--ink-2)', 3: 'var(--ink-3)' },
                rule: 'var(--rule)',
                fill: { 1: 'var(--fill-1)', 2: 'var(--fill-2)' },
            },
        },
    },
    plugins: [],
} satisfies Config;
