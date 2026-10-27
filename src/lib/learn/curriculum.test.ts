import { describe, expect, it } from 'vitest';

import { parseCurriculum, readCurriculum } from './curriculum';

const SAMPLE = `# Curriculum
<!-- graph:start -->
| id | order | stage | title | prereqs | paths | status |
| --- | --- | --- | --- | --- | --- | --- |
| b | 2 | 1 | Second | a | beginner | planned |
| a | 1 | 1 | First |  | beginner interview | authored |
| c | 3 | 2 | Third | b | production | planned |
<!-- graph:end -->
### Stage 1. Foundations
### Stage 2. Later
`;

describe('parseCurriculum', () => {
    it('groups chapters by stage in order, with stage names from the objectives headings', () => {
        const stages = parseCurriculum(SAMPLE);
        expect(stages.map((s) => [s.n, s.name, s.chapters.map((c) => c.id)])).toEqual([
            [1, 'Foundations', ['a', 'b']],
            [2, 'Later', ['c']],
        ]);
        expect(stages[0].chapters[0]).toEqual({
            id: 'a',
            order: 1,
            stage: 1,
            title: 'First',
            paths: ['beginner', 'interview'],
            status: 'authored',
        });
    });

    it('returns nothing for a file without the graph markers', () => {
        expect(parseCurriculum('# nothing')).toEqual([]);
    });
});

describe('the real CURRICULUM.md', () => {
    it('parses into 119 chapters in 12 named stages, web-request first', () => {
        const stages = readCurriculum();
        expect(stages).toHaveLength(12);
        expect(stages.flatMap((s) => s.chapters)).toHaveLength(119);
        expect(stages.every((s) => !s.name.startsWith('Stage '))).toBe(true);
        expect(stages[0].chapters[0].id).toBe('web-request');
    });
});
