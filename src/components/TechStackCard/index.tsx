'use client';

import React from 'react';

import clsx from 'clsx';
import { motion, useReducedMotion } from 'motion/react';
import { BiCube } from 'react-icons/bi';
import { FaAws, FaGitSquare } from 'react-icons/fa';
import {
    RiHtml5Line,
    RiCss3Line,
    RiReactjsLine,
    RiNextjsLine,
    RiTailwindCssFill,
    RiJavascriptLine,
    RiNodejsLine,
} from 'react-icons/ri';
import { SiExpress, SiRedux, SiReactquery, SiWebpack } from 'react-icons/si';
import { TbBrandTypescript, TbBrandVite } from 'react-icons/tb';

type TechItem = {
    name: string;
    icon: React.ReactNode;
    color: string;
};

const ICON_SIZE = 60;

/** Subset aligned to resume technical skills + GitHub-backed tooling (e.g. Vite on public repos). */
const techStack: TechItem[] = [
    { name: 'HTML5', icon: <RiHtml5Line size={ICON_SIZE} />, color: '#FF5733' },
    { name: 'CSS3', icon: <RiCss3Line size={ICON_SIZE} />, color: '#3A9BDB' },
    { name: 'JavaScript', icon: <RiJavascriptLine size={ICON_SIZE} />, color: '#F5D100' },
    { name: 'TypeScript', icon: <TbBrandTypescript size={ICON_SIZE} />, color: '#0061F2' },
    { name: 'React', icon: <RiReactjsLine size={ICON_SIZE} />, color: '#61DAFB' },
    { name: 'Next.js', icon: <RiNextjsLine size={ICON_SIZE} />, color: '#FFFFFF' },
    { name: 'Redux', icon: <SiRedux size={ICON_SIZE} />, color: '#E22B6B' },
    { name: 'Zustand', icon: <BiCube size={ICON_SIZE} />, color: '#E59B3D' },
    { name: 'React Query', icon: <SiReactquery size={ICON_SIZE} />, color: '#FF4C4C' },
    { name: 'Tailwind', icon: <RiTailwindCssFill size={ICON_SIZE} />, color: '#0EA5E9' },
    { name: 'Node.js', icon: <RiNodejsLine size={ICON_SIZE} />, color: '#7BBF49' },
    { name: 'Express', icon: <SiExpress size={ICON_SIZE} />, color: '#FFFFFF' },
    { name: 'Webpack', icon: <SiWebpack size={ICON_SIZE} />, color: '#4B93FF' },
    { name: 'Vite', icon: <TbBrandVite size={ICON_SIZE} />, color: '#6A4CFF' },
    { name: 'AWS', icon: <FaAws size={ICON_SIZE} />, color: '#FF8C00' },
    { name: 'Git', icon: <FaGitSquare size={ICON_SIZE} />, color: '#D64937' },
];

const TechStackCard: React.FC = () => {
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
            <h2 className="mb-4 text-2xl font-bold text-white">Tech stack</h2>
            <p className="mb-6 text-sm text-gray-500">From resume and production work</p>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:grid-cols-6">
                {techStack.map((tech) => (
                    <motion.div
                        key={tech.name}
                        className={clsx('flex flex-col items-center')}
                        whileHover={reduce ? { scale: 1 } : { scale: 1.06, transition: { duration: 0.22 } }}
                    >
                        <div
                            style={{
                                filter: `drop-shadow(0px 0px 60px ${tech.color})`,
                                color: tech.color,
                            }}
                        >
                            {tech.icon}
                        </div>
                        <span className="mt-2 text-xs text-gray-300">{tech.name}</span>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export default TechStackCard;
