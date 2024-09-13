import { jest } from '@jest/globals';

const add = (a: number, b: number): number => a + b;

test('adds 1 + 2 to equal 3', () => {
    expect(add(1, 2)).toBe(3);
  });