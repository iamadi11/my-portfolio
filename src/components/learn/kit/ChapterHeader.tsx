import React from 'react';

/** A chapter's title block: kicker, the page's `h1` (id `ch-h`, which the article is labelled by) and a lede. */
export default function ChapterHeader({
    kicker,
    title,
    lede,
}: {
    kicker: string;
    title: string;
    lede: React.ReactNode;
}): React.JSX.Element {
    return (
        <header className="bp-sheet ln-head">
            <p className="ln-kicker">{kicker}</p>
            <h1 id="ch-h" className="ln-h1">
                {title}
            </h1>
            <p className="ln-lede">{lede}</p>
        </header>
    );
}
