'use client';

import React from 'react';

const WorkExperience: React.FC = () => (
    <div className="size-full p-6 shadow-lg">
        <div className="mb-8 text-3xl font-extrabold">Work Experience</div>
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-4">
                <div>
                    <div className="text-xl font-bold text-gray-400">Software Development Engineer III</div>
                    <div className="text-lg font-semibold text-gray-500">Moresand</div>
                </div>
                <div>
                    <div className="text-base text-gray-600 md:text-right">August 2024 – Present</div>
                    <div className="text-sm text-gray-600 md:text-right">Bengaluru, Karnataka</div>
                </div>
            </div>
            <div className="mb-4 mt-2 h-0 w-full rounded-sm border border-gray-500" />
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-4">
                <div>
                    <div className="text-xl font-bold text-gray-400">Software Development Engineer II</div>
                    <div className="text-lg font-semibold text-gray-500">Tata 1mg</div>
                </div>
                <div>
                    <div className="text-base text-gray-600 md:text-right">April 2023 – July 2024</div>
                    <div className="text-sm text-gray-600 md:text-right">Gurugram, Haryana</div>
                </div>
            </div>
            <div className="mb-4 mt-2 h-0 w-full rounded-sm border border-gray-500" />
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-4">
                <div>
                    <div className="text-xl font-bold text-gray-400">Software Development Engineer I</div>
                    <div className="text-lg font-semibold text-gray-500">Tata 1mg</div>
                </div>
                <div>
                    <div className="text-base text-gray-600 md:text-right">December 2021 – March 2023</div>
                    <div className="text-sm text-gray-600 md:text-right">Gurugram, Haryana</div>
                </div>
            </div>
            <div className="mb-4 mt-2 h-0 w-full rounded-sm border border-gray-500" />
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-4">
                <div>
                    <div className="text-xl font-bold text-gray-400">Technical Consultant</div>
                    <div className="text-lg font-semibold text-gray-500">o9 Solutions</div>
                </div>
                <div>
                    <div className="text-base text-gray-600 md:text-right">June 2021 – December 2021</div>
                    <div className="text-sm text-gray-600 md:text-right">Bengaluru, Karnataka</div>
                </div>
            </div>
            <div className="mb-0 mt-2 h-0 w-full rounded-sm border border-gray-500" />
        </div>
    </div>
);

export default WorkExperience;
