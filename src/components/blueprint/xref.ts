import { SITE } from '@/content/site';
import type { Impact } from '@/content/types';

/**
 * Cross-references between sheets, the way a drawing set links its sheets ("SEE SHEET 4, REV E"). Everything is
 * derived from SITE: a result is linked to the role note that states the same numbers for the same organisation,
 * so nothing is linked by hand and a result with no matching note simply gets no reference.
 */

const exp = SITE.practice.experience;

/** Revision letter of an experience row (SITE order is newest first; the oldest role is REV A). */
export function revOf(row: number): string {
    return String.fromCharCode(65 + exp.length - 1 - row);
}

export const revId = (rev: string): string => `rev-${rev.toLowerCase()}`;
/** Note n (1-based, as printed) of a revision. */
export const noteId = (rev: string, n: number): string => `${revId(rev)}-n${n}`;
export const resultId = (i: number): string => `result-${i + 1}`;
/** Results are drawn as DETAIL A, B, C … in SITE order. */
export const detailOf = (i: number): string => String.fromCharCode(65 + i);

function hasNumber(text: string, n: string): boolean {
    return new RegExp(`(^|[^\\d.])${n.replace('.', '\\.')}(?![\\d])`).test(text);
}

/** The experience row and note (0-based) where an impact figure is stated, or null. */
export function sourceOf(it: Impact): { row: number; note: number } | null {
    const org = it.label.split(' · ')[1]?.trim();
    const nums = it.value.match(/\d+(?:\.\d+)?/g) ?? [];
    if (!org || !nums.length) return null;
    for (let row = 0; row < exp.length; row++) {
        if (exp[row].org !== org) continue;
        const note = (exp[row].highlights ?? []).findIndex((h) => nums.every((n) => hasNumber(h, n)));
        if (note >= 0) return { row, note };
    }
    return null;
}

/** The impact index measured by an experience note, or -1. */
export function measuredBy(row: number, note: number): number {
    return (SITE.practice.impact ?? []).findIndex((it) => {
        const s = sourceOf(it);
        return s?.row === row && s.note === note;
    });
}
