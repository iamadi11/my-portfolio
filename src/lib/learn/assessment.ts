/** Deterministic feedback for a committed attempt; no inferred mastery or learner profiling. */
export type AssessmentQuestion = {
    chapter: string;
    choices: readonly string[];
    correct: number;
    explanation: string;
};

export type AssessmentResult = {
    correct: number;
    total: number;
    items: {
        chapter: string;
        selected: string;
        expected: string;
        matched: boolean;
        explanation: string;
    }[];
    revisits: { chapter: string; missed: number; learnHref: string; experimentHref: string }[];
};

/** Incomplete/invalid attempts cannot produce a score, including a zero-question attempt. */
export function gradeAssessment(
    questions: readonly AssessmentQuestion[],
    answers: Readonly<Record<number, number>>
): AssessmentResult | null {
    if (
        questions.length === 0 ||
        questions.some(
            (question, index) =>
                !Number.isInteger(question.correct) ||
                question.correct < 0 ||
                question.correct >= question.choices.length ||
                !Object.hasOwn(answers, index) ||
                !Number.isInteger(answers[index]) ||
                answers[index] < 0 ||
                answers[index] >= question.choices.length
        )
    )
        return null;

    const items = questions.map((question, index) => ({
        chapter: question.chapter,
        selected: question.choices[answers[index]],
        expected: question.choices[question.correct],
        matched: answers[index] === question.correct,
        explanation: question.explanation,
    }));
    const missed = new Map<string, number>();
    for (const item of items)
        if (!item.matched) missed.set(item.chapter, (missed.get(item.chapter) ?? 0) + 1);

    return {
        correct: items.filter((item) => item.matched).length,
        total: items.length,
        items,
        revisits: [...missed].map(([chapter, count]) => {
            const route = `/learn/${encodeURIComponent(chapter)}`;
            return {
                chapter,
                missed: count,
                learnHref: route,
                experimentHref: `${route}?tab=explore`,
            };
        }),
    };
}
