'use client';

import React from 'react';

const Education: React.FC = () => (
    <div className="size-full p-6">
        <div className="mb-8 text-3xl font-extrabold">Education</div>
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-4">
                <div>
                    <div className="text-xl font-bold text-gray-400">
                        Indian Institute of Information Technology, Lucknow
                    </div>
                    <div className="text-lg font-semibold text-gray-500">
                        B.Tech in Information Technology, CGPA: 8.14 / 10
                    </div>
                </div>
                <div>
                    <div className="text-base text-gray-600 md:text-right">August 2017 – Jun 2021</div>
                    <div className="text-sm text-gray-600 md:text-right">Lucknow, Uttar Pradesh</div>
                </div>
            </div>
            <div className="mb-0 mt-2 h-0 w-full rounded-sm border border-gray-500" />
        </div>
    </div>
);

export default Education;
