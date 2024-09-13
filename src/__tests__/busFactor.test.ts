//import { calculateBusFactor } from '../busFactor';

//require the function to test

const { calculateBusFactor } = require('../busFactor');
test('Bus Factor Calculation', () => {
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
