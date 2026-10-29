import React from 'react';

import Link from 'next/link';

import { recallFor, type AcademyLesson } from '@/content/learn/academy';
import { DESIGN_GUIDES, designFilm } from '@/content/learn/design-guides';
import { MECHANISM_TERMS } from '@/content/learn/mechanism-terms';
import { makeExperimentFilm, MECHANISMS, simulateMechanism } from '@/lib/learn/experiment-model';

import ChapterTabs from './ChapterTabs';
import DesignWorksheet from './DesignWorksheet';
import { AcademyLab, AcademyQuiz } from './film/AcademyPractice';
import LessonFilm from './film/LessonFilm';

export default function AcademyChapter({ lesson }: { lesson: AcademyLesson }): React.JSX.Element {
    const spec = MECHANISMS[lesson.model],
        input = { amount: spec.initial, alternative: false };
    const film = makeExperimentFilm(lesson.id, lesson.question, lesson.rule, lesson.model, input);
    const example = simulateMechanism(lesson.model, input);
    const isDesign =
        lesson.id.startsWith('case-') ||
        ['capstone', 'interview-method', 'decision-records'].includes(lesson.id);
    const guide = DESIGN_GUIDES[lesson.id];
    return (
        <article aria-labelledby="ch-h">
            <header className="ln-head">
                <p className="ln-kicker">
                    Lesson {lesson.chapter.order} · Stage {lesson.chapter.stage}
                </p>
                <h1 className="ln-h1" id="ch-h">
                    {lesson.chapter.title.replace(/^(Case|Map): /, '')}
                </h1>
                <p className="ln-lede">{lesson.question}</p>
            </header>
            <ChapterTabs
                learn={
                    <>
                        <aside className="ac-primer" aria-label="Before you watch">
                            <p>
                                <strong>{MECHANISM_TERMS[lesson.model][0]}:</strong>{' '}
                                {MECHANISM_TERMS[lesson.model][1]}
                            </p>
                            {lesson.prerequisites.length > 0 && (
                                <p>
                                    Useful first:{' '}
                                    {lesson.prerequisites.map((chapter, i) => (
                                        <React.Fragment key={chapter.id}>
                                            {i > 0 && ' · '}
                                            <Link href={`/learn/${chapter.id}`}>{chapter.title}</Link>
                                        </React.Fragment>
                                    ))}
                                </p>
                            )}
                        </aside>
                        {guide && (
                            <>
                                <LessonFilm film={designFilm(lesson.id, guide)} trackProgress={false} />
                                <details className="ln-watch-depth">
                                    <summary>Workload assumptions · calculate before choosing</summary>
                                    <p>
                                        Exercise assumptions: {guide.workload.daily.toLocaleString('en-US')}{' '}
                                        operations/day, {guide.workload.bytes.toLocaleString('en-US')}{' '}
                                        bytes/operation, peak multiplier {guide.workload.peak}.
                                    </p>
                                    <p>
                                        Average = daily ÷ 86,400 = {guide.workload.daily / 86400}{' '}
                                        operations/s. Assumed peak ={' '}
                                        {(guide.workload.daily / 86400) * guide.workload.peak} operations/s.
                                        Raw daily bytes ={' '}
                                        {(guide.workload.daily * guide.workload.bytes).toLocaleString(
                                            'en-US'
                                        )}
                                        , before replication, indexes, protocol overhead or retention.
                                    </p>
                                    <p>
                                        These are invented planning inputs, not measured service capacity or
                                        company traffic.
                                    </p>
                                </details>
                                <h2 className="ac-experiment-heading">Zoom into one design decision</h2>
                            </>
                        )}
                        <LessonFilm film={film} />
                        <div className="ac-rule">
                            <h2>The idea to keep</h2>
                            <p>{lesson.rule}</p>
                        </div>
                        <details className="ln-watch-depth">
                            <summary>Worked example · assumptions & boundaries</summary>
                            <p>
                                Assume {spec.label.toLowerCase()}: <strong>{spec.initial}</strong>. Start with
                                “{spec.modes[0]}”.
                            </p>
                            <dl className="ac-metrics">
                                {example.metrics.map((metric) => (
                                    <div key={metric.label}>
                                        <dt>{metric.label}</dt>
                                        <dd>{metric.value}</dd>
                                    </div>
                                ))}
                            </dl>
                            <p>{example.explanation}</p>
                            <p>
                                <strong>Boundary:</strong> {lesson.limit}
                            </p>
                            <p>
                                <strong>Watch for this misconception:</strong> {lesson.misconception}
                            </p>
                            <p>
                                <Link href={`/learn/sources#${lesson.id}`}>
                                    Inspect this chapter’s primary sources ↗
                                </Link>
                            </p>
                        </details>
                        {isDesign && (
                            <DesignWorksheet question={lesson.question} challenge={guide?.challenge} />
                        )}
                    </>
                }
                lab={<AcademyLab lesson={lesson} />}
                quiz={<AcademyQuiz id={lesson.id} questions={recallFor(lesson)} />}
            />
        </article>
    );
}
