'use client';

import React from 'react';

const Description: React.FC = () => (
    <div className="size-full p-6">
        <div className="mb-8 text-3xl font-extrabold">About Me</div>
        <div className="flex flex-col gap-4">
            <div className="text-base leading-relaxed text-gray-300">
                Frontend engineer with ~4.5+ years building scalable web apps in fintech, e-commerce, and
                enterprise; strong React, Next.js, and TypeScript; performance and production systems focus.
            </div>
        </div>
    </div>
);

export default Description;
