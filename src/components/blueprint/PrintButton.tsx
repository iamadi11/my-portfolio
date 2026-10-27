'use client';

import React from 'react';

/** Version of the print template (`src/app/print.css`); bump when its page rules change. */
const TEMPLATE = 'v1';

/**
 * "Download as PDF": the browser's print dialog (Save as PDF) on the A3 print stylesheet. Also renders the
 * print-only stamp that `print.css` places at the top of the first page.
 */
export default function PrintButton({ origin }: { origin: string }): React.JSX.Element {
    return (
        <>
            <button type="button" className="contact-print" onClick={() => window.print()}>
                Download as PDF · A3
            </button>
            <span className="print-stamp" aria-hidden="true">
                Printed from {origin} · Template {TEMPLATE}
            </span>
        </>
    );
}
