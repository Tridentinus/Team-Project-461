import { describe, it, expect } from 'vitest';
import { calculateIRM, normalizeIRM, maxResponseTime } from '../src/irmMetric.js';

describe('IRM Metric Calculation', () => {
  it('should calculate the correct IRM for issues with responses', () => {
    const issues = [
      { node: { createdAt: '2024-09-01T00:00:00Z', comments: { nodes: [{ createdAt: '2024-09-02T00:00:00Z' }] }, closedAt: null } },
      { node: { createdAt: '2024-09-03T00:00:00Z', comments: { nodes: [{ createdAt: '2024-09-03T12:00:00Z' }] }, closedAt: null } },
    ];
    // avg response time is (24 + 12) / 2 = 18 hours * 60 = 1080 minutes
    const irm = calculateIRM(issues);
    expect(irm).toBe(normalizeIRM(1080, maxResponseTime)); 
  });

  it('should return 0 for issues with no comments or closures', () => {
    const issues = [
      { node: { createdAt: '2024-09-01T00:00:00Z', comments: { nodes: [] }, closedAt: null } },
    ];
    const irm = calculateIRM(issues);
    expect(irm).toBe(normalizeIRM(maxResponseTime, maxResponseTime));
  });

  it('should normalize IRM to a score between 0 and 1', () => {
    const irm = 1200; // 20 hours
    const irmScore = normalizeIRM(irm, maxResponseTime);
    expect(irmScore).toBeCloseTo(1 - 1200/maxResponseTime); // Close to 1 as response time is relatively fast
  });

  it('should return 0 when the IRM exceeds the maximum response time', () => {
    const irm = 50000; // More than 4 * 7 * 24 * 60 minutes
    const irmScore = normalizeIRM(irm, maxResponseTime);
    expect(irmScore).toBe(0); // Exceeds the threshold, should return 0
  });
});
