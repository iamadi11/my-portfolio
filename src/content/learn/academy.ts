import 'server-only';

import { MECHANISM_TERMS } from '@/content/learn/mechanism-terms';
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
    'storage-engines': ['log'],
    authentication: ['tokenPurpose'],
    'web-vulnerabilities': ['xssContext', 'csrf'],
    'distributed-transactions': ['twoPhase'],
};
/** Companions own their scope; a primary model's boundary cannot describe a different protocol. */
const COMPANION_LIMITS: Partial<Record<Mechanism, string>> = {
    sqlJoin:
        'Small equality joins with explicit NULL extension; no query planner, indexes, collation or SQL execution engine.',
    sqlSets:
        'Small duplicate-preserving and duplicate-removing sets; real SQL type coercion, NULL and collation semantics are outside this example.',
    twoPhase:
        'A durable commit decision is assumed before coordinator loss. This is the uncertainty/recovery boundary, not a full distributed transaction implementation.',
    log: 'Committed log records are assumed durable; page replay omits torn writes, checksums, disk caches and hardware failures.',
    tokenPurpose:
        'Authentic unexpired issuer-validated tokens are assumed. Issuance, redirects, PKCE and cryptography are omitted; the API example uses the RFC 9068 JWT profile, not every OAuth token.',
    xssContext:
        'Harmless markup illustrates HTML interpretation versus ordinary-element text. No script executes; attribute, URL and script contexts need different rules.',
    csrf: 'A finite synchronizer-token check assumes session binding and secure token generation. SameSite, Origin and Fetch Metadata are other defenses; XSS can undermine them.',
};
export function companionFor(lesson: Blueprint, model: Mechanism): Blueprint {
    return {
        ...lesson,
        model,
        question: `What changes between “${MECHANISMS[model].modes[0]}” and “${MECHANISMS[model].modes[1]}”?`,
        rule: MECHANISM_TERMS[model][1],
        limit: COMPANION_LIMITS[model] ?? lesson.limit,
    };
}
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
    return (mixed[lesson.id] ?? [lesson.id]).flatMap((id) => {
        const blueprint = BLUEPRINTS.find((item) => item.id === id)!;
        return [
            makeRecallQuestion(blueprint),
            ...(COMPANION_MODELS[id] ?? []).map((model) =>
                makeRecallQuestion(companionFor(blueprint, model))
            ),
        ];
    });
}
