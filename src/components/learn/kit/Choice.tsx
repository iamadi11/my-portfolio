'use client';

import React, { useId } from 'react';

/** A labelled radio group drawn as segmented buttons (`.ln-seg`). Shared by the chapter figures. */
export default function Choice<T extends string | number>({
    legend,
    options,
    label,
    value,
    onChange,
}: {
    legend: string;
    options: readonly T[];
    label: (o: T) => string;
    value: T | null;
    onChange: (v: T) => void;
}): React.JSX.Element {
    const name = useId();
    return (
        <fieldset>
            <legend>{legend}</legend>
            <div className="ln-seg">
                {options.map((o) => (
                    <label key={String(o)}>
                        <input
                            type="radio"
                            name={name}
                            value={String(o)}
                            checked={value === o}
                            onChange={() => onChange(o)}
                        />
                        {label(o)}
                    </label>
                ))}
            </div>
        </fieldset>
    );
}
