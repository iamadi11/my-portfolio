'use client';

import React from 'react';

import { motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { FaLink, FaGithub } from 'react-icons/fa';

import Card from '@/components/Card';

type ProjectItem = {
    title: string;
    description: string;
    techStack: string;
    imageUrl: string;
    githubLink: string;
    /** Public demo URL only when it exists (e.g. repo homepage on GitHub). */
    liveLink?: string;
};

/** Copy for spatial from https://github.com/iamadi11/spatial/blob/main/README.md (intro). */
const projectsData: ProjectItem[] = [
    {
        title: 'Mouse Follow',
        description:
            'Small React + Vite demo: cursor-follow interaction (public repo and live demo on GitHub).',
        techStack: 'React, Vite, TypeScript, Tailwind CSS',
        imageUrl: '/project.jpg',
        liveLink: 'https://mouse-follow-demo.vercel.app/',
        githubLink: 'https://github.com/iamadi11/mouse-follow',
    },
    {
        title: 'Client-Side UI Performance Optimizer',
        description:
            'A deterministic, development-time UI performance detection engine that identifies potential performance bottlenecks before code ships.',
        techStack: 'TypeScript (strict), Vitest',
        imageUrl: '/project.jpg',
        githubLink: 'https://github.com/iamadi11/spatial',
    },
];

const ProjectsCard: React.FC = () => {
    const prefersReducedMotion = useReducedMotion();
    const reduce = prefersReducedMotion === true;

    return (
        <motion.div
            className="flex flex-col items-center justify-center p-6 text-center"
            initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={reduce ? { duration: 0 } : { duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
            <h2 className="mb-4 text-2xl font-bold text-white">Projects</h2>
            <p className="mb-6 text-sm text-gray-500">Public GitHub work</p>
            <div className="flex flex-wrap justify-center gap-6">
                {projectsData.map((project) => (
                    <motion.div
                        key={project.githubLink}
                        whileHover={
                            reduce
                                ? { y: 0 }
                                : { y: -4, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }
                        }
                        className="will-change-transform"
                    >
                        <Card className="flex min-w-64 max-w-64 flex-col rounded-xl bg-neutral-900 text-center shadow-custom">
                            <Card.ImageCard
                                className="overflow-hidden rounded-t-xl"
                                src={project.imageUrl}
                                alt={project.title}
                            />
                            <Card.Main className="flex size-full flex-col justify-between gap-2">
                                <div className="flex flex-col gap-4">
                                    <Card.Header>
                                        <div className="pt-4 text-xl text-gray-400">{project.title}</div>
                                    </Card.Header>
                                    <div>
                                        <div className="px-6 text-left text-xs text-gray-400">
                                            {project.description}
                                        </div>
                                        <div className="px-6 text-left text-xs text-gray-400">
                                            {project.techStack}
                                        </div>
                                    </div>
                                </div>
                                <Card.Footer
                                    className={
                                        project.liveLink
                                            ? 'flex flex-row justify-between px-8 pb-4 text-xs'
                                            : 'flex flex-row justify-center px-8 pb-4 text-xs'
                                    }
                                >
                                    {project.liveLink ? (
                                        <>
                                            <div className="flex flex-row items-center gap-2">
                                                <FaLink />
                                                <Link
                                                    href={project.liveLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    Live
                                                </Link>
                                            </div>
                                            <div className="flex flex-row items-center gap-2">
                                                <FaGithub />
                                                <Link
                                                    href={project.githubLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    Code
                                                </Link>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-row items-center gap-2">
                                            <FaGithub />
                                            <Link
                                                href={project.githubLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Repository
                                            </Link>
                                        </div>
                                    )}
                                </Card.Footer>
                            </Card.Main>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export default ProjectsCard;
