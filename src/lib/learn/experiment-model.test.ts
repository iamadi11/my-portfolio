import { describe, expect, it } from 'vitest';

import lessons from '@/content/learn/academy-lessons.json';
import sources from '@/content/learn/academy-sources.json';
import { CHAPTER_ROUTES } from '@/content/learn/chapters';

import { readCurriculum } from './curriculum';
import { makeExperimentFilm, MECHANISMS, simulateMechanism, type Mechanism } from './experiment-model';
import { filmDuration, sampleFilm } from './film-model';

const metric = (kind: Mechanism, amount: number, alternative: boolean, label: string): string | undefined =>
    simulateMechanism(kind, { amount, alternative }).metrics.find((item) => item.label === label)?.value;
describe('finite learning models', () => {
    for (const kind of Object.keys(MECHANISMS) as Mechanism[]) {
        it(`${kind}: every allowed input has a selectable outcome and coherent seekable state`, () => {
            const spec = MECHANISMS[kind];
            for (let amount = spec.min; amount <= spec.max; amount++)
                for (const alternative of [false, true]) {
                    const input = { amount, alternative };
                    const trace = simulateMechanism(kind, input);
                    expect(spec.predictions).toContain(trace.outcome);
                    expect(trace.beats.length).toBeGreaterThan(1);
                    expect(trace.metrics.length).toBeGreaterThan(0);
                    const film = makeExperimentFilm('test', 'Question', 'Rule', kind, input);
                    const end = sampleFilm(film, filmDuration(film));
                    expect(Object.values(end.counts).every((n) => Number.isFinite(n) && n >= 0)).toBe(true);
                    expect(trace.beats.every((beat) => !beat.lost)).toBe(true); // refusals and delay are not packet loss
                    expect(sampleFilm(film, filmDuration(film))).toEqual(end);
                    for (const beat of trace.beats)
                        if (beat.from)
                            expect(
                                film.nodes.some((node) => node.id === beat.from) &&
                                    film.nodes.some((node) => node.id === beat.to)
                            ).toBe(true);
                }
            expect(simulateMechanism(kind, { amount: NaN, alternative: false })).toEqual(
                simulateMechanism(kind, { amount: spec.initial, alternative: false })
            );
        });
    }
    it('deduplicates effects, not independent subscriber delivery', () => {
        expect(metric('dedup', 6, true, 'Saved effects')).toBe('1');
        expect(metric('fanout', 6, true, 'Delivered subscriptions')).toBe('6');
        expect(metric('fanout', 6, false, 'Missing subscriptions')).toBe('5');
        expect(metric('coalesce', 6, true, 'Origin fetches')).toBe('1');
        expect(metric('coalesce', 6, false, 'Origin fetches')).toBe('6');
    });
    it('protects references, upload publication and conflicting file branches', () => {
        expect(metric('foreignKey', 5, false, 'Orphan rows inserted')).toBe('1');
        expect(metric('foreignKey', 5, true, 'Orphan rows inserted')).toBe('0');
        expect(metric('foreignKey', 2, true, 'Orphan rows inserted')).toBe('0');
        expect(metric('upload', 4, true, 'Dangling published references')).toBe('0');
        expect(metric('fileVersions', 4, true, 'Branches preserved')).toBe('2');
    });
    it('makes selectivity change the estimated plan and retains full visual quantities', () => {
        expect(simulateMechanism('planner', { amount: 1, alternative: true }).outcome).toBe(
            'Index path selected'
        );
        expect(simulateMechanism('planner', { amount: 6, alternative: true }).outcome).toBe(
            'Sequential path selected'
        );
        const film = makeExperimentFilm('test', 'Q', 'R', 'columns', { amount: 6, alternative: false });
        expect(sampleFilm(film, filmDuration(film)).counts.b).toBe(24);
    });
    it('separates event time, watermark and correction policy', () => {
        expect(metric('window', 4, false, 'Counted events')).toBe('3');
        expect(metric('window', 5, false, 'Counted events')).toBe('2');
        expect(metric('window', 5, true, 'Counted events')).toBe('3');
    });
    it('scaling at equal arrival and service rates cannot drain old backlog', () => {
        expect(metric('scaleLag', 6, true, 'Backlog after 4 windows')).toBe('3');
        expect(metric('scaleLag', 4, true, 'Backlog after 4 windows')).toBe('0');
    });
    it('never exposes unequal business/outbox commit state between frames', () => {
        const film = makeExperimentFilm('outbox', 'Q', 'R', 'outbox', { amount: 6, alternative: true });
        for (let t = 0; t <= filmDuration(film); t += 0.1) {
            const state = sampleFilm(film, t);
            expect(state.counts.a).toBe(state.counts.b);
        }
    });
    it('resuming from a settled scene cannot undo its completed work', () => {
        const film = makeExperimentFilm('queue', 'Q', 'R', 'queue', { amount: 6, alternative: false });
        expect(sampleFilm(film, 9).counts).toEqual(sampleFilm(film, 9.01).counts);
        expect(sampleFilm(film, 9).counts).toMatchObject({ a: 5, b: 1 });
    });
    it('retains unacked work and outbox intent across process failure', () => {
        expect(metric('redelivery', 3, false, 'Retained work obligations')).toBe('0');
        expect(metric('redelivery', 3, true, 'Retained work obligations')).toBe('1');
        expect(metric('outbox', 6, true, 'Recoverable event intents')).toBe('6');
    });
    it('strict shared allowance and canary exposure remain bounded', () => {
        expect(metric('sharedQuota', 6, true, 'Total admitted')).toBe('3');
        expect(metric('sharedQuota', 6, false, 'Total admitted')).toBe('6');
        expect(metric('canary', 4, true, 'Users exposed to faulty version')).toBe('2');
    });
});
describe('complete course coverage', () => {
    const chapters = readCurriculum().flatMap((stage) => stage.chapters);
    it('has exactly one route for every chapter, ending at the capstone', () => {
        expect(Object.keys(CHAPTER_ROUTES).sort()).toEqual(chapters.map((chapter) => chapter.id).sort());
        expect(chapters.at(-1)?.id).toBe('capstone');
        for (const chapter of chapters)
            for (const prereq of chapter.prerequisites ?? []) expect(CHAPTER_ROUTES[prereq]).toBeTruthy();
    });
    it('all new lessons have known models, sources and a nonempty teaching boundary', () => {
        expect(new Set(lessons.map((l) => l.id)).size).toBe(99);
        for (const lesson of lessons) {
            expect(MECHANISMS[lesson.model as Mechanism]).toBeTruthy();
            expect(lesson.limit.length).toBeGreaterThan(30);
            expect(lesson.sources.length).toBeGreaterThan(0);
            for (const id of lesson.sources)
                expect(sources[id as keyof typeof sources]?.url).toMatch(/^https:\/\//);
        }
    });
    it('does not substitute numerical search, local transfer or a queue for unrelated concepts', () => {
        const model = (id: string) => lessons.find((l) => l.id === id)?.model;
        expect(model('relational-model')).toBe('foreignKey');
        expect(model('search-indexes')).toBe('inverted');
        expect(model('object-storage')).toBe('upload');
        expect(model('deployments')).toBe('canary');
        expect(model('distributed-transactions')).toBe('saga');
        expect(model('case-news-feed')).toBe('feed');
    });
});
