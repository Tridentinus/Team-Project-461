export async function measureConcurrentLatencies(
    fns: ((owner: string, repo: string) => Promise<number>)[],
    owner: string,
    repo: string
): Promise<{ latencies: number[], results: (number | null)[], errors: (any | null)[] }> {
    const latencies: number[] = [];
    const results: (number | null)[] = [];
    const errors: (any | null)[] = [];

    // Create an array of promises to track each function call's latency
    const promises = fns.map(async (fn) => {
        const start = performance.now();
        try {
            const result = await fn(owner, repo);
            const end = performance.now();
            const seconds_elapsed = Number(((end - start) / 1000).toFixed(3));
            latencies.push(seconds_elapsed);
            results.push(result);  // Store result (a number between 0 and 1)
            errors.push(null);     // No error
        } catch (error) {
            const end = performance.now();
            const seconds_elapsed = Number(((end - start) / 1000).toFixed(3));
            latencies.push(seconds_elapsed);
            results.push(null);    // No result in case of error
            errors.push(error);    // Capture error
        }
    });

    // Wait for all promises to settle
    await Promise.allSettled(promises);

    return { latencies, results, errors };
}
