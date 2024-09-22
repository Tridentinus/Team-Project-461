/**
 * Measures the latencies of concurrent asynchronous functions.
 *
 * @param fns - An array of functions that each take an `owner` and `repo` string and return a Promise resolving to a number.
 * @param owner - The owner of the repository.
 * @param repo - The repository name.
 * @returns A Promise that resolves to an object containing:
 * - `latencies`: An array of latencies (in seconds) for each function.
 * - `results`: An array of results from each function, or `null` if an error occurred.
 * - `errors`: An array of errors from each function, or `null` if no error occurred.
 */
export async function measureConcurrentLatencies(
    fns: ((owner: string, repo: string) => Promise<number>)[],
    owner: string,
    repo: string
): Promise<{ latencies: number[], results: (number | null)[], errors: (any | null)[] }> {
    const latencies: number[] = new Array(fns.length);
    const results: (number | null)[] = new Array(fns.length);
    const errors: (any | null)[] = new Array(fns.length);

    // Create an array of promises to track each function call's latency
    const promises = fns.map((fn, index) => (async () => {
        const start = performance.now();
        try {
            const result = await fn(owner, repo);
            const end = performance.now();
            const seconds_elapsed = Number(((end - start) / 1000).toFixed(3));
            latencies[index] = seconds_elapsed;   // Assign to the correct index
            results[index] = result;          // Assign to the correct index
            errors[index] = null;             // No error
        } catch (error) {
            const end = performance.now();
            const seconds_elapsed = Number(((end - start) / 1000).toFixed(3));
            latencies[index] = seconds_elapsed;   // Assign to the correct index
            results[index] = null;            // No result in case of error
            errors[index] = error;            // Capture error
        }
    })());

    // Wait for all promises to settle
    await Promise.all(promises);

    return { latencies, results, errors };
}
