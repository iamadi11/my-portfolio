import { runInNewContext } from 'node:vm';
import { expect, it } from 'vitest';

import { normalizeAppearance, PORTFOLIO_APPEARANCE_BOOTSTRAP } from './appearance';

it('whitelists appearance and follows system when optional storage fails', () => {
    for (const stored of ['dark', 'light', 'system', 'invalid', null]) {
        const document = { documentElement: { dataset: {} as Record<string, string> } };
        runInNewContext(PORTFOLIO_APPEARANCE_BOOTSTRAP, {
            document,
            localStorage: { getItem: () => stored },
        });
        expect(document.documentElement.dataset.portfolioTheme).toBe(normalizeAppearance(stored));
    }
    const document = { documentElement: { dataset: {} as Record<string, string> } };
    runInNewContext(PORTFOLIO_APPEARANCE_BOOTSTRAP, {
        document,
        localStorage: {
            getItem: () => {
                throw Error('disabled');
            },
        },
    });
    expect(document.documentElement.dataset.portfolioTheme).toBe('system');
});
