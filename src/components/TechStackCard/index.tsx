'use client';

import React, { useState } from 'react';

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
    SiGithubactions,
    SiGooglemaps,
    SiJest,
    SiMongodb,
    SiMysql,
    SiPwa,
    SiReactquery,
    SiRedis,
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

type TechGroup = {
    label: string;
    items: TechItem[];
};

const ICON_SIZE = 44;

/** Categorised by role — resume + GitHub-backed. */
const techGroups: TechGroup[] = [
    {
        label: 'Core',
        items: [
            { name: 'React', icon: <RiReactjsLine size={ICON_SIZE} />, color: '#61DAFB' },
            { name: 'Next.js', icon: <RiNextjsLine size={ICON_SIZE} />, color: '#FFFFFF' },
            { name: 'TypeScript', icon: <TbBrandTypescript size={ICON_SIZE} />, color: '#3B82F6' },
            { name: 'JavaScript', icon: <RiJavascriptLine size={ICON_SIZE} />, color: '#F5D100' },
            { name: 'HTML5', icon: <RiHtml5Line size={ICON_SIZE} />, color: '#FF5733' },
            { name: 'CSS3', icon: <RiCss3Line size={ICON_SIZE} />, color: '#3A9BDB' },
            { name: 'Tailwind', icon: <RiTailwindCssFill size={ICON_SIZE} />, color: '#0EA5E9' },
        ],
    },
    {
        label: 'State & Data',
        items: [
            { name: 'Zustand', icon: <BiCube size={ICON_SIZE} />, color: '#E59B3D' },
            { name: 'React Query', icon: <SiReactquery size={ICON_SIZE} />, color: '#FF4C4C' },
            { name: 'Redux', icon: <SiRedux size={ICON_SIZE} />, color: '#E22B6B' },
            { name: 'Semantic UI', icon: <SiSemanticuireact size={ICON_SIZE} />, color: '#00B5AD' },
        ],
    },
    {
        label: 'Backend & Infra',
        items: [
            { name: 'Node.js', icon: <RiNodejsLine size={ICON_SIZE} />, color: '#7BBF49' },
            { name: 'Express', icon: <SiExpress size={ICON_SIZE} />, color: '#FFFFFF' },
            { name: 'Redis', icon: <SiRedis size={ICON_SIZE} />, color: '#DC382D' },
            { name: 'MongoDB', icon: <SiMongodb size={ICON_SIZE} />, color: '#47A248' },
            { name: 'MySQL', icon: <SiMysql size={ICON_SIZE} />, color: '#4479A1' },
            { name: 'AWS', icon: <FaAws size={ICON_SIZE} />, color: '#FF8C00' },
            { name: 'Google Maps', icon: <SiGooglemaps size={ICON_SIZE} />, color: '#4285F4' },
        ],
    },
    {
        label: 'Build & DX',
        items: [
            { name: 'Webpack', icon: <SiWebpack size={ICON_SIZE} />, color: '#4B93FF' },
            { name: 'Turborepo', icon: <SiTurborepo size={ICON_SIZE} />, color: '#EF4444' },
            { name: 'Vite', icon: <TbBrandVite size={ICON_SIZE} />, color: '#6A4CFF' },
            { name: 'PWA', icon: <SiPwa size={ICON_SIZE} />, color: '#5A0FC8' },
            { name: 'Git', icon: <FaGitSquare size={ICON_SIZE} />, color: '#D64937' },
            { name: 'GitHub Actions', icon: <SiGithubactions size={ICON_SIZE} />, color: '#2088FF' },
        ],
    },
    {
        label: 'Testing',
        items: [
            { name: 'Jest', icon: <SiJest size={ICON_SIZE} />, color: '#C21325' },
            { name: 'RTL', icon: <SiTestinglibrary size={ICON_SIZE} />, color: '#E33332' },
        ],
    },
];

