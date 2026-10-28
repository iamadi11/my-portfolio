import React from 'react';

/** A citation mark: numbered links to the chapter's Sources list (`#src-<id>`), with a readable accessible name. */
function Cite({
    ids,
    numbers,
    titles,
    at,
}: {
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
                        href={`#src-${id}`}
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

/** A chapter's citation component, bound to its sources: `const C = citeFor(SOURCES, SOURCE_NUMBER)`, then
 * `<C ids={['rfc791']} at="§3.1" />`. */
export function citeFor(
    sources: readonly { id: string; title: string }[],
    numbers: Readonly<Record<string, number>>
): (props: { ids: string[]; at?: string }) => React.JSX.Element {
    const titles: Record<string, string> = Object.fromEntries(sources.map((s) => [s.id, s.title]));
    return function C({ ids, at }) {
        return <Cite ids={ids} at={at} numbers={numbers} titles={titles} />;
    };
}
