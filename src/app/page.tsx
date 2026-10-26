import React from 'react';

import Driver from '@/components/blueprint/Driver';
import Assemblies from '@/components/blueprint/sections/Assemblies';
import Contact from '@/components/blueprint/sections/Contact';
import Nav from '@/components/blueprint/sections/Nav';
import Results from '@/components/blueprint/sections/Results';
import Revisions from '@/components/blueprint/sections/Revisions';
import Title from '@/components/blueprint/sections/Title';
import Variables from '@/components/blueprint/sections/Variables';

/**
 * `/` is a drawing set: six sheets drawn the way Apple's dimensional drawings are (via
 * enesozturk/dimensional-drawing, MIT). Scrolling moves a pen across them. All copy comes from `SITE`
 * (`src/content/site.ts`); spec in `docs/blueprint.md`.
 */
/** Rebuilt daily (ISR): live project numbers and the career chain's "now" stay current without a deploy. */
export const revalidate = 86400;

export default function Page(): React.JSX.Element {
    return (
        <>
            <Nav />
            <main id="main-content" tabIndex={-1}>
                <Title />
                <Results />
                <Assemblies />
                <Revisions />
                <Variables />
                <Contact />
            </main>
            <Driver />
        </>
    );
}
