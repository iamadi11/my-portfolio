import React from 'react';

/** The course's arrowhead, for `markerEnd={`url(#${id})`}` on a line. Ids must be unique per page. */
export default function Arrowhead({ id }: { id: string }): React.JSX.Element {
    return (
        <marker id={id} viewBox="0 0 10 10" refX={10} refY={5} markerWidth={7} markerHeight={7} orient="auto">
            <path d="M0,1.7 L10,5 L0,8.3 z" className="arrow" />
        </marker>
    );
}
