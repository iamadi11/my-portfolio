'use client';

import React from 'react';

import { motion, useReducedMotion, useTransform, type MotionValue } from 'motion/react';

import type { JourneyScene } from '../data';
import { useSceneProgress } from './useSceneProgress';
import { scenePalettes } from '../fx/palettes';

const CONTACT_LINKS: Record<string, string> = {
    'adityaraj92.20@gmail.com': 'mailto:adityaraj92.20@gmail.com',
    'linkedin.com/in/adityaraj11': 'https://www.linkedin.com/in/adityaraj11/',
    'github.com/iamadi11': 'https://github.com/iamadi11',
};

function Fact({
    fact,
    index,
    local,
    accent,
    isContact,
}: {
    fact: string;
    index: number;
    local: MotionValue<number>;
    accent: string;
    isContact: boolean;
}): React.JSX.Element {
    const start = 0.16 + index * 0.05;
    const opacity = useTransform(local, [start, start + 0.12, 0.84, 0.96], [0, 1, 1, 0]);
    const x = useTransform(local, [start, start + 0.14], [-28, 0]);
    const href = isContact ? CONTACT_LINKS[fact] : undefined;

    return (
        <motion.li style={{ opacity, x }} className="flex items-baseline gap-3">
            <span
                aria-hidden="true"
                className="h-px w-6 shrink-0 translate-y-[-0.2em]"
                style={{ backgroundColor: accent }}
            />
            {href ? (
                <a
                    href={href}
                    target={href.startsWith('mailto') ? undefined : '_blank'}
                    rel="noreferrer"
                    className="underline-offset-4 transition-colors hover:underline"
                    style={{ color: accent }}
                >
                    {fact}
                </a>
            ) : (
                <span>{fact}</span>
            )}
        </motion.li>
    );
}

/**
 * Layer B choreography for one scene. All values derive from scene-local
 * scroll progress — no time-based reveals, so scrubbing backwards replays the
 * story in reverse. The hero (index 0) starts fully visible: its SSR inline
 * opacity is 1, keeping LCP on real text.
 */
export function SceneContent({ scene, index }: { scene: JourneyScene; index: number }): React.JSX.Element {
    const { local } = useSceneProgress(scene.id);
    const reduce = useReducedMotion() === true;
    const palette = scenePalettes[index % scenePalettes.length];
    const isHero = index === 0;
    const isContact = scene.id === 'convergence';

    const opacity = useTransform(
        local,
        isHero ? [0.55, 0.95] : [0.06, 0.2, 0.84, 0.97],
        isHero ? [1, 0] : [0, 1, 1, 0]
    );
    const parallaxY = useTransform(local, [0, 1], isHero ? [0, -90] : [70, -70]);
    const headingY = useTransform(local, [0.06, 0.3], isHero ? [0, 0] : [44, 0]);
    const headingScale = useTransform(local, [0.06, 0.35], isHero ? [1, 1] : [0.96, 1]);
    const kickerY = useTransform(local, [0.06, 0.26], isHero ? [0, 0] : [24, 0]);

    if (reduce) {
        return (
            <div className="mx-auto w-full max-w-3xl">
                <SceneText scene={scene} accent={palette.accent} isContact={isContact} />
            </div>
        );
    }

    return (
        <motion.div style={{ opacity, y: parallaxY }} className="mx-auto w-full max-w-3xl">
            <motion.p
                style={{ y: kickerY, color: palette.accent }}
                className="font-mono text-xs uppercase tracking-[0.3em] sm:text-sm"
            >
                {scene.kicker}
            </motion.p>
            <motion.h2
                style={{ y: headingY, scale: headingScale, transformOrigin: 'left bottom' }}
                className="mt-4 text-5xl font-bold tracking-tight text-white sm:text-7xl"
            >
                {scene.heading}
            </motion.h2>
            <motion.p style={{ y: kickerY }} className="mt-5 text-base text-zinc-400 sm:text-lg">
                {scene.body}
            </motion.p>
            {scene.facts && (
                <ul className="mt-10 space-y-4 text-lg text-zinc-200 sm:text-xl">
                    {scene.facts.map((fact, i) => (
                        <Fact
                            key={fact}
                            fact={fact}
                            index={i}
                            local={local}
                            accent={palette.accent}
                            isContact={isContact}
                        />
                    ))}
                </ul>
            )}
        </motion.div>
    );
}

/** Static fallback — same facts, zero motion. */
function SceneText({
    scene,
    accent,
    isContact,
}: {
    scene: JourneyScene;
    accent: string;
    isContact: boolean;
}): React.JSX.Element {
    return (
        <>
            <p style={{ color: accent }} className="font-mono text-xs uppercase tracking-[0.3em] sm:text-sm">
                {scene.kicker}
            </p>
            <h2 className="mt-4 text-5xl font-bold tracking-tight text-white sm:text-7xl">{scene.heading}</h2>
            <p className="mt-5 text-base text-zinc-400 sm:text-lg">{scene.body}</p>
            {scene.facts && (
                <ul className="mt-10 space-y-4 text-lg text-zinc-200 sm:text-xl">
                    {scene.facts.map((fact) => {
                        const href = isContact ? CONTACT_LINKS[fact] : undefined;
                        return (
                            <li key={fact}>
                                {href ? (
                                    <a
                                        href={href}
                                        style={{ color: accent }}
                                        className="underline-offset-4 hover:underline"
                                    >
                                        {fact}
                                    </a>
                                ) : (
                                    fact
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </>
    );
}
