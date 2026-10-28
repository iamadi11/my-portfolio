/** The line that judges a prediction after a run: none made, right, or not quite. */
export function verdict<T extends string>(guess: T | null, actual: T, label: Record<T, string>): string {
    if (guess === null) return 'You ran it without a prediction.';
    return `You predicted “${label[guess]}”: ${guess === actual ? 'right' : 'not quite'}.`;
}

/** "1 tick", "3 ticks". */
export const ticks = (n: number): string => `${n} ${n === 1 ? 'tick' : 'ticks'}`;
