'use client';

import { useState, useEffect, useRef } from 'react';

import { PROJECTS, IDENTITY } from './data';

type Route = { route: 'home' | 'work' | 'project' | 'about' | 'contact'; id?: string };

function parseHash(): Route {
    if (typeof window === 'undefined') return { route: 'home' };
    const h = (window.location.hash || '#/').replace(/^#/, '');
    const parts = h.split('/').filter(Boolean);
    if (parts.length === 0) return { route: 'home' };
    if (parts[0] === 'work' && parts[1]) return { route: 'project', id: parts[1] };
    if (parts[0] === 'work') return { route: 'work' };
    if (parts[0] === 'about') return { route: 'about' };
    if (parts[0] === 'contact') return { route: 'contact' };
    return { route: 'home' };
}

export function navigate(path: string) {
    if (typeof window === 'undefined') return;
    const next = '#' + path;
    if (window.location.hash === next) return;
    window.location.hash = path;
}

export function useRoute(): Route {
    const [r, setR] = useState<Route>({ route: 'home' });

    useEffect(() => {
        setR(parseHash());
        const onChange = () => {
            setR(parseHash());
            const root = document.querySelector('.v2-root');
            if (root) root.scrollTo({ top: 0, behavior: 'instant' });
        };
        window.addEventListener('hashchange', onChange);
        return () => window.removeEventListener('hashchange', onChange);
    }, []);

    return r;
}

/* ============================================================
   Top nav
   ============================================================ */
export function TopNav({ route }: { route: Route['route'] }) {
    return (
        <nav className="v2-topnav">
            <div className="v2-topnav-inner">
                <button className="v2-topnav-logo" onClick={() => navigate('/')}>
                    <span className="v2-topnav-logo-mark">A</span>
                    aditya.raj
                </button>
                <div className="v2-topnav-links">
                    {(
                        [
                            ['/', 'home', 'Home'],
                            ['/work', 'work', 'Work'],
                            ['/about', 'about', 'About'],
                            ['/contact', 'contact', 'Contact'],
                        ] as [string, string, string][]
                    ).map(([path, key, label]) => (
                        <button
                            key={path}
                            onClick={() => navigate(path)}
                            className={`v2-topnav-link${route === key || (route === 'project' && key === 'work') ? 'active' : ''}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>
        </nav>
    );
}

/* ============================================================
   Floating dock
   ============================================================ */
export function FloatingDock({ onCmd }: { onCmd: () => void }) {
    return (
        <div className="v2-dock">
            <DockBtn label="Home" icon="◐" onClick={() => navigate('/')} />
            <DockBtn label="Work" icon="▦" onClick={() => navigate('/work')} />
            <DockBtn label="About" icon="○" onClick={() => navigate('/about')} />
            <DockBtn label="Contact" icon="✉" onClick={() => navigate('/contact')} />
            <div className="v2-dock-sep" />
            <DockBtn label="⌘K" icon="⌕" onClick={onCmd} wide />
        </div>
    );
}

function DockBtn({
    label,
    icon,
    onClick,
    wide,
}: {
    label: string;
    icon: string;
    onClick: () => void;
    wide?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={`v2-dock-btn${wide ? 'v2-dock-btn-wide' : ''}`}
            title={label}
            aria-label={label}
        >
            <span style={{ fontSize: 14 }}>{icon}</span>
            {wide && <span style={{ fontSize: 11, color: 'var(--v2-ink-2)' }}>search</span>}
        </button>
    );
}

/* ============================================================
   Command palette
   ============================================================ */
interface CmdItem {
    id: string;
    label: string;
    hint?: string;
    kind: string;
    go: () => void;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [q, setQ] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open && inputRef.current) setTimeout(() => inputRef.current?.focus(), 50);
        if (!open) setQ('');
    }, [open]);

    const items: CmdItem[] = [
        { id: 'go-home', label: 'Home', kind: 'page', go: () => navigate('/') },
        { id: 'go-work', label: 'Work', kind: 'page', go: () => navigate('/work') },
        { id: 'go-about', label: 'About', kind: 'page', go: () => navigate('/about') },
        { id: 'go-contact', label: 'Contact', kind: 'page', go: () => navigate('/contact') },
        ...PROJECTS.map((p) => ({
            id: 'p-' + p.id,
            label: p.title,
            hint: p.subtitle,
            kind: 'project',
            go: () => navigate('/work/' + p.id),
        })),
        {
            id: 'l-email',
            label: 'Email Aditya',
            kind: 'link',
            go: () => window.open('mailto:' + IDENTITY.email),
        },
        { id: 'l-gh', label: 'GitHub', kind: 'link', go: () => window.open(IDENTITY.github, '_blank') },
        { id: 'l-li', label: 'LinkedIn', kind: 'link', go: () => window.open(IDENTITY.linkedin, '_blank') },
    ];

    const filtered = items.filter(
        (i) => !q || (i.label + ' ' + (i.hint || '')).toLowerCase().includes(q.toLowerCase())
    );

    if (!open) return null;

    return (
        <div className="v2-cmd-overlay" onClick={onClose}>
            <div className="v2-cmd-box" onClick={(e) => e.stopPropagation()}>
                <div className="v2-cmd-input-wrap">
                    <input
                        ref={inputRef}
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search work, pages, links…"
                        className="v2-cmd-input"
                    />
                </div>
                <div className="v2-cmd-list">
                    {filtered.map((it) => (
                        <button
                            key={it.id}
                            className="v2-cmd-item"
                            onClick={() => {
                                it.go();
                                onClose();
                            }}
                        >
                            <div>
                                <div style={{ fontSize: 14 }}>{it.label}</div>
                                {it.hint && (
                                    <div style={{ fontSize: 12, color: 'var(--v2-ink-3)', marginTop: 2 }}>
                                        {it.hint}
                                    </div>
                                )}
                            </div>
                            <span
                                className="v2-mono"
                                style={{ fontSize: 10, color: 'var(--v2-ink-3)', letterSpacing: '0.1em' }}
                            >
                                {it.kind.toUpperCase()}
                            </span>
                        </button>
                    ))}
                </div>
                <div className="v2-cmd-footer">
                    <span>↵ select</span>
                    <span>esc close</span>
                </div>
            </div>
        </div>
    );
}
