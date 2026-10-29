import 'server-only';

import type { ApiLessonId } from '@/lib/learn/api-experiment';

export type ApiLesson = {
    id: ApiLessonId;
    title: string;
    number: number;
    lede: string;
    why: string;
    prereq: [string, string];
    detail: string;
    inputLabel: string;
    variants: [string, string][];
    amountLabel?: string;
    answers: string[];
    question: string;
    choices: string[];
    correct: number;
    explanation: string;
    sources: { id: string; title: string; url: string; read: string; publisher: string }[];
};
export const API_LESSONS: Record<ApiLessonId, ApiLesson> = {
    rest: {
        id: 'rest',
        title: 'Resources, not a new verb for every button',
        number: 17,
        lede: 'Read and replace one note. Then repeat the request and see what changes.',
        why: 'Useful when designing a predictable HTTP API for a web or mobile app.',
        prereq: ['api-design', 'API contracts'],
        detail: 'REST adds architectural constraints: stateless interactions, caching, a uniform interface, layers and optional code on demand. Its uniform interface includes resource identification, representations, self-descriptive messages and hypermedia. This introductory model covers resource-oriented HTTP, not complete REST conformance.',
        inputLabel: 'Operation',
        variants: [
            ['PUT', 'PUT /notes/7 · replace'],
            ['POST', 'POST /notes · create'],
        ],
        amountLabel: 'Repeated identical requests',
        answers: ['One note', 'Several notes'],
        question:
            'A network timeout follows a PUT. Does repeating the identical request imply creating a second resource?',
        choices: [
            'Yes, every request creates another resource',
            'No, the intended effect is the same replacement',
        ],
        correct: 1,
        explanation:
            'PUT is idempotent in its intended effect. Identical responses are not required; logs and other side effects can still differ.',
        sources: [
            {
                id: 'http-semantics',
                title: 'RFC 9110 · HTTP method semantics',
                url: 'https://www.rfc-editor.org/rfc/rfc9110.html#section-9.3.4',
                read: 'Read §§9.2, 9.3.1 and 9.3.4 on 2026-10-29.',
                publisher: 'IETF',
            },
            {
                id: 'rest-constraints',
                title: 'Fielding · REST architectural constraints',
                url: 'https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm',
                read: 'Read §5.1, especially §5.1.5, on 2026-10-29.',
                publisher: 'Roy Fielding',
            },
        ],
    },
    rpc: {
        id: 'rpc',
        title: 'A function call with a network in the middle',
        number: 18,
        lede: 'Follow a typed call from your program to a remote service and back.',
        why: 'Useful when services need a defined method contract and generated clients.',
        prereq: ['api-design', 'API contracts'],
        detail: 'A stub is generated client code that prepares a remote call. Serialization turns typed data into transmitted bytes. gRPC commonly uses Protocol Buffers to define services and messages. A deadline limits waiting; it cannot turn a remote call into an atomic local operation.',
        inputLabel: 'Caller deadline',
        variants: [
            ['2', '2 seconds'],
            ['4', '4 seconds'],
        ],
        amountLabel: 'Assumed response time (seconds)',
        answers: ['Deadline exceeded', 'Response received'],
        question: 'The caller’s deadline expires. Which conclusion is safe?',
        choices: ['The service definitely did no work', 'The caller stopped waiting; work may have happened'],
        correct: 1,
        explanation:
            'Client and server can observe different outcomes. Timeout alone does not establish whether an operation changed server state.',
        sources: [
            {
                id: 'grpc-core',
                title: 'gRPC · core concepts and lifecycle',
                url: 'https://grpc.io/docs/what-is-grpc/core-concepts/',
                read: 'Read service definitions and unary/streaming method descriptions on 2026-10-29.',
                publisher: 'gRPC',
            },
            {
                id: 'grpc-deadlines',
                title: 'gRPC · deadlines',
                url: 'https://grpc.io/docs/guides/deadlines/',
                read: 'Read deadline expiration and cancellation on 2026-10-29.',
                publisher: 'gRPC',
            },
        ],
    },
    graphql: {
        id: 'graphql',
        title: 'Let the screen choose its data shape',
        number: 19,
        lede: 'Ask for a name, then add post titles. Watch the work fan out behind one request.',
        why: 'Useful when different screens need different selections from related data.',
        prereq: ['api-design', 'API contracts'],
        detail: 'A schema defines available fields and their types. A resolver supplies a field’s value. Selecting fewer response fields does not automatically reduce database work: resolver design, batching, caching, authorization and query limits remain server responsibilities. The lab deliberately assumes a naive per-user post lookup.',
        inputLabel: 'Selected fields',
        variants: [
            ['name', 'user { name }'],
            ['nested', 'user { name posts { title } }'],
        ],
        amountLabel: 'Users in the illustrative result',
        answers: ['Name only', 'Name and posts'],
        question:
            'A nested query uses one client request. How many database queries must the server execute?',
        choices: ['Exactly one', 'It depends on resolvers and batching'],
        correct: 1,
        explanation: 'The selection describes the response shape, not a fixed database execution plan.',
        sources: [
            {
                id: 'graphql-query',
                title: 'GraphQL · queries and field selection',
                url: 'https://graphql.org/learn/queries/',
                read: 'Read fields, nested selection and arguments on 2026-10-29.',
                publisher: 'GraphQL Foundation',
            },
            {
                id: 'graphql-execution',
                title: 'GraphQL specification · executing selection sets',
                url: 'https://spec.graphql.org/October2021/#sec-Executing-Selection-Sets',
                read: 'Read §6.3 and field execution on 2026-10-29. Fixed October 2021 edition, not a claim about the latest release.',
                publisher: 'GraphQL specification project',
            },
        ],
    },
    realtime: {
        id: 'realtime',
        title: 'Updates without the refresh button',
        number: 20,
        lede: 'Compare asking again, receiving a server event, and keeping a two-way conversation open.',
        why: 'Useful for live dashboards, notifications and collaborative applications.',
        prereq: ['http', 'HTTP exchanges'],
        detail: 'Polling sends repeated requests and can leave an update waiting for the next poll. EventSource receives server-sent events over HTTP and supports reconnection. WebSocket supplies two-way messages after setup. Neither replaces application-level recovery, authorization or a strategy for slow consumers.',
        inputLabel: 'Required direction',
        variants: [
            ['feed', 'Server updates a dashboard'],
            ['both', 'Client and server both send live messages'],
        ],
        answers: ['SSE', 'WebSocket'],
        question:
            'A browser reconnects after losing its connection. Are all missed application events automatically recovered?',
        choices: [
            'Yes, the transport guarantees application history',
            'No, recovery depends on application and replay design',
        ],
        correct: 1,
        explanation:
            'Reconnect is not a complete recovery policy. Event IDs and retained replay history can help, but the application must define their behavior.',
        sources: [
            {
                id: 'sse',
                title: 'WHATWG HTML · server-sent events',
                url: 'https://html.spec.whatwg.org/multipage/server-sent-events.html',
                read: 'Read §9.2 introduction, processing and Last-Event-ID on 2026-10-29.',
                publisher: 'WHATWG',
            },
            {
                id: 'websocket',
                title: 'RFC 6455 · WebSocket overview',
                url: 'https://www.rfc-editor.org/rfc/rfc6455.html#section-1.2',
                read: 'Read §1.2 protocol overview on 2026-10-29.',
                publisher: 'IETF',
            },
        ],
    },
};
export function isApiLesson(id: string): id is ApiLessonId {
    return Object.hasOwn(API_LESSONS, id);
}
