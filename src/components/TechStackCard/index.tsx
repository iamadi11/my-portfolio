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
import {
    SiExpress,
    SiJest,
    SiReactquery,
    SiRedux,
    SiSemanticuireact,
    SiTestinglibrary,
    SiTurborepo,
    SiWebpack,
} from 'react-icons/si';
import { TbBrandTypescript, TbBrandVite } from 'react-icons/tb';

type TechItem = {
    name: string;
    icon: React.ReactNode;
    color: string;
};

const ICON_SIZE = 52;

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
    {
        name: 'Semantic UI',
        icon: <SiSemanticuireact size={ICON_SIZE} />,
        color: '#00B5AD',
    },
    { name: 'Node.js', icon: <RiNodejsLine size={ICON_SIZE} />, color: '#7BBF49' },
    { name: 'Express', icon: <SiExpress size={ICON_SIZE} />, color: '#FFFFFF' },
    { name: 'Webpack', icon: <SiWebpack size={ICON_SIZE} />, color: '#4B93FF' },
    { name: 'Turborepo', icon: <SiTurborepo size={ICON_SIZE} />, color: '#EF4444' },
    { name: 'Jest', icon: <SiJest size={ICON_SIZE} />, color: '#C21325' },
    {
        name: 'React Testing Library',
        icon: <SiTestinglibrary size={ICON_SIZE} />,
        color: '#E33332',
    },
    { name: 'Vite', icon: <TbBrandVite size={ICON_SIZE} />, color: '#6A4CFF' },
    { name: 'AWS', icon: <FaAws size={ICON_SIZE} />, color: '#FF8C00' },
    { name: 'Git', icon: <FaGitSquare size={ICON_SIZE} />, color: '#D64937' },
];

type TechStackCardProps = {
    /** Use `h1` on the dedicated /tech-stack page for a single top-level heading. */
    titleAs?: 'h1' | 'h2';
};

const TechStackCard: React.FC<TechStackCardProps> = ({ titleAs = 'h2' }) => {
    const prefersReducedMotion = useReducedMotion();
    const reduce = prefersReducedMotion === true;
    const TitleTag = titleAs;

    return (
        <motion.section
            aria-labelledby="tech-stack-heading"
            className="border-t border-white/5 px-4 py-16 sm:px-6 sm:py-20"
            initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={reduce ? { duration: 0 } : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
            <div className="mx-auto max-w-6xl text-center">
                <TitleTag
                    id="tech-stack-heading"
                    className={clsx(
                        'text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl',
                        titleAs === 'h1' && 'lg:text-5xl'
                    )}
                >
                    Tech stack
                </TitleTag>
                <p className="mx-auto mt-3 max-w-lg text-sm text-zinc-500 sm:text-base">
                    From resume and production work
                </p>
                <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-6">
                    {techStack.map((tech, index) => (
                        <motion.div
                            key={tech.name}
                            className={clsx(
                                'flex flex-col items-center rounded-2xl border border-white/[0.07]',
                                'bg-white/[0.03] px-3 py-5 backdrop-blur-sm transition-colors',
                                'hover:border-cyan-500/20 hover:bg-white/[0.05]'
                            )}
                            initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-20px' }}
                            transition={
                                reduce
                                    ? { duration: 0 }
                                    : { delay: index * 0.02, duration: 0.35, ease: [0.22, 1, 0.36, 1] }
                            }
                            whileHover={reduce ? { y: 0 } : { y: -3, transition: { duration: 0.2 } }}
                        >
                            <div
                                className="flex size-14 items-center justify-center rounded-xl bg-zinc-900/80"
                                style={{
                                    color: tech.color,
                                    filter: `drop-shadow(0 0 20px ${tech.color}55)`,
                                }}
                            >
                                {tech.icon}
                            </div>
                            <span className="mt-3 text-xs font-medium text-zinc-300">{tech.name}</span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.section>
    );
};

export default TechStackCard;
