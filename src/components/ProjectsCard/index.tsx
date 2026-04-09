'use client';

import React from 'react';

import clsx from 'clsx';
import { motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { FaLink, FaGithub } from 'react-icons/fa';

import Card from '@/components/Card';

type ProjectItem = {
    title: string;
    description: string;
    techStack: string;
    githubLink: string;
    /** Public demo URL only when it exists (e.g. repo homepage on GitHub). */
    liveLink?: string;
};

/** GitHub-generated Open Graph preview for a public repo (owner/repo from link). */
function githubRepoOpenGraphImage(githubLink: string): string {
    const match = /github\.com\/([^/]+)\/([^/#?]+)/.exec(githubLink);
    if (!match) return '';
    const [, owner, repo] = match;
    return `https://opengraph.githubassets.com/1/${owner}/${repo}`;
}

/** Copy for spatial from https://github.com/iamadi11/spatial/blob/main/README.md (intro). */
const projectsData: ProjectItem[] = [
    {
        title: 'Mouse Follow',
        description:
            'Small React + Vite demo: cursor-follow interaction (public repo and live demo on GitHub).',
        techStack: 'React, Vite, TypeScript, Tailwind CSS',
        liveLink: 'https://mouse-follow-demo.vercel.app/',
        githubLink: 'https://github.com/iamadi11/mouse-follow',
    },
    {
        title: 'Client-Side UI Performance Optimizer',
        description:
            'A deterministic, development-time UI performance detection engine that identifies potential performance bottlenecks before code ships.',
        techStack: 'TypeScript (strict), Vitest',
        liveLink: 'https://spatial-zeta.vercel.app/',
        githubLink: 'https://github.com/iamadi11/spatial',
    },
    /** Intro + stack from https://github.com/iamadi11/mcp-ui-poc/blob/main/README.md */
    {
        title: 'Dynamic MCP UI Generator',
        description:
            'Full-stack MCP UI demo: dynamic form, dashboard, and chart generation; React + Vite client, Node.js + Express server, @mcp-ui/server.',
        techStack: 'React 18, Vite, Node.js, Express.js, CSS3, MCP UI',
        liveLink: 'https://mcp-ui-poc.vercel.app/',
        githubLink: 'https://github.com/iamadi11/mcp-ui-poc',
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
                <div className="mt-12 flex flex-wrap justify-center gap-6 lg:gap-8">
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
                            className="will-change-transform"
                        >
                            <Card
                                className={clsx(
                                    'flex min-w-[17rem] max-w-[17rem] flex-col overflow-hidden rounded-2xl text-left',
                                    'border border-white/[0.08] bg-white/[0.03] shadow-[0_24px_80px_-32px_rgba(0,0,0,0.85)]',
                                    'backdrop-blur-md transition-shadow duration-300 hover:border-cyan-500/15',
                                    'hover:shadow-[0_28px_90px_-28px_rgba(34,211,238,0.12)]'
                                )}
                            >
                                <Card.ImageCard
                                    className="overflow-hidden rounded-t-2xl"
                                    src={githubRepoOpenGraphImage(project.githubLink) || '/profile_pic.png'}
                                    alt=""
                                />
                                <Card.Main className="flex size-full flex-col justify-between gap-3">
                                    <div className="flex flex-col gap-3 px-5 pt-5">
                                        <Card.Header className="p-0">
                                            <h3 className="text-lg font-semibold tracking-tight text-zinc-100">
                                                {project.title}
                                            </h3>
                                        </Card.Header>
                                        <p className="text-xs leading-relaxed text-zinc-400">
                                            {project.description}
                                        </p>
                                        <p className="text-xs text-zinc-500">{project.techStack}</p>
                                    </div>
                                    <Card.Footer
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
                                                    className="inline-flex items-center gap-2 text-cyan-300/90 transition-colors hover:text-cyan-200"
                                                >
                                                    <FaLink className="size-3.5" aria-hidden />
                                                    Live
                                                </Link>
                                                <Link
                                                    href={project.githubLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 text-zinc-400 transition-colors hover:text-white"
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
                                                className="inline-flex items-center gap-2 text-zinc-400 transition-colors hover:text-white"
                                            >
                                                <FaGithub className="size-3.5" aria-hidden />
                                                Repository
                                            </Link>
                                        )}
                                    </Card.Footer>
                                </Card.Main>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.section>
    );
};

export default ProjectsCard;
