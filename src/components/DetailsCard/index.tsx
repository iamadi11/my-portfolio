import React from 'react';

import clsx from 'clsx';
import Image from 'next/image';

const DetailsCard: React.FC = () => (
    <div className={clsx('flex flex-col items-center gap-8', 'md:flex-row md:justify-evenly md:gap-12')}>
        <div className="text-center md:text-left">
            <div className="text-xl font-semibold text-gray-400">
                Hello <span className="inline-block origin-[70%_70%] animate-wave">👋</span>,
            </div>

            <div className="text-3xl font-extrabold text-white">My name is</div>
            <div className="inline-block bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-4xl font-extrabold text-transparent">
                Aditya
            </div>
            <div className="mt-2 text-lg text-gray-300">
                I&apos;m a passionate <span className="font-semibold text-white">Software Developer</span> who
                loves creating exceptional web experiences{' '}
                <span className="relative inline-block animate-rocketTakeoff">
                    <span className="rotate-225 absolute -bottom-3 -left-3 animate-fireTrail text-red-500">
                        🔥
                    </span>
                    🚀
                </span>
                .
            </div>
            <div className="mt-4 text-sm text-gray-500">
                From crafting clean, responsive UIs to optimizing backend performance, I enjoy solving
                challenges and building intuitive solutions.
            </div>
        </div>
        <div className="md:size-50 relative size-40 overflow-hidden rounded-full border-4 border-cyan-400 shadow-md">
            <Image
                src="/profile_pic.jpg"
                alt="Aditya's Profile Picture"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
            />
        </div>
    </div>
);

export default DetailsCard;
