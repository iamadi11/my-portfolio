'use client';

import React, { lazy } from 'react';

import NearViewport from '@/components/learn/kit/NearViewport';

/** Figs. 2 and 3 load their code only as the reader nears them, so it is not part of the page's first load. */
const Demux = lazy(() => import('./DemuxLab'));
const Network = lazy(() => import('./NetworkLab'));

export function DemuxLabLazy({
    fallback,
    pane = 'lab',
}: {
    fallback: React.ReactNode;
    pane?: 'learn' | 'lab';
}): React.JSX.Element {
    return (
        <NearViewport fallback={fallback}>
            <Demux pane={pane} />
        </NearViewport>
    );
}

export function NetworkLabLazy({
    fallback,
    pane = 'lab',
    watch = 'udp',
}: {
    fallback: React.ReactNode;
    pane?: 'learn' | 'lab';
    watch?: 'udp' | 'tcp';
}): React.JSX.Element {
    return (
        <NearViewport fallback={fallback}>
            <Network pane={pane} watch={watch} />
        </NearViewport>
    );
}
