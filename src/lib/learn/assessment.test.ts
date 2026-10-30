import { describe, expect, it } from 'vitest';

import { gradeAssessment, type AssessmentQuestion } from './assessment';

const questions: AssessmentQuestion[] = [
    {
        chapter: 'transactions',
        choices: ['Partial transfer', 'Atomic transfer'],
        correct: 1,
        explanation: 'A grouped commit preserves both changes.',
    },
    {
        chapter: 'replication-lag',
        choices: ['May be stale', 'Always current'],
        correct: 0,
        explanation: 'The follower has not applied the write.',
    },
    {
        chapter: 'transactions',
        choices: ['No commit', 'All changes commit'],
        correct: 1,
        explanation: 'All grouped changes commit together.',
    },
];

describe('committed assessment feedback', () => {
    it('does not grade missing, out-of-range or noninteger answers, or an empty assessment', () => {
        const invalid: Record<number, number>[] = [
            {},
            { 0: 1 },
            { 0: 1, 1: 2, 2: 1 },
            { 0: 1, 1: NaN, 2: 1 },
            { 0: 1, 1: 0.5, 2: 1 },
            { 0: 1, 1: -1, 2: 1 },
        ];
        for (const answers of invalid) expect(gradeAssessment(questions, answers)).toBeNull();
        expect(gradeAssessment([], {})).toBeNull();
    });

    it('explains each answer and recommends only actually missed mechanisms', () => {
        const result = gradeAssessment(questions, { 0: 0, 1: 0, 2: 0 })!;
        expect(result).toMatchObject({ correct: 1, total: 3 });
        expect(result.items[0]).toEqual({
            chapter: 'transactions',
            selected: 'Partial transfer',
            expected: 'Atomic transfer',
            matched: false,
            explanation: questions[0].explanation,
        });
        expect(result.items[1].matched).toBe(true);
        expect(result.revisits).toEqual([
            {
                chapter: 'transactions',
                missed: 2,
                learnHref: '/learn/transactions',
                experimentHref: '/learn/transactions?tab=explore',
            },
        ]);
    });

    it('keeps zero and full scores honest and does not recommend already-correct chapters', () => {
        expect(gradeAssessment(questions, { 0: 0, 1: 1, 2: 0 })).toMatchObject({ correct: 0, total: 3 });
        expect(gradeAssessment(questions, { 0: 1, 1: 0, 2: 1 })).toMatchObject({
            correct: 3,
            total: 3,
            revisits: [],
        });
    });

    it('returns an independent attempt snapshot and recomputes recommendations after a retry', () => {
        const answers = { 0: 0, 1: 1, 2: 0 };
        const first = gradeAssessment(questions, answers)!;
        answers[0] = 1;
        answers[2] = 1;
        const retry = gradeAssessment(questions, answers)!;
        expect(first.correct).toBe(0);
        expect(retry.correct).toBe(2);
        expect(retry.revisits.map((item) => item.chapter)).toEqual(['replication-lag']);
        expect(gradeAssessment(questions, {})).toBeNull();
    });

    it('rejects invalid question metadata instead of silently awarding credit', () => {
        expect(gradeAssessment([{ ...questions[0], correct: 9 }], { 0: 0 })).toBeNull();
    });
});
