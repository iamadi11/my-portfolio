/** Sieve of Eratosthenes — returns first `count` primes. Runs once at module load. */
export function sieve(count: number): number[] {
    const limit = count * 15;
    const composite = new Uint8Array(limit + 1);
    composite[0] = 1;
    composite[1] = 1;
    for (let i = 2; i * i <= limit; i++) {
        if (!composite[i]) {
            for (let j = i * i; j <= limit; j += i) composite[j] = 1;
        }
    }
    const primes: number[] = [];
    for (let i = 2; i <= limit && primes.length < count; i++) {
        if (!composite[i]) primes.push(i);
    }
    return primes;
}

export const PRIMES_500 = sieve(500);

// ---------------------------------------------------------------------------
// 1 million primes via Web Worker — non-blocking, transfers Int32Array
// The millionth prime is 15,485,863 → sieve to 15,500,000
// ---------------------------------------------------------------------------
const WORKER_SRC = `
self.onmessage = function () {
  var LIMIT = 15500000;
  var COUNT = 1000000;
  var sieve = new Uint8Array(LIMIT + 1);
  sieve[0] = sieve[1] = 1;
  for (var i = 2; i * i <= LIMIT; i++) {
    if (!sieve[i]) for (var j = i * i; j <= LIMIT; j += i) sieve[j] = 1;
  }
  var primes = new Int32Array(COUNT);
  var idx = 0;
  for (var k = 2; k <= LIMIT && idx < COUNT; k++) {
    if (!sieve[k]) primes[idx++] = k;
  }
  self.postMessage(primes, [primes.buffer]);
};
`;

export function computeMegaPrimesAsync(): Promise<Int32Array> {
    return new Promise((resolve) => {
        const blob = new Blob([WORKER_SRC], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        const worker = new Worker(url);
        worker.onmessage = (e: MessageEvent<Int32Array>) => {
            worker.terminate();
            URL.revokeObjectURL(url);
            resolve(e.data);
        };
        worker.postMessage(null);
    });
}
