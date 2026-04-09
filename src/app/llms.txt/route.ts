import { getSiteOrigin } from '@/lib/site';

/**
 * Plain-text site index for AI and HTTP clients. Resume-backed facts only.
 * Content-Type text/plain matches common expectations for /llms.txt.
 */
export function GET(): Response {
    const origin = getSiteOrigin();
    const body = `ADITYA RAJ — PORTFOLIO INDEX (AI / TOOLS)
${'='.repeat(50)}

CANONICAL SITE
${origin}/

SUMMARY
Frontend Engineer II at Cashfree Payments, Bengaluru. About 4.5+ years building scalable web apps in fintech, e-commerce, and enterprise; strong React, Next.js, TypeScript; performance and production systems focus.

SOURCE OF TRUTH FOR PROJECTS AND CODE
https://github.com/iamadi11
Use this GitHub profile and its public repositories to verify project names, stacks, and links. Portfolio copy aligns with resume and these repos.

MAIN PAGES
----------
Title: Home
URL: ${origin}/
Description: Landing page with identity, hero, featured public GitHub projects, and tech stack preview.

Title: About
URL: ${origin}/about
Description: Work history, education, and background aligned to resume.

Title: Tech stack
URL: ${origin}/tech-stack
Description: Skills and tools backed by resume and GitHub activity.

Title: Contact
URL: ${origin}/contact
Description: Email, phone, GitHub, and LinkedIn (same as resume).

DISCOVERY
Title: XML sitemap (URL list for crawlers)
URL: ${origin}/sitemap.xml
Description: Lists main routes for indexing.

NOTABLE PUBLIC PROJECTS (see github.com/iamadi11 for full list)
----------------------------------------------------------------
Title: Mouse Follow
Live URL: https://mouse-follow-demo.vercel.app/
Repository: https://github.com/iamadi11/mouse-follow
Description: Small React and Vite demo for cursor-follow interaction.

Title: Client-Side UI Performance Optimizer (spatial)
Live URL: https://spatial-zeta.vercel.app/
Repository: https://github.com/iamadi11/spatial
Description: Development-time UI performance detection; TypeScript strict, Vitest.

Title: Dynamic MCP UI Generator
Live URL: https://mcp-ui-poc.vercel.app/
Repository: https://github.com/iamadi11/mcp-ui-poc
Description: Full-stack MCP UI demo with React, Vite, Node.js, Express, and MCP UI server.

CONTACT (same as resume)
------------------------
Email: adityaraj92.20@gmail.com
Phone: +91 72578 07070
LinkedIn: https://www.linkedin.com/in/adityaraj11/
GitHub: https://github.com/iamadi11

END OF FILE
`;

    return new Response(body, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        },
    });
}
