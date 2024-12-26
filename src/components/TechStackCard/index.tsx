import React from 'react';

import clsx from 'clsx';
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
    SiAntdesign,
    SiRedux,
    SiExpress,
    SiPython,
    SiWebpack,
    SiReactquery,
    SiShadcnui,
} from 'react-icons/si';
import { TbBrandTypescript, TbBrandVite } from 'react-icons/tb';

type TechItem = {
    name: string;
    icon: React.ReactNode;
    color: string;
};

const ICON_SIZE = 60;

const techStack: TechItem[] = [
    { name: 'HTML5', icon: <RiHtml5Line size={ICON_SIZE} />, color: '#FF5733' }, // Bright Red
    { name: 'CSS3', icon: <RiCss3Line size={ICON_SIZE} />, color: '#3A9BDB' }, // Vivid Blue
    { name: 'JavaScript', icon: <RiJavascriptLine size={ICON_SIZE} />, color: '#F5D100' }, // Bright Yellow
    { name: 'React', icon: <RiReactjsLine size={ICON_SIZE} />, color: '#61DAFB' }, // Light Blue
    { name: 'Redux', icon: <SiRedux size={ICON_SIZE} />, color: '#E22B6B' }, // Strong Pink
    { name: 'Next.js', icon: <RiNextjsLine size={ICON_SIZE} />, color: '#FFFFFF' }, // White (remain unchanged)
    { name: 'TypeScript', icon: <TbBrandTypescript size={ICON_SIZE} />, color: '#0061F2' }, // Strong Blue
    { name: 'Node.js', icon: <RiNodejsLine size={ICON_SIZE} />, color: '#7BBF49' }, // Fresh Green
    { name: 'Tailwind', icon: <RiTailwindCssFill size={ICON_SIZE} />, color: '#0EA5E9' }, // Bright Cyan
    { name: 'React Query', icon: <SiReactquery size={ICON_SIZE} />, color: '#FF4C4C' }, // Bright Red
    { name: 'Express', icon: <SiExpress size={ICON_SIZE} />, color: '#FFFFFF' }, // White (remain unchanged)
    { name: 'Python', icon: <SiPython size={ICON_SIZE} />, color: '#306998' }, // Blue (Python color)
    { name: 'Ant Design', icon: <SiAntdesign size={ICON_SIZE} />, color: '#1677FF' }, // Vivid Blue
    { name: 'ShadCN UI', icon: <SiShadcnui size={ICON_SIZE} />, color: '#FFFFFF' }, // White (remain unchanged)
    { name: 'AWS', icon: <FaAws size={ICON_SIZE} />, color: '#FF8C00' }, // Bright Orange
    { name: 'Vite', icon: <TbBrandVite size={ICON_SIZE} />, color: '#6A4CFF' }, // Vivid Purple
    { name: 'Webpack', icon: <SiWebpack size={ICON_SIZE} />, color: '#4B93FF' }, // Blue
    { name: 'Git', icon: <FaGitSquare size={ICON_SIZE} />, color: '#D64937' }, // Bright Red
];

const TechStackCard: React.FC = () => (
    <div className="flex flex-col items-center justify-center p-6 text-center">
        <h2 className="mb-4 text-2xl font-bold text-white">My Tech Stack</h2>
        <p className="mb-6 text-sm text-gray-500">Technologies that empower my development process</p>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:grid-cols-6">
            {techStack.map((tech) => (
                <div
                    key={tech.name}
                    className={clsx(
                        'flex flex-col items-center',
                        'transition-all duration-100 ease-in-out hover:scale-125',
                        'hover:rotate-1'
                    )}
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
                </div>
            ))}
        </div>
    </div>
);

export default TechStackCard;
