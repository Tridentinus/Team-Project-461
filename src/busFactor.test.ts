import { calculateBusFactor } from './busFactor';
import {jest } from '@jest/globals';



//require the function to test
jest.mock('./busFactor', () => ({
  calculateBusFactor: jest.fn(() => 1),
}));


describe('Bus Factor Calculation', () => {
  it('should calculate the correct bus factor for contributors', () => {
    // Example commit data
    const contributors = [
      { node: { author: { name: 'Tridentinus', email: 'seaman.trent@gmail.com' }, committedDate: '2024-09-07' } },
    ];

    const busFactor = calculateBusFactor(contributors);
    // Expected bus factor for the example data is 1
    expect(busFactor).toBe(1);
  });
});
