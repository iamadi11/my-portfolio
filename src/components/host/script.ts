/**
 * Everything the 3D host can say, derived from one SiteContent.
 * Pure and dependency-free: the browser uses it to match questions,
 * and `npm run voice` runs it in Node (type stripping) to pre-render audio.
 * Keep imports type-only and relative.
 */
import type { SiteContent } from '../instrumented/content';

export type Line = {
    /** Content hash of what is spoken + voice; names the audio files. */
    id: string;
    /** Caption, as written. */
    text: string;
    /** What the voice reads (pronunciation-fixed). */
    speak: string;
};
export type Step = { line: Line; target: string };
export type Intent = { keys: string[]; line: Line; target?: string };
export type Script = { voice: string; tour: Step[]; intents: Intent[]; fallback: Line; prompts: string[] };

export type HostConfig = {
    /** Exported LAM avatar ZIP, served from /public. */
    avatar: string;
    /** The 2D portrait the avatar starts as. */
    portrait: string;
    /** Kokoro voice id, e.g. 'am_michael'. */
    voice: string;
    /** Extra pronunciation fixes: written form → spoken form. */
    say?: Record<string, string>;
};

/** Written forms TTS reads badly. Content can add its own via HostConfig.say. */
const SAY: Record<string, string> = {
    '~': 'about ',
    '–': ' to ',
    '—': ', ',
    'Next.js': 'Next J S',
    'Node.js': 'Node J S',
    'Express.js': 'Express',
    'B.Tech': 'B Tech',
    npm: 'N P M',
    MCP: 'M C P',
    PWA: 'P W A',
    SSE: 'S S E',
    CI: 'C I',
    UI: 'U I',
};

const MONTHS: Record<string, string> = {
    Jan: 'January',
    Feb: 'February',
    Mar: 'March',
    Apr: 'April',
    Jun: 'June',
    Jul: 'July',
    Aug: 'August',
    Sep: 'September',
    Oct: 'October',
    Nov: 'November',
    Dec: 'December',
};
const NUMERALS: Record<string, string> = { I: 'one', II: 'two', III: 'three' };

function hash(text: string): string {
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
        h ^= text.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(36);
}

const list = (items: string[]): string =>
    items.length < 2 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

const plain = (text: string): string => text.replace(/\s*\([^)]*\)/g, '').trim();

