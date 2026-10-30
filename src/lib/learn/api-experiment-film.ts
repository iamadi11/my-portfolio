import type { ApiLessonId, ExperimentResult } from './api-experiment';
import { paceFilm, type LessonFilmData } from './film-model';

/** The caller's deadline is an observation; it supplies no proof of remote failure or message loss. */
export function apiExperimentFilm(
    film: LessonFilmData,
    id: ApiLessonId,
    variant: string,
    result: ExperimentResult
): LessonFilmData {
    if (id === 'rpc')
        return paceFilm({
            ...film,
            id: `${id}-experiment`,
            beats: [
                {
                    title: 'Send the call',
                    caption:
                        'The request reaches the service. The caller still needs a response to observe its result.',
                    from: 'c',
                    to: 's',
                    packet: 'GetStock',
                    states: { s: 'active' },
                    values: { s: 'working', c: 'waiting' },
                },
                result.failed
                    ? {
                          title: 'Caller deadline',
                          caption: result.reason,
                          states: { c: 'done', s: 'idle', d: 'idle' },
                          values: { c: 'deadline exceeded', s: 'outcome unknown', d: 'not observed' },
                      }
                    : {
                          title: 'Observe the response',
                          caption: result.reason,
                          from: 's',
                          to: 'c',
                          packet: result.value,
                          states: { s: 'done', c: 'done' },
                          values: { c: result.value },
                      },
            ],
        });
    if (id === 'realtime')
        return paceFilm({
            ...film,
            id: `${id}-experiment`,
            beats: [
                ...(variant === 'both'
                    ? [
                          {
                              title: 'Client sends over WebSocket',
                              caption:
                                  'This application needs client messages as well as server updates on the open connection.',
                              from: 'c',
                              to: 's',
                              packet: 'client message',
                              states: { s: 'active' as const },
                          },
                      ]
                    : []),
                {
                    title: variant === 'both' ? 'Server sends over WebSocket' : 'Server sends an SSE event',
                    caption: result.reason,
                    from: 's',
                    to: 'c',
                    packet: 'server event',
                    states: { c: 'done', s: 'done' },
                    values: { c: result.value },
                    counts: { d: result.count },
                },
            ],
        });
    return paceFilm({
        ...film,
        id: `${id}-experiment`,
        nodes: film.nodes.map((node) =>
            id === 'rest' && node.id === 'd' && variant === 'POST'
                ? { ...node, label: 'Notes collection' }
                : node
        ),
        beats: [
            {
                title: 'Your experiment',
                caption: result.reason,
                from: 'c',
                to: 's',
                packet: result.value,
                states: { s: 'done', d: 'done', c: 'done' },
                values: { s: result.value },
                counts: { d: result.count, p: result.count },
            },
        ],
    });
}
