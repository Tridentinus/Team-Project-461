import { describe, it, expect, vi } from 'vitest';
import { measureConcurrentLatencies } from '../src/latency'; // Adjust this import to the correct file

describe('measureConcurrentLatencies', () => {
  
  it('should measure latency and return correct results when all functions succeed', async () => {
    // Mock functions that resolve successfully
    const mockFn1 = vi.fn(async () => 1);
    const mockFn2 = vi.fn(async () => 2);
    
    const fns = [mockFn1, mockFn2];
    const owner = 'someOwner';
    const repo = 'someRepo';
    
    const result = await measureConcurrentLatencies(fns, owner, repo);

    // Expect both functions to have been called
    expect(mockFn1).toHaveBeenCalledWith(owner, repo);
    expect(mockFn2).toHaveBeenCalledWith(owner, repo);
    
    // Expect latencies to be numbers and results to match return values
    expect(result.latencies.length).toBe(2);
    result.latencies.forEach(latency => expect(latency).toBeGreaterThanOrEqual(0));
    expect(result.results).toEqual([1, 2]);
    expect(result.errors).toEqual([null, null]);
  });

  it('should return an error and null result when a function throws', async () => {
    // Mock functions where one succeeds and one throws an error
    const mockFn1 = vi.fn(async () => 1);
    const mockFn2 = vi.fn(async () => { throw new Error('Failed') });
    
    const fns = [mockFn1, mockFn2];
    const owner = 'someOwner';
    const repo = 'someRepo';

    const result = await measureConcurrentLatencies(fns, owner, repo);

    // Expect first function to succeed and second to fail
    expect(result.results).toEqual([1, null]);
    expect(result.errors[0]).toBe(null);
    expect(result.errors[1]).toBeInstanceOf(Error);
    expect(result.errors[1]?.message).toBe('Failed');
    
    // Expect latencies to be recorded as numbers
    expect(result.latencies.length).toBe(2);
    result.latencies.forEach(latency => expect(latency).toBeGreaterThanOrEqual(0));
  });

  it('should handle multiple asynchronous functions concurrently', async () => {
    const mockFn1 = vi.fn(async () => {
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      return 1;
    });
    
    const mockFn2 = vi.fn(async () => {
      await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
      return 2;
    });
    
    const fns = [mockFn1, mockFn2];
    const owner = 'someOwner';
    const repo = 'someRepo';

    const result = await measureConcurrentLatencies(fns, owner, repo);

    expect(result.results).toEqual([1, 2]);
    expect(result.errors).toEqual([null, null]);
    
    // Latencies should be greater than 0
    result.latencies.forEach(latency => expect(latency).toBeGreaterThanOrEqual(0));
  });
});
