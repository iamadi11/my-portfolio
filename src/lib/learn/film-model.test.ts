import { describe, expect, it } from 'vitest';

import { filmDuration, type LessonFilmData, sampleFilm } from './film-model';

const film: LessonFilmData = {
    id: 'test',
    question: 'Delivery?',
    takeaway: 'A saved write survives a lost reply.',
    sourceHref: '#',
    nodes: [
        { id: 'c', label: 'Client', kind: 'computer', x: 0, y: 0 },
        { id: 's', label: 'Server', kind: 'server', x: 100, y: 40 },
    ],
    links: [['c', 's']],
    beats: [
        { title: 'Save', caption: 'Write', from: 'c', to: 's', counts: { s: 1 } },
        { title: 'Reply lost', caption: 'Unknown to client', from: 's', to: 'c', lost: true },
    ],
};
describe('teaching film event state', () => {
    it('clamps before and after the film and tolerates invalid seek input', () => {
        expect(sampleFilm(film, -1).index).toBe(0);
        expect(sampleFilm(film, 999).index).toBe(1);
        expect(sampleFilm(film, NaN).progress).toBe(0);
        expect(filmDuration(film)).toBe(10);
    });
    it('does not apply the arrival state before the packet reaches its destination', () => {
        expect(sampleFilm(film, 0).counts.s).toBeUndefined();
        expect(sampleFilm(film, 4).counts.s).toBe(1);
    });
    it('seeks deterministically without requiring preceding frames', () => {
        const first = sampleFilm(film, 8);
        sampleFilm(film, 1);
        sampleFilm(film, 10);
        expect(sampleFilm(film, 8)).toEqual(first);
        expect(first.counts.s).toBe(1);
    });
    it('a lost reply never reaches the client and cannot undo the saved write', () => {
        const end = sampleFilm(film, 10);
        expect(end.packet?.lost).toBe(true);
        expect(end.packet?.x).toBeCloseTo(45);
        expect(end.counts.s).toBe(1);
    });
});
