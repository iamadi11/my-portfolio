import 'server-only';

import { readCurriculum, type Chapter } from '@/lib/learn/curriculum';
import { MECHANISMS, simulateMechanism, type Mechanism } from '@/lib/learn/experiment-model';

import lessons from './academy-lessons.json';
import sources from './academy-sources.json';

export type Blueprint = {
    id: string;
    model: Mechanism;
    sources: string[];
    question: string;
    rule: string;
    limit: string;
    misconception: string;
};
export type AcademyLesson = Blueprint & {
    chapter: Chapter;
    prerequisites: Chapter[];
    sourceRecords: { id: string; title: string; publisher: string; url: string; read: string }[];
};
export const COMPANION_MODELS: Record<string, Mechanism[]> = {
    'relational-model': ['sqlJoin', 'sqlSets'],
    'distributed-transactions': ['twoPhase'],
};
export const BLUEPRINTS = lessons as Blueprint[];
export const ACADEMY_IDS = new Set(BLUEPRINTS.map((item) => item.id));
export function getAcademyLesson(id: string): AcademyLesson | undefined {
    const blueprint = BLUEPRINTS.find((item) => item.id === id);
    if (!blueprint) return undefined;
    const chapters = readCurriculum().flatMap((stage) => stage.chapters);
    const chapter = chapters.find((item) => item.id === id);
    if (!chapter) return undefined;
    return {
        ...blueprint,
        chapter,
        prerequisites: (chapter.prerequisites ?? [])
            .map((key) => chapters.find((item) => item.id === key)!)
            .filter(Boolean),
        sourceRecords: blueprint.sources.map((key) => sources[key as keyof typeof sources]),
    };
}
export type RecallQuestion = {
    prompt: string;
    choices: [string, string];
    correct: number;
    explanation: string;
    chapter: string;
};
export function makeRecallQuestion(lesson: Blueprint): RecallQuestion {
    const correct = Array.from(lesson.id).reduce((sum, c) => sum + c.charCodeAt(0), 0) % 2;
    const spec = MECHANISMS[lesson.model];
    const amount = spec.initial === spec.max ? spec.min : spec.max;
    const input = { amount, alternative: true };
    const trace = simulateMechanism(lesson.model, input);
    const other = spec.predictions.find((prediction) => prediction !== trace.outcome)!;
    const choices: [string, string] = correct === 0 ? [trace.outcome, other] : [other, trace.outcome];
    return {
        prompt: `A changed scenario: ${spec.label.toLowerCase()} = ${amount}. Policy: “${spec.modes[1]}”. What follows from those assumptions?`,
        choices,
        correct,
        explanation: `${trace.explanation} Boundary: ${lesson.limit}`,
        chapter: lesson.id,
    };
}
export function recallFor(lesson: Blueprint): RecallQuestion[] {
    const mixed: Record<string, string[]> = {
        'review-foundations': ['idempotency', 'cache-invalidation', 'transactions', 'load-balancing'],
        'review-distributed': ['consensus', 'replication-lag', 'cap-pacelc', 'circuit-breakers'],
    };
    return (mixed[lesson.id] ?? [lesson.id]).map((id) =>
        makeRecallQuestion(BLUEPRINTS.find((item) => item.id === id)!)
    );
}
