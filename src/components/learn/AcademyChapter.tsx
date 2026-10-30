import React from 'react';

import Link from 'next/link';

import { COMPANION_MODELS, companionFor, recallFor, type AcademyLesson } from '@/content/learn/academy';
import { DESIGN_GUIDES, designFilm } from '@/content/learn/design-guides';
import { MECHANISM_TERMS } from '@/content/learn/mechanism-terms';
import { makeExperimentFilm, MECHANISMS, simulateMechanism } from '@/lib/learn/experiment-model';
import { LOAD_BALANCING_QUESTIONS } from '@/lib/learn/load-balancing';
import { PARTITIONED_LOG_QUESTIONS } from '@/lib/learn/partitioned-log';

import ChapterTabs from './ChapterTabs';
import DesignWorksheet from './DesignWorksheet';
import AcademyQuiz from './film/Assessment';
import AcademyLab from './film/DeferredAcademyLab';
import LessonFilm from './film/LessonFilm';
import LoadBalancingLab, { LoadBalancingLearn } from './film/LoadBalancingLab';
import MechanismCompare from './film/MechanismCompare';
import PartitionedLogLab, { PartitionedLogLearn } from './film/PartitionedLogLab';

export default function AcademyChapter({ lesson }: { lesson: AcademyLesson }): React.JSX.Element {
    const spec = MECHANISMS[lesson.model],
        input = { amount: spec.initial, alternative: false };
    const film = makeExperimentFilm(lesson.id, lesson.question, lesson.rule, lesson.model, input);
    const example = simulateMechanism(lesson.model, input);
    const alternative = simulateMechanism(lesson.model, { ...input, alternative: true });
    const alternativeFilm = makeExperimentFilm(lesson.id, lesson.question, lesson.rule, lesson.model, {
        ...input,
        alternative: true,
    });
    const isDesign =
        lesson.id.startsWith('case-') ||
        ['capstone', 'interview-method', 'decision-records'].includes(lesson.id);
    const guide = DESIGN_GUIDES[lesson.id];
    const companions = (COMPANION_MODELS[lesson.id] ?? []).map((model) => companionFor(lesson, model));
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
                key={lesson.id}
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
                        {lesson.id === 'load-balancing' ? (
                            <>
                                <p className="al-why">
                                    Layer 4 routes transport connections; layer 7 can inspect application
                                    requests, such as an HTTP path. This model isolates routing: one request
                                    holds one connection, with no multiplexing.
                                </p>
                                <LoadBalancingLearn />
                            </>
                        ) : lesson.id === 'logs-streams' ? (
                            <PartitionedLogLearn />
                        ) : (
                            <MechanismCompare
                                bundled={lesson.model === 'architecture'}
                                modes={spec.modes}
                                examples={[
                                    { film, ...example },
                                    { film: alternativeFilm, ...alternative },
                                ]}
                            />
                        )}
                        {companions.map((companion) => {
                            const definition = MECHANISMS[companion.model];
                            return (
                                <section key={companion.model} className="ac-companion">
                                    <h2>
                                        {MECHANISM_TERMS[companion.model][0]} · another view of this chapter
                                    </h2>
                                    <p>{MECHANISM_TERMS[companion.model][1]}</p>
                                    <MechanismCompare
                                        modes={definition.modes}
                                        examples={(() => {
                                            const run = (comparedPolicy: boolean) => {
                                                const comparedInput = {
                                                    amount: definition.initial,
                                                    alternative: comparedPolicy,
                                                };
                                                return {
                                                    film: {
                                                        ...makeExperimentFilm(
                                                            lesson.id,
                                                            companion.question,
                                                            companion.rule,
                                                            companion.model,
                                                            comparedInput
                                                        ),
                                                        id: `${lesson.id}-${companion.model}`,
                                                    },
                                                    ...simulateMechanism(companion.model, comparedInput),
                                                };
                                            };
                                            return [run(false), run(true)];
                                        })()}
                                    />
                                </section>
                            );
                        })}
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
                lab={
                    <>
                        {lesson.id === 'load-balancing' ? (
                            <LoadBalancingLab />
                        ) : lesson.id === 'logs-streams' ? (
                            <PartitionedLogLab />
                        ) : (
                            <AcademyLab lesson={lesson} />
                        )}
                        {companions.map((companion) => (
                            <details className="ln-watch-depth" key={companion.model}>
                                <summary>Experiment with {MECHANISM_TERMS[companion.model][0]}</summary>
                                <AcademyLab lesson={companion} />
                            </details>
                        ))}
                    </>
                }
                quiz={
                    <AcademyQuiz
                        id={lesson.id}
                        questions={
                            lesson.id === 'load-balancing'
                                ? LOAD_BALANCING_QUESTIONS
                                : lesson.id === 'logs-streams'
                                  ? PARTITIONED_LOG_QUESTIONS
                                  : recallFor(lesson)
                        }
                    />
                }
            />
        </article>
    );
}
