import type { FilmBeat, FilmNode, LessonFilmData } from '@/lib/learn/film-model';

/** Source-backed conceptual workflows, not measured traces or production reliability claims. */
function film(
    id: string,
    question: string,
    takeaway: string,
    sourceHref: string,
    labels: [string, FilmNode['kind']][],
    beats: FilmBeat[]
): LessonFilmData {
    return {
        id: `project-${id}`,
        question,
        takeaway,
        sourceHref,
        nodes: labels.map(([label, kind], i) => ({ id: String(i), label, kind, x: 0, y: 0 })),
        links: Array.from(
            new Map(
                beats
                    .filter((b) => b.from && b.to)
                    .map((b) => [`${b.from}-${b.to}`, [b.from!, b.to!] as [string, string]])
            ).values()
        ),
        beats,
    };
}
const eidos = 'https://github.com/sweidos/eidos/blob/6676f6763c4aac25854c6aa827afb275002fbb3f/README.md';
const mcp = 'https://github.com/iamadi11/mcp-ui-poc/blob/e45df38ab4af32e557cf8f9622dc4e6e135ca260/README.md';
const spatial =
    'https://github.com/iamadi11/spatial/blob/bafde9ff9ef4bce6e44496550b3b2514e9c4ac14/src/adapters/metrics.ts';
const sidecar =
    'https://github.com/iamadi11/progressive-image/blob/e78b8deebf748b5fd0e7daaeab5701f09b812fe9/packages/runtime/src/loader.ts';
const lights =
    'https://github.com/iamadi11/video-light-sync/blob/03fdf6753b7d565041de6342f002bed8d5d02793/README.md';
