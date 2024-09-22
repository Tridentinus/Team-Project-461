import { describe, it, expect, vi } from 'vitest';
import { getScores } from '../src/score.js';
import { measureConcurrentLatencies } from '../src/latency.js';

// Mock dependencies
vi.mock('../src/latency.js');

describe('getScores', () => {

  it('should handle edge case where all metrics are missing or invalid', async () => {
    // Mock the measureConcurrentLatencies to return all missing results
    (measureConcurrentLatencies as any).mockResolvedValue({
      latencies: [null, null, null, null, null],
      results: [null, null, null, null, null],
      errors: ['All metrics failed']
    });

    const owner = 'nonexistent';
    const repo = 'repo';
    const url = 'https://github.com/nonexistent/repo';

    const result = await getScores(owner, repo, url);
    const parsedResult = JSON.parse(result);

    expect(parsedResult.NetScore).toBe(0); // All metrics default to 0
    expect(parsedResult.NetScore_Latency).toBe(-5); // Sum of default latencies (-1 for each missing)
    expect(parsedResult.RampUp).toBe(0);
    expect(parsedResult.RampUp_Latency).toBe(-1);
    expect(parsedResult.Correctness).toBe(0);
    expect(parsedResult.Correctness_Latency).toBe(-1);
    expect(parsedResult.BusFactor).toBe(0);
    expect(parsedResult.BusFactor_Latency).toBe(-1);
    expect(parsedResult.ResponsiveMaintainer).toBe(0);
    expect(parsedResult.ResponsiveMaintainer_Latency).toBe(-1);
    expect(parsedResult.License).toBe(0);
    expect(parsedResult.License_Latency).toBe(-1);
  });

});