export function buildScript(content: SiteContent, host: HostConfig): Script {
    const { profile, projects, practice } = content;
    const say: Record<string, string> = { ...SAY, ...host.say };
    const rules = Object.keys(say)
        .sort((a, b) => b.length - a.length)
        .map((word): [RegExp, string] => {
            const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pattern = `${/^\w/.test(word) ? '\\b' : ''}${escaped}${/\w$/.test(word) ? '\\b' : ''}`;
            return [new RegExp(pattern, 'g'), say[word]];
        });

    const spoken = (text: string): string => {
        let out = text;
        for (const [re, to] of rules) out = out.replace(re, to);
        out = out
            .replace(/\+(\d)/g, 'plus $1')
            .replace(/(\d)\+/g, '$1 plus')
            .replace(
                /([\w.+-]+)@([\w-]+)\.([\w.]+)/g,
                (_, user: string, domain: string, tld: string) =>
                    `${user.replace(/\./g, ' dot ')} at ${domain} dot ${tld.replace(/\./g, ' dot ')}`
            )
            .replace(/\d{5,}/g, (digits) => digits.split('').join(' '))
            .replace(/\b(Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g, (month) => MONTHS[month])
            .replace(
                /\b(Engineer|Developer|Lead|Architect|Manager|SDE|Analyst|Scientist) (III|II|I)\b/g,
                (_, title: string, n: string) => `${title} ${NUMERALS[n]}`
            );
        return out.replace(/\s+/g, ' ').trim();
    };
    const line = (text: string): Line => {
        const speak = spoken(text);
        return { id: hash(`${host.voice}|${speak}`), text, speak };
    };

    const first = profile.name.split(/\s+/)[0];
    const city = profile.location.split(',')[0];
    const [latest, ...earlier] = practice.experience;
    const orgs = [...new Set(practice.experience.map((row) => row.org))];
    const skills = (practice.skills ?? []).map((group) => ({
        group: group.group,
        items: group.items.split(',').map((item) => plain(item.trim())),
    }));
    const school = practice.education?.[0];
    const contact = profile.phone
        ? `The best way to reach me is email, ${profile.email}, or call ${profile.phone.label}.`
        : `The best way to reach me is email: ${profile.email}.`;

    const tour: Step[] = [
        {
            target: 'top',
            line: line(
                `Hi, I'm ${first}, a ${profile.role} in ${city}. Let me show you around. Stop me any time, or just ask.`
            ),
        },
        {
            target: 'work',
            line: line(
                `Here's my work: ${projects.length} projects. Let's start with ${projects[0]?.title ?? 'the first one'}.`
            ),
        },
        ...projects.map((project) => ({
            target: project.id,
            line: line(`${project.title}. ${project.summary} Built with ${list(project.stack)}.`),
        })),
        ...(latest
            ? [
                  {
                      target: 'about',
                      line: line(
                          `Most recently I was ${latest.role} at ${latest.org}.${earlier.length ? ` Before that, ${list([...new Set(earlier.map((row) => row.org))].filter((org) => org !== latest.org))}.` : ''}`
                      ),
                  },
              ]
            : []),
        ...(skills.length
            ? [
                  {
                      target: 'about',
                      line: line(
                          `Day to day I work with ${list(skills.flatMap((group) => group.items).slice(0, 6))}. The full list is on screen.`
                      ),
                  },
              ]
            : []),
        {
            target: 'reply',
            line: line(`That's the tour. ${contact} Or ask me anything about my work.`),
        },
    ];

    const intents: Intent[] = [
        {
            keys: ['hello', 'hi', 'hey', 'good morning', 'good evening'],
            line: line(`Hi! Ask me about my work, my experience, my skills, or how to reach me.`),
        },
        {
            keys: ['who are you', 'about you', 'yourself', 'introduce', 'summary', 'background'],
            line: line(`I'm ${profile.name}, a ${profile.role} in ${city}. ${profile.statement}`),
            target: 'about',
        },
        {
            keys: [
                'experience',
                'worked',
                'work history',
                'companies',
                'company',
                'jobs',
                'career',
                'employer',
                'years',
            ],
            line: line(
                `I've worked at ${list(orgs)}.${latest ? ` Most recently I was ${latest.role} at ${latest.org}, ${latest.period}.` : ''}`
            ),
            target: 'about',
        },
        ...orgs.map((org) => {
            const rows = practice.experience.filter((row) => row.org === org);
            return {
                keys: [org.toLowerCase(), org.split(/\s+/)[0].toLowerCase()],
                line: line(
                    `At ${org} I was ${list(rows.map((row) => `${row.role}, ${row.period}`).reverse())}.`
                ),
                target: 'about',
            };
        }),
        {
            keys: ['projects', 'project', 'built', 'build', 'portfolio', 'open source', 'github', 'side'],
            line: line(
                `My projects are ${list(projects.map((project) => project.title))}. Ask about any of them.`
            ),
            target: 'work',
        },
        ...projects.map((project) => ({
            keys: [project.title, project.id, project.title.replace(/-/g, ' ')].map((key) =>
                key.toLowerCase()
            ),
            line: line(`${project.title}: ${project.summary} It's built with ${list(project.stack)}.`),
            target: project.id,
        })),
        {
            keys: ['skills', 'skill', 'stack', 'tech', 'technologies', 'languages', 'tools', 'good at'],
            line: line(
                skills.length
                    ? `${skills
                          .slice(0, 2)
                          .map((group) => `${group.group}: ${list(group.items.slice(0, 5))}`)
                          .join('. ')}. The rest is on screen.`
                    : `My stack is listed with each project.`
            ),
            target: 'about',
        },
        ...skills.map((group) => ({
            keys: [group.group.toLowerCase()],
            line: line(`${group.group}: ${list(group.items)}.`),
            target: 'about',
        })),
        ...skills.flatMap((group) =>
            group.items.map((item) => ({
                keys: [item.toLowerCase()],
                line: line(`Yes, ${item} is part of my ${group.group.toLowerCase()} work.`),
                target: 'about',
            }))
        ),
        ...(school
            ? [
                  {
                      keys: ['education', 'study', 'studied', 'college', 'degree', 'university', 'school'],
                      line: line(`I studied ${school.role} at ${school.org}, ${school.period}.`),
                      target: 'about',
                  },
              ]
            : []),
        {
            keys: ['contact', 'email', 'reach', 'hire', 'talk', 'phone', 'call', 'interview', 'connect'],
            line: line(contact),
            target: 'reply',
        },
        {
            keys: ['available', 'availability', 'open to', 'looking', 'opportunities', 'notice'],
            line: line(`${profile.availability}. ${contact}`),
            target: 'reply',
        },
        {
            keys: ['where', 'location', 'based', 'city', 'live', 'relocate', 'remote', 'time zone'],
            line: line(`I'm based in ${profile.location}.`),
        },
    ];

    return {
        voice: host.voice,
        tour,
        intents,
        fallback: line(
            `That's not in my notes. Try asking about my work, my experience, my skills, or how to reach me.`
        ),
        prompts: [
            'What have you built?',
            `Tell me about ${projects[0]?.title ?? 'a project'}`,
            'Where have you worked?',
            'How do I reach you?',
        ],
    };
}

/** Every line the host can say, de-duplicated. */
export function allLines(script: Script): Line[] {
    const seen = new Map<string, Line>();
    for (const l of [
        ...script.tour.map((step) => step.line),
        ...script.intents.map((intent) => intent.line),
        script.fallback,
    ]) {
        seen.set(l.id, l);
    }
    return [...seen.values()];
}

const normal = (text: string): string =>
    ` ${text
        .toLowerCase()
        .replace(/[^a-z0-9.+#\s-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()} `;

/**
 * Picks the intent whose keys best match the question. Longer keys win, so
 * "tata 1mg" beats "experience". Returns null when nothing matches.
 * ponytail: keyword scoring, no NLP. Swap for embeddings if questions outgrow it.
 */
export function match(question: string, intents: Intent[]): Intent | null {
    const q = normal(question);
    let best: Intent | null = null;
    let bestScore = 0;
    for (const intent of intents) {
        let score = 0;
        for (const key of intent.keys) {
            if (q.includes(normal(key))) score = Math.max(score, key.length);
        }
        if (score > bestScore) {
            best = intent;
            bestScore = score;
        }
    }
    return best;
}
