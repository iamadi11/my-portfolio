import React from 'react';

import type { Viewport } from 'next';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import HostHero from '@/components/host/HostHero';
import { buildScript } from '@/components/host/script';
import InstrumentedSite from '@/components/instrumented/InstrumentedSite';
import { HOST, SITE } from '@/content/site';

/** Light page: browser chrome follows it. Title, description and JSON-LD come from the root layout. */
export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#f1f0ec',
    colorScheme: 'light',
};

const script = buildScript(SITE, HOST);

/**
 * The 3D head is offered only if its export is actually deployed. LAM's sample head
 * (someone else) is opt-in for local work on the 3D path: HOST_SAMPLE_AVATAR=1 npm run dev.
 */
const avatar = [HOST.avatar, process.env.HOST_SAMPLE_AVATAR === '1' ? '/avatar/sample.zip' : undefined].find(
    (path): path is string => Boolean(path) && existsSync(join(process.cwd(), 'public', path as string))
);

export default function Page(): React.JSX.Element {
    return (
        <InstrumentedSite
            content={SITE}
            intro={false}
            hero={<HostHero content={SITE} host={HOST} script={script} avatar={avatar} />}
        />
    );
}
