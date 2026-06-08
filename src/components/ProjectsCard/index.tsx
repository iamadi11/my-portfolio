'use client';

import React from 'react';

import clsx from 'clsx';
import { motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { FaLink, FaGithub } from 'react-icons/fa';

type ProjectItem = {
    title: string;
    description: string;
    tags: string[];
    githubLink: string;
    liveLink?: string;
    /** Tailwind gradient classes for the accent bar */
    accent: string;
    /** Short badge shown top-right of the card */
    badge?: string;
};

const featuredProject: ProjectItem & { snippet: string[] } = {
    title: 'Eidos',
    description:
        'Declarative offline-first abstraction layer for Service Workers. Replaces 40+ lines of Workbox / Cache API boilerplate with a 2-line intent-based API. Published on npm as @sweidos/eidos.',
    tags: ['TypeScript', 'Service Workers', 'Cache API', 'IndexedDB', 'npm'],
    liveLink: 'https://playground-iamadi11s-projects.vercel.app',
    githubLink: 'https://github.com/iamadi11/eidos',
    accent: 'from-amber-500 to-orange-500',
    badge: 'npm · OSS',
    snippet: [
        '$ npm install @sweidos/eidos',
        '',
        "import { eidos } from '@sweidos/eidos';",
        '',
        '// before: 40+ lines of Workbox config',
        '// after:',
        "eidos.cache('/api/products', { strategy: 'stale-while-revalidate' });",
        "eidos.prefetch(['/offline', '/shell']);",
    ],
};

const projectsData: ProjectItem[] = [
    {
        title: 'Mouse Follow',
        description:
            'Cursor-follow interaction demo showcasing smooth real-time mouse tracking with requestAnimationFrame. Deployed live on Vercel.',
        tags: ['React', 'Vite', 'TypeScript', 'Tailwind'],
        liveLink: 'https://mouse-follow-demo.vercel.app/',
        githubLink: 'https://github.com/iamadi11/mouse-follow',
        accent: 'from-cyan-500 to-sky-500',
        badge: 'Live demo',
    },
    {
        title: 'Spatial — UI Perf Optimizer',
        description:
            'Dev-time performance detection engine. Catches layout thrash and render hot-paths before code ships. Zero prod overhead, CI-compatible, MIT-licensed.',
        tags: ['TypeScript', 'Vitest', 'OSS'],
        liveLink: 'https://spatial-zeta.vercel.app/',
        githubLink: 'https://github.com/iamadi11/spatial',
        accent: 'from-violet-500 to-purple-500',
        badge: 'OSS',
    },
    {
        title: 'Dynamic MCP UI Generator',
        description:
            'Full-stack MCP UI demo: dynamic forms, dashboards, and charts generated from an MCP server. Schema-first, fully type-safe client + server.',
        tags: ['React 18', 'Node.js', 'Express', 'MCP'],
        liveLink: 'https://mcp-ui-poc.vercel.app/',
        githubLink: 'https://github.com/iamadi11/mcp-ui-poc',
        accent: 'from-emerald-500 to-teal-500',
        badge: 'Full-stack',
    },
];

const ProjectsCard: React.FC = () => {
    const prefersReducedMotion = useReducedMotion();
    const reduce = prefersReducedMotion === true;

    return (
        <motion.section
            aria-labelledby="projects-heading"
            className="border-t border-white/5 px-4 py-16 sm:px-6 sm:py-20"
            initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={reduce ? { duration: 0 } : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
            <div className="mx-auto max-w-6xl text-center">
                <h2
                    id="projects-heading"
                    className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl"
                >
                    Projects
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm text-zinc-500 sm:text-base">Public GitHub work</p>
                {/* Featured project — full width bento card */}
                <motion.div
                    className="mt-12 w-full"
                    initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-24px' }}
                    transition={reduce ? { duration: 0 } : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                    <div
                        className={clsx(
                            'overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]',
                            'shadow-[0_24px_80px_-32px_rgba(0,0,0,0.85)] backdrop-blur-md',
                            'cursor-default text-left transition-all duration-300',
                            'hover:border-amber-500/20 hover:shadow-[0_0_60px_-16px_rgba(251,146,60,0.15)]'
                        )}
                    >
                        {/* amber accent bar */}
                        <div
                            className={clsx('h-1 w-full bg-gradient-to-r', featuredProject.accent)}
                            aria-hidden
                        />

                        <div className="grid gap-0 lg:grid-cols-2">
                            {/* left: info */}
                            <div className="flex flex-col gap-4 p-6 sm:p-8">
                                <div className="flex items-start justify-between gap-3">
                                    <h3 className="text-xl font-bold tracking-tight text-zinc-100 sm:text-2xl">
                                        {featuredProject.title}
                                    </h3>
                                    {featuredProject.badge && (
                                        <span className="shrink-0 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold text-amber-300">
                                            {featuredProject.badge}
                                        </span>
                                    )}
                                </div>

                                <p className="flex-1 text-sm leading-relaxed text-zinc-400">
                                    {featuredProject.description}
                                </p>

                                <div className="flex flex-wrap gap-1.5">
                                    {featuredProject.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="rounded-md border border-white/[0.07] bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-zinc-500"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                <div className="flex items-center gap-4 border-t border-white/[0.06] pt-4 text-xs">
                                    <Link
                                        href={featuredProject.liveLink!}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex cursor-pointer items-center gap-2 text-amber-300/90 transition-colors hover:text-amber-200"
                                    >
                                        <FaLink className="size-3.5" aria-hidden />
                                        Playground
                                    </Link>
                                    <Link
                                        href={featuredProject.githubLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex cursor-pointer items-center gap-2 text-zinc-400 transition-colors hover:text-white"
                                    >
                                        <FaGithub className="size-3.5" aria-hidden />
                                        Code
                                    </Link>
                                </div>
                            </div>

                            {/* right: code snippet */}
                            <div
                                className={clsx(
                                    'flex items-center border-t border-white/[0.06] bg-black/30 p-6 sm:p-8',
                                    'lg:border-l lg:border-t-0'
                                )}
                            >
                                <pre
                                    className="w-full overflow-x-auto rounded-xl border border-white/[0.06] bg-zinc-950/60 p-4 text-[11px] leading-6 text-zinc-400 sm:text-xs"
                                    aria-label="Eidos usage example"
                                >
                                    {featuredProject.snippet.map((line, i) => {
                                        if (line.startsWith('$')) {
                                            return (
                                                <div key={i}>
                                                    <span className="text-amber-400">{'$ '}</span>
                                                    <span className="text-zinc-200">{line.slice(2)}</span>
                                                </div>
                                            );
                                        }
                                        if (line.startsWith('//')) {
                                            return (
                                                <div key={i} className="text-zinc-600">
                                                    {line}
                                                </div>
                                            );
                                        }
                                        if (line.startsWith('import')) {
                                            return (
                                                <div key={i}>
                                                    <span className="text-violet-400">import </span>
                                                    <span className="text-zinc-300">{'{ eidos } '}</span>
                                                    <span className="text-violet-400">from </span>
                                                    <span className="text-amber-300/80">
                                                        &apos;@sweidos/eidos&apos;
                                                    </span>
                                                    <span className="text-zinc-400">;</span>
                                                </div>
                                            );
                                        }
                                        if (line.startsWith('eidos')) {
                                            return (
                                                <div key={i}>
                                                    <span className="text-cyan-300">eidos</span>
                                                    <span className="text-zinc-400">{line.slice(5)}</span>
                                                </div>
                                            );
                                        }
                                        return <div key={i}>{line || ' '}</div>;
                                    })}
                                </pre>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Regular project cards */}
                <div className="mt-6 grid w-full gap-6 text-left [grid-template-columns:repeat(auto-fit,minmax(17rem,1fr))] lg:gap-8">
                    {projectsData.map((project, index) => (
                        <motion.div
                            key={project.githubLink}
                            initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-24px' }}
                            transition={
                                reduce
                                    ? { duration: 0 }
                                    : { delay: index * 0.06, duration: 0.38, ease: [0.22, 1, 0.36, 1] }
                            }
                            whileHover={
                                reduce
                                    ? { y: 0 }
                                    : { y: -6, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }
                            }
                            className="flex h-full min-h-0 min-w-0 will-change-transform"
                        >
                            <div
                                className={clsx(
                                    'flex size-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl',
                                    'border border-white/[0.08] bg-white/[0.03]',
                                    'shadow-[0_24px_80px_-32px_rgba(0,0,0,0.85)] backdrop-blur-md',
                                    'cursor-default transition-all duration-300',
                                    'hover:border-white/[0.14] hover:shadow-[0_28px_90px_-28px_rgba(0,0,0,0.6)]'
                                )}
                            >
                                {/* accent bar */}
                                <div
                                    className={clsx('h-1 w-full shrink-0 bg-gradient-to-r', project.accent)}
                                    aria-hidden
                                />

                                {/* body */}
                                <div className="flex flex-1 flex-col gap-4 p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className="text-base font-semibold leading-snug tracking-tight text-zinc-100">
                                            {project.title}
                                        </h3>
                                        {project.badge && (
                                            <span className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.05] px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                                                {project.badge}
                                            </span>
                                        )}
                                    </div>

                                    <p className="flex-1 text-xs leading-relaxed text-zinc-400">
                                        {project.description}
                                    </p>

                                    {/* tech pills */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {project.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="rounded-md border border-white/[0.07] bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-zinc-500"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* footer */}
                                <div
                                    className={clsx(
                                        'border-t border-white/[0.06] px-5 py-4 text-xs',
                                        project.liveLink
                                            ? 'flex flex-row justify-between'
                                            : 'flex justify-center'
                                    )}
                                >
                                    {project.liveLink ? (
                                        <>
                                            <Link
                                                href={project.liveLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex cursor-pointer items-center gap-2 text-cyan-300/90 transition-colors hover:text-cyan-200"
                                            >
                                                <FaLink className="size-3.5" aria-hidden />
                                                Live
                                            </Link>
                                            <Link
                                                href={project.githubLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex cursor-pointer items-center gap-2 text-zinc-400 transition-colors hover:text-white"
                                            >
                                                <FaGithub className="size-3.5" aria-hidden />
                                                Code
                                            </Link>
                                        </>
                                    ) : (
                                        <Link
                                            href={project.githubLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex cursor-pointer items-center gap-2 text-zinc-400 transition-colors hover:text-white"
                                        >
                                            <FaGithub className="size-3.5" aria-hidden />
                                            Repository
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.section>
    );
};

export default ProjectsCard;