export const PROJECT_FILMS: Record<string, LessonFilmData> = {
    eidos: film(
        'eidos',
        'What happens to a write when the connection disappears?',
        'Durable client intent enables replay. At-least-once delivery still needs server-side deduplication.',
        eidos,
        [
            ['Browser', 'computer'],
            ['IndexedDB queue', 'store'],
            ['Remote API', 'server'],
        ],
        [
            {
                title: 'Persist intent',
                caption: 'Save a mutation and its stable operation key before attempting delivery.',
                from: '0',
                to: '1',
                counts: { 1: 1 },
                values: { 1: 'pending · key K' },
            },
            {
                title: 'Attempt delivery',
                caption: 'The worker sends the saved operation. This example assumes the server applies it.',
                from: '1',
                to: '2',
                values: { 2: 'effect applied for K' },
            },
            {
                title: 'Response uncertain',
                caption:
                    'The connection fails before a success is recorded locally. Pending does not mean the server did nothing.',
                values: { 1: 'still pending', 2: 'effect may already exist' },
            },
            {
                title: 'Replay same identity',
                caption:
                    'Retry key K. A server implementing the required deduplication contract can recognize the earlier operation.',
                from: '1',
                to: '2',
                values: { 2: 'deduplication assumed' },
            },
            {
                title: 'Record confirmation',
                caption:
                    'After a confirmed response, local pending work clears. This is not an exactly-once transport guarantee.',
                from: '2',
                to: '1',
                counts: { 1: 0 },
                values: { 1: 'confirmed' },
            },
        ]
    ),
    'mcp-ui': film(
        'mcp-ui',
        'How does a message become an embeddable widget?',
        'Publishing creates a versioned artifact. A pinned version differs from the moving live alias.',
        mcp,
        [
            ['Author', 'computer'],
            ['Studio API', 'server'],
            ['Version store', 'store'],
            ['Embed viewer', 'computer'],
        ],
        [
            {
                title: 'Describe the widget',
                caption:
                    'Send a request with an optional API URL. This is an authored example, not a recorded model output.',
                from: '0',
                to: '1',
                values: { 1: 'draft request' },
            },
            {
                title: 'Prepare a preview',
                caption:
                    'The studio prepares the widget specification and renderable preview for the author to inspect.',
                from: '1',
                to: '0',
                values: { 0: 'preview ready' },
            },
            {
                title: 'Publish a version',
                caption:
                    'Persist the published artifact under a version identity. Configured storage can use Redis and MongoDB.',
                from: '1',
                to: '2',
                values: { 2: 'published version V' },
            },
            {
                title: 'Resolve the embed',
                caption:
                    'A viewer requests the live embed alias, or explicitly pins a version with the version query parameter.',
                from: '3',
                to: '2',
                values: { 3: 'request ?v=V' },
            },
            {
                title: 'Render the selected version',
                caption:
                    'A pinned embed keeps its selected version when later versions are published. The unpinned live alias can change.',
                from: '2',
                to: '3',
                values: { 3: 'render version V' },
            },
        ]
    ),
    spatial: film(
        'spatial',
        'How does observed browser behavior become a useful warning?',
        'Frame-drop signals and optional memory observations inform diagnostics; they are not a direct FPS benchmark.',
        spatial,
        [
            ['Developing UI', 'computer'],
            ['Metrics adapters', 'server'],
            ['Rules engine', 'server'],
            ['Dashboard', 'computer'],
        ],
        [
            {
                title: 'Observe work',
                caption:
                    'Development instrumentation collects render activity and browser performance signals.',
                from: '0',
                to: '1',
                values: { 1: 'observations' },
            },
            {
                title: 'Count frame drops',
                caption:
                    'The adapter counts a frame gap above twice its assumed 60 Hz baseline. This is a heuristic, not measured FPS.',
                values: { 1: 'gap > 2 × baseline' },
            },
            {
                title: 'Handle missing capabilities',
                caption:
                    'Browser memory data is optional. An unsupported API must not be described as measured memory usage.',
                values: { 1: 'memory when available' },
            },
            {
                title: 'Evaluate rules',
                caption:
                    'Rules evaluate the observed metrics. A warning identifies a development pattern to investigate.',
                from: '1',
                to: '2',
                values: { 2: 'diagnostic findings' },
            },
            {
                title: 'Inspect and act',
                caption:
                    'Show the findings in a dashboard. The developer must validate a cause and measure the effect of a fix.',
                from: '2',
                to: '3',
                values: { 3: 'review findings' },
            },
        ]
    ),
    sidecar: film(
        'sidecar',
        'Does every image pass through the same loading stages?',
        'The prototype races preview and full-image work. Tiles are a fallback after full-fetch failure, not a mandatory stage.',
        sidecar,
        [
            ['Browser loader', 'computer'],
            ['Binary sidecar', 'store'],
            ['Full image', 'store'],
        ],
        [
            {
                title: 'Start concurrent work',
                caption:
                    'The loader starts sidecar and full-image work concurrently. Animation order is illustrative; neither fetch is guaranteed to win.',
                values: { 1: 'pending', 2: 'pending' },
            },
            {
                title: 'Preview wins this example',
                caption: 'Assume the sidecar arrives first. Parse it to prepare an intermediate preview.',
                from: '1',
                to: '0',
                values: { 0: 'intermediate preview' },
            },
            {
                title: 'Full image completes',
                caption:
                    'When the full fetch succeeds, commit the complete image. It can also finish before the preview.',
                from: '2',
                to: '0',
                values: { 0: 'full image' },
            },
            {
                title: 'Separate failure branch',
                caption:
                    'Only if the full fetch fails does the loader attempt the available tile fallback. It is not part of this successful trace.',
                values: { 2: 'success in this example' },
            },
            {
                title: 'Prototype boundary',
                caption:
                    'The public checkout lacks the referenced build package. This walkthrough describes the inspectable runtime, not a verified complete toolchain.',
                values: { 0: 'runtime prototype' },
            },
        ]
    ),
    'video-light-sync': film(
        'video-light-sync',
        'How do screen colors reach two different kinds of light?',
        'The local hub dispatches device-specific commands. Dispatch is not measured physical illumination or a hardware acknowledgment.',
        lights,
        [
            ['Screen capture', 'computer'],
            ['Vision + local hub', 'server'],
            ['Yeelight', 'light'],
            ['WLED', 'light'],
        ],
        [
            {
                title: 'Capture frames',
                caption: 'The capture pipeline supplies image data for color extraction.',
                from: '0',
                to: '1',
                values: { 1: 'frame data' },
            },
            {
                title: 'Extract and smooth',
                caption:
                    'Vision processing derives colors and smoothing reduces abrupt changes. Playback seconds here are not device latency.',
                values: { 1: 'smoothed color command' },
            },
            {
                title: 'Send Yeelight command',
                caption:
                    'The Yeelight adapter writes its command over TCP. Socket delivery does not prove a bulb has changed.',
                from: '1',
                to: '2',
                values: { 2: 'TCP command sent' },
            },
            {
                title: 'Send WLED command',
                caption:
                    'The WLED adapter dispatches color data over UDP; it does not receive a reliable delivery acknowledgment.',
                from: '1',
                to: '3',
                values: { 3: 'UDP command sent' },
            },
            {
                title: 'Hardware boundary',
                caption:
                    'Without a configured IP, adapters use mock mode. These drawings do not claim measured hardware response or latency.',
                values: { 1: 'mock without configured IP' },
            },
        ]
    ),
};
