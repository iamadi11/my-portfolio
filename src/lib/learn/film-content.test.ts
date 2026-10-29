import { describe, expect, it, vi } from 'vitest';

import { LESSON_FILMS } from '@/content/learn/films';

import { BEAT_SECONDS, sampleFilm } from './film-model';

vi.mock('server-only', () => ({}));

describe('published film topology and delivery', () => {
    for (const [id, film] of Object.entries(LESSON_FILMS)) {
        it(`${id}: has reachable scenes and consistent message destinations`, () => {
            const ids = new Set(film.nodes.map((node) => node.id));
            expect(ids.size).toBe(film.nodes.length);
            expect(film.nodes.length).toBeLessThanOrEqual(4); // Mobile's explicit topology layout.
            expect(film.nodes.length).toBeGreaterThanOrEqual(2);
            expect(film.beats.length).toBeGreaterThan(1);
            for (const [from, to] of film.links) {
                expect(ids.has(from)).toBe(true);
                expect(ids.has(to)).toBe(true);
            }
            film.beats.forEach((beat, index) => {
                expect(beat.caption.split(/\s+/).length).toBeLessThanOrEqual(25);
                if (!beat.from) return;
                expect(ids.has(beat.from)).toBe(true);
                expect(ids.has(beat.to!)).toBe(true);
                const state = sampleFilm(film, index * BEAT_SECONDS + BEAT_SECONDS * 0.9);
                const destination = film.nodes.find((node) => node.id === beat.to)!;
                if (beat.lost) {
                    expect(state.packet?.lost).toBe(true);
                    expect(state.packet?.x === destination.x && state.packet?.y === destination.y).toBe(
                        false
                    );
                } else {
                    expect(state.packet?.x).toBeCloseTo(destination.x);
                    expect(state.packet?.y).toBeCloseTo(destination.y);
                }
            });
        });
    }
});
