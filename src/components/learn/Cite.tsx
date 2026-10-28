import React from 'react';

import { sourceAnchor } from '@/content/learn/source-catalog';

/** A citation mark: a number that links to that chapter's list on `/learn/sources`. */
function Cite({
    chapter,
    ids,
    numbers,
    titles,
    at,
}: {
    chapter: string;
    ids: string[];
    numbers: Readonly<Record<string, number>>;
    titles: Readonly<Record<string, string>>;
    /** Section or part of the source, e.g. "§3.4". */
    at?: string;
}): React.JSX.Element {
    return (
        <span className="ln-cite">
            [
            {ids.map((id, i) => (
                <React.Fragment key={id}>
                    {i > 0 ? ', ' : null}
                    <a
                        href={`/learn/sources#${sourceAnchor(chapter, id)}`}
                        aria-label={`Source ${numbers[id]}: ${titles[id]}${at ? `, ${at}` : ''}`}
                    >
                        {numbers[id]}
                    </a>
                </React.Fragment>
            ))}
            {at ? ` ${at}` : null}]
        </span>
    );
}

/** A chapter's citation component: `const C = citeFor('web-request', SOURCES, SOURCE_NUMBER)`, then
 * `<C ids={['rfc791']} at="§3.1" />`. The number links to `/learn/sources`, not a list on the chapter. */
export function citeFor(
    chapter: string,
    sources: readonly { id: string; title: string }[],
    numbers: Readonly<Record<string, number>>
): (props: { ids: string[]; at?: string }) => React.JSX.Element {
    const titles: Record<string, string> = Object.fromEntries(sources.map((s) => [s.id, s.title]));
    return function C({ ids, at }) {
        return <Cite chapter={chapter} ids={ids} at={at} numbers={numbers} titles={titles} />;
    };
}
