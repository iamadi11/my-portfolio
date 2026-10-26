/** The drawing set: one sheet per section of `/`. Nav, frames and footers read from here. */
export const SHEETS = [
    { n: 1, id: 'title', title: 'Title block' },
    { n: 2, id: 'results', title: 'Measured results' },
    { n: 3, id: 'assemblies', title: 'Assemblies' },
    { n: 4, id: 'revisions', title: 'Revision history' },
    { n: 5, id: 'variables', title: 'Variables' },
    { n: 6, id: 'contact', title: 'Contact' },
] as const;

export type SheetId = (typeof SHEETS)[number]['id'];

export const SHEET_COUNT = SHEETS.length;

export function sheet(id: SheetId): (typeof SHEETS)[number] {
    return SHEETS.find((s) => s.id === id)!;
}
