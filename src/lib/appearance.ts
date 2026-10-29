export type Appearance = 'light' | 'dark' | 'system';
export function normalizeAppearance(value: string | null): Appearance {
    return value === 'light' || value === 'dark' ? value : 'system';
}
/** Static, before-paint script; preferences are whitelisted and never interpolated into code. */
export const PORTFOLIO_APPEARANCE_BOOTSTRAP = `(function(){var t='system';try{t=localStorage.getItem('portfolio-theme')}catch(e){}document.documentElement.dataset.portfolioTheme=(t==='light'||t==='dark')?t:'system'})()`;
