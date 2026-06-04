'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import '@/components/v2/v2.css';

import { useRoute, TopNav, FloatingDock, CommandPalette } from '@/components/v2/Chrome';
import { PageHome, PageWork, PageProject, PageAbout, PageContact } from '@/components/v2/Pages';
import ScrollSetup from '@/components/v2/ScrollSetup';

export default function V2Page(): JSX.Element {
    const route = useRoute();
    const [cmdOpen, setCmdOpen] = useState(false);

    // ⌘K / Ctrl+K to open command palette
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

    let page: React.ReactNode = null;
    if (route.route === 'home') page = <PageHome key={routeKey} />;
    else if (route.route === 'work') page = <PageWork key={routeKey} />;
    else if (route.route === 'project') page = <PageProject key={routeKey} id={route.id} />;
    else if (route.route === 'about') page = <PageAbout key={routeKey} />;
    else if (route.route === 'contact') page = <PageContact key={routeKey} />;

    return (
        <div className="v2-root">
            {/* GSAP scroller proxy for .v2-root */}
            <ScrollSetup />

            {/* Ambient background */}
            <div className="v2-bg-stage" />
            <div className="v2-bg-grid" />
            <div className="v2-bg-noise" />

            {/* Chrome */}
            <TopNav route={route.route} />
            <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
            <FloatingDock onCmd={() => setCmdOpen(true)} />

            {/* Page content */}
            <div id="v2-content">
                {page}

                {/* Footer */}
                <footer className="v2-footer">
                    <span>© 2026 ADITYA RAJ · FRONTEND ENGINEER II · BENGALURU</span>
                    <span style={{ margin: '0 16px', opacity: 0.3 }}>·</span>
                    <Link
                        href="/"
                        style={{
                            color: 'var(--v2-ink-3)',
                            textDecoration: 'none',
                            letterSpacing: '0.14em',
                            transition: 'color 0.2s',
                        }}
                        onMouseEnter={(e) =>
                            ((e.target as HTMLAnchorElement).style.color = 'var(--v2-ink-2)')
                        }
                        onMouseLeave={(e) =>
                            ((e.target as HTMLAnchorElement).style.color = 'var(--v2-ink-3)')
                        }
                    >
                        ← V1
                    </Link>
                </footer>
            </div>
        </div>
    );
}
