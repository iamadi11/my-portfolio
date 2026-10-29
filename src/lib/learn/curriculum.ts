import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The course's learning graph, read from `docs/system-design/CURRICULUM.md` at build time. That file is the only
 * place chapter ids, titles, stages and status live (CLAUDE.md §11); the app never keeps its own copy. Same table
 * format as the skill's `course.mjs`.
 */

export type Chapter = {
    id: string;
    order: number;
    stage: number;
    title: string;
    paths: string[];
    prerequisites?: string[];
    status: string;
};
export type Stage = { n: number; name: string; chapters: Chapter[] };

export function parseCurriculum(text: string): Stage[] {
    const graph = /<!-- graph:start -->([\s\S]*?)<!-- graph:end -->/.exec(text)?.[1] ?? '';
    const rows = graph
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.startsWith('|'))
        .map((l) =>
            l
                .slice(1, -1)
                .split('|')
                .map((c) => c.trim())
        )
        .filter((c) => c[0] !== 'id' && !/^-+$/.test(c[0]));
    const chapters: Chapter[] = rows.map((c) => ({
        id: c[0],
        order: Number(c[1]),
        stage: Number(c[2]),
        title: c[3],
        prerequisites: c[4] ? c[4].split(/\s+/) : [],
        paths: c[5] ? c[5].split(/\s+/) : [],
        status: c[6],
    }));
    const names = new Map(
        [...text.matchAll(/^### Stage (\d+)\. (.+)$/gm)].map((m) => [Number(m[1]), m[2].trim()] as const)
    );
    return [...new Set(chapters.map((c) => c.stage))]
        .sort((a, b) => a - b)
        .map((n) => ({
            n,
            name: names.get(n) ?? `Stage ${n}`,
            chapters: chapters.filter((c) => c.stage === n).sort((a, b) => a.order - b.order),
        }));
}

export function readCurriculum(): Stage[] {
    return parseCurriculum(readFileSync(join(process.cwd(), 'docs/system-design/CURRICULUM.md'), 'utf8'));
}
