// Sample content for the game wireframes: slots for any senior / SDE-2 full-stack engineer.
// Not anyone's real history; every value is a placeholder to be replaced from a content file.
window.SAMPLE = {
    name: 'Your Name',
    role: 'Senior Software Engineer · Full-stack',
    level: 'SDE-2 → Senior',
    city: 'Your City',
    status: 'Open to new roles',
    email: 'you@example.com',
    links: [
        { label: 'GitHub', href: '#' },
        { label: 'LinkedIn', href: '#' },
        { label: 'Résumé PDF', href: '#' },
    ],
    projects: [
        {
            id: 'payments',
            title: 'Payments API',
            summary: 'An idempotent payments service: retries, webhooks and reconciliation that never double-charge.',
            stack: ['Node.js', 'TypeScript', 'PostgreSQL', 'Redis', 'Kafka'],
            problem: 'Retries from clients and the provider created duplicate charges.',
            approach: 'Idempotency keys at the edge, an outbox table, webhooks replayed from a queue.',
            outcome: 'Duplicate charges stopped; on-call pages for payments dropped.',
        },
        {
            id: 'realtime',
            title: 'Realtime ops dashboard',
            summary: 'A live dashboard streaming order and system events to support and ops teams.',
            stack: ['React', 'Next.js', 'WebSockets', 'ClickHouse'],
            problem: 'Teams refreshed stale reports to see what was happening right now.',
            approach: 'An event stream fanned out over WebSockets, windowed aggregates in ClickHouse.',
            outcome: 'Incidents spotted from the dashboard instead of from customer tickets.',
        },
        {
            id: 'design-system',
            title: 'Design system',
            summary: 'One component library and token set shared by every product team.',
            stack: ['React', 'TypeScript', 'Storybook', 'Radix UI'],
            problem: 'Every page shipped its own buttons, spacing and accessibility bugs.',
            approach: 'Tokens first, accessible primitives, visual tests in CI.',
            outcome: 'New screens assembled from parts; accessibility fixed once.',
        },
        {
            id: 'search',
            title: 'Search service',
            summary: 'Typo-tolerant product search with caching and relevance tuning.',
            stack: ['Go', 'OpenSearch', 'Redis', 'gRPC'],
            problem: 'Search timed out under load and missed misspelled queries.',
            approach: 'A read-through cache, query rewriting, offline relevance evaluation.',
            outcome: 'Faster results under peak traffic; fewer zero-result searches.',
        },
    ],
    experience: [
        { org: 'Company A', role: 'Senior Software Engineer', period: '2024 – now' },
        { org: 'Company B', role: 'Software Engineer II (SDE-2)', period: '2021 – 2024' },
        { org: 'Company C', role: 'Software Engineer', period: '2019 – 2021' },
        { org: 'University', role: 'B.Tech / B.S., Computer Science', period: '2015 – 2019' },
    ],
    skills: [
        { group: 'Frontend', items: ['React', 'Next.js', 'TypeScript', 'Accessibility', 'Web performance'] },
        { group: 'Backend', items: ['Node.js', 'Go', 'REST', 'GraphQL', 'gRPC'] },
        { group: 'Data', items: ['PostgreSQL', 'Redis', 'Kafka', 'ClickHouse'] },
        { group: 'Cloud', items: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD'] },
        { group: 'Quality', items: ['Jest', 'Playwright', 'Observability', 'Incident response'] },
    ],
};

/** A plain, printable résumé sheet: the recruiter path every game keeps one tap away. */
window.resumeHTML = function resumeHTML() {
    const s = window.SAMPLE;
    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    return `
    <h2>${esc(s.name)}</h2>
    <p class="r-role">${esc(s.role)} · ${esc(s.city)} · ${esc(s.status)}</p>
    <p><a href="mailto:${esc(s.email)}">${esc(s.email)}</a> · ${s.links.map((l) => `<a href="${l.href}">${esc(l.label)}</a>`).join(' · ')}</p>
    <h3>Experience</h3>
    ${s.experience.map((e) => `<div class="r-row"><b>${esc(e.org)}</b><span>${esc(e.role)}</span><span>${esc(e.period)}</span></div>`).join('')}
    <h3>Projects</h3>
    ${s.projects.map((p) => `<div class="r-proj"><b>${esc(p.title)}</b> · ${esc(p.summary)}<br/><small>${p.stack.map(esc).join(' · ')}</small></div>`).join('')}
    <h3>Skills</h3>
    ${s.skills.map((g) => `<div class="r-row"><b>${esc(g.group)}</b><span>${g.items.map(esc).join(', ')}</span></div>`).join('')}`;
};
