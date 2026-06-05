'use client';

import { useEffect, useState } from 'react';

import '@/components/v2/v2.css';

import { useRoute, TopNav, CommandPalette } from '@/components/v2/Chrome';
import FloatingNav from '@/components/v2/FloatingNav';
import { PageHome, PageWork, PageProject, PageAbout, PageContact } from '@/components/v2/Pages';
import ScrollSetup from '@/components/v2/ScrollSetup';

export default function V2Page(): JSX.Element {
    const route = useRoute();
    const [cmdOpen, setCmdOpen] = useState(false);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setCmdOpen(true);
            }
            if (e.key === 'Escape') setCmdOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const routeKey = route.route + (route.id || '');
    const isHome = route.route === 'home';

    let page: React.ReactNode = null;
    if (isHome) page = <PageHome key={routeKey} />;
    else if (route.route === 'work') page = <PageWork key={routeKey} />;
    else if (route.route === 'project') page = <PageProject key={routeKey} id={route.id} />;
    else if (route.route === 'about') page = <PageAbout key={routeKey} />;
    else if (route.route === 'contact') page = <PageContact key={routeKey} />;

    return (
        /* gm-home class enables ghost nav + no dock */
        <div className={isHome ? 'v2-root gm-home' : 'v2-root'}>
            <ScrollSetup />

            <div className="v2-bg-stage" />
            <div className="v2-bg-grid" />

            {/* Ghost nav on home — minimal logo only; full chrome on inner routes */}
            <TopNav route={route.route} />
            <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />

            {/* Dot nav — home only */}
            {isHome && <FloatingNav />}

            <div id="v2-content">
                {page}

                {/* Minimal footer — non-home routes only */}
                {!isHome && (
                    <footer className="v2-footer">
                        <span>© 2026 ADITYA RAJ · FRONTEND ENGINEER II · BENGALURU</span>
                    </footer>
                )}
            </div>
        </div>
    );
}