type TechStackCardProps = {
    /** Use `h1` on the dedicated /tech-stack page for a single top-level heading. */
    titleAs?: 'h1' | 'h2';
};

const TechStackCard: React.FC<TechStackCardProps> = ({ titleAs = 'h2' }) => {
    const prefersReducedMotion = useReducedMotion();
    const reduce = prefersReducedMotion === true;
    const TitleTag = titleAs;
    const [hovered, setHovered] = useState<string | null>(null);

    return (
        <motion.section
            aria-labelledby="tech-stack-heading"
            className="border-t border-white/5 px-4 py-16 sm:px-6 sm:py-20"
            initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={reduce ? { duration: 0 } : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
            <div className="mx-auto max-w-6xl">
                <div className="text-center">
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
                        From resume and production work — grouped by domain
                    </p>
                </div>

                <div className="mt-12 flex flex-col gap-10">
                    {techGroups.map((group, gi) => (
                        <div key={group.label}>
                            {/* animated group label + rule */}
                            <motion.div
                                className="mb-4 flex items-center gap-3"
                                initial={reduce ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, margin: '-16px' }}
                                transition={
                                    reduce
                                        ? { duration: 0 }
                                        : { delay: gi * 0.06, duration: 0.38, ease: [0.22, 1, 0.36, 1] }
                                }
                            >
                                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                                    {group.label}
                                </p>
                                <div className="h-px flex-1 bg-gradient-to-r from-white/[0.07] to-transparent" />
                            </motion.div>

                            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-6 lg:grid-cols-7">
                                {group.items.map((tech, index) => {
                                    const isHov = hovered === tech.name && !reduce;
                                    return (
                                        <motion.div
                                            key={tech.name}
                                            className={clsx(
                                                'flex flex-col items-center rounded-2xl border border-white/[0.07]',
                                                'bg-white/[0.03] px-2 py-4 backdrop-blur-sm',
                                                'cursor-default'
                                            )}
                                            style={
                                                isHov
                                                    ? {
                                                          borderColor: `${tech.color}30`,
                                                          backgroundColor: `${tech.color}08`,
                                                          transition:
                                                              'border-color 0.2s, background-color 0.2s',
                                                      }
                                                    : {
                                                          transition:
                                                              'border-color 0.2s, background-color 0.2s',
                                                      }
                                            }
                                            initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true, margin: '-20px' }}
                                            transition={
                                                reduce
                                                    ? { duration: 0 }
                                                    : {
                                                          delay: gi * 0.05 + index * 0.03,
                                                          duration: 0.35,
                                                          ease: [0.22, 1, 0.36, 1],
                                                      }
                                            }
                                            whileHover={
                                                reduce ? {} : { y: -4, transition: { duration: 0.2 } }
                                            }
                                            onHoverStart={() => setHovered(tech.name)}
                                            onHoverEnd={() => setHovered(null)}
                                        >
                                            {/* icon with brand-color glow */}
                                            <div
                                                style={{
                                                    color: tech.color,
                                                    filter: isHov
                                                        ? `drop-shadow(0 0 14px ${tech.color}CC) drop-shadow(0 0 6px ${tech.color}88)`
                                                        : `drop-shadow(0 0 10px ${tech.color}44)`,
                                                    transform: isHov ? 'scale(1.14)' : 'scale(1)',
                                                    transition: 'filter 0.25s ease, transform 0.25s ease',
                                                }}
                                                className="flex size-11 items-center justify-center rounded-xl bg-zinc-900/80"
                                            >
                                                {tech.icon}
                                            </div>
                                            {/* name fades to tech color on hover */}
                                            <span
                                                className="mt-2.5 text-center text-[10px] font-medium leading-tight"
                                                style={{
                                                    color: isHov ? tech.color : '#a1a1aa',
                                                    transition: 'color 0.2s ease',
                                                }}
                                            >
                                                {tech.name}
                                            </span>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.section>
    );
};

export default TechStackCard;
