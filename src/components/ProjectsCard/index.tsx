'use client';

import React from 'react';

import { motion } from 'motion/react';
import Link from 'next/link';
import { FaLink, FaGithub } from 'react-icons/fa';

const projectsData = [
    {
        title: 'Mouse Follow',
        description:
            'Small React + Vite demo: cursor-follow interaction (public repo and live demo on GitHub).',
        techStack: 'React, Vite, TypeScript, Tailwind CSS',
        imageUrl: '/project.jpg',
        liveLink: 'https://mouse-follow-demo.vercel.app/',
        githubLink: 'https://github.com/iamadi11/mouse-follow',
    },
];

import Card from '@/components/Card';

const ProjectsCard: React.FC = () => (
    <motion.div
        className="flex flex-col items-center justify-center p-6 text-center"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
        <h2 className="mb-4 text-2xl font-bold text-white">Projects</h2>
        <p className="mb-6 text-sm text-gray-500">Public GitHub work</p>
        <div className="flex flex-wrap justify-center gap-6">
            {projectsData.map((project) => (
                <motion.div
                    key={project.title}
                    whileHover={{ y: -4, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }}
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
                            <Card.Footer className="flex flex-row justify-between px-8 pb-4 text-xs">
                                <div className="flex flex-row items-center gap-2">
                                    <FaLink />
                                    <Link href={project.liveLink} target="_blank" rel="noopener noreferrer">
                                        Live
                                    </Link>
                                </div>
                                <div className="flex flex-row items-center gap-2">
                                    <FaGithub />
                                    <Link href={project.githubLink} target="_blank" rel="noopener noreferrer">
                                        Code
                                    </Link>
                                </div>
                            </Card.Footer>
                        </Card.Main>
                    </Card>
                </motion.div>
            ))}
        </div>
    </motion.div>
);

export default ProjectsCard;
