import { describe, expect, it, vi } from 'vitest';

import { LESSON_FILMS } from '@/content/learn/films';

import { experiment } from './api-experiment';
import { apiExperimentFilm } from './api-experiment-film';
import { filmDuration, sampleFilm } from './film-model';

vi.mock('server-only', () => ({}));
describe('RPC caller observation', () => {
    it('does not turn an expired deadline into transport loss, server failure or zero remote effects', () => {
        const film = apiExperimentFilm(LESSON_FILMS.rpc, 'rpc', '2', experiment('rpc', '2', 5));
        const final = sampleFilm(film, filmDuration(film));
        expect(film.beats.every((beat) => !beat.lost)).toBe(true);
        expect(film.beats[1].from).toBeUndefined();
        expect(final.values).toMatchObject({ c: 'deadline exceeded', s: 'outcome unknown' });
        expect(Object.values(final.states)).not.toContain('failed');
        expect(final.counts.d).toBeUndefined();
    });
    it('only presents a remote response as observed when it arrives before the deadline', () => {
        const film = apiExperimentFilm(LESSON_FILMS.rpc, 'rpc', '4', experiment('rpc', '4', 2));
        expect(film.beats[1]).toMatchObject({ from: 's', to: 'c', packet: 'Stock { count: 3 }' });
        expect(sampleFilm(film, filmDuration(film)).values.c).toBe('Stock { count: 3 }');
    });
});
