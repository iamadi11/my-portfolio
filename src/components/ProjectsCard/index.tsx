'use client';

import React from 'react';

import Link from 'next/link';
import { FaLink, FaGithub } from 'react-icons/fa';

const projectsData = [
    {
        title: 'Mouse Follow',
        description:
            "This project demonstrates a simple mouse-follow effect using React and Vite. The mouse-follow effect creates an interactive experience where an element follows the user's cursor, providing a dynamic and engaging user interface.",
        techStack: 'React, Vite, TypeScript, Tailwind CSS',
        imageUrl: '/project.jpg',
        liveLink: 'https://mouse-follow-demo.vercel.app/',
        githubLink: 'https://github.com/iamadi11/mouse-follow',
    },
];

import Card from '@/components/Card';

const ProjectsCard: React.FC = () => (
    <div className="flex flex-col items-center justify-center p-6 text-center">
        <h2 className="mb-4 text-2xl font-bold text-white">Projects</h2>
        <p className="mb-6 text-sm text-gray-500">Things I&apos;ve built so far</p>
        <div className="flex flex-wrap justify-center gap-6">
            {projectsData.map((project) => (
                <Card
                    key={project.title}
                    className="flex min-w-64 max-w-64 flex-col rounded-xl bg-neutral-900 text-center shadow-custom transition-all duration-100 ease-in-out hover:scale-105"
                >
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
                                    Live Preview
                                </Link>
                            </div>
                            <div className="flex flex-row items-center gap-2">
                                <FaGithub />
                                <Link href={project.githubLink} target="_blank" rel="noopener noreferrer">
                                    View Code
                                </Link>
                            </div>
                        </Card.Footer>
                    </Card.Main>
                </Card>
            ))}
        </div>
    </div>
);

export default ProjectsCard;
