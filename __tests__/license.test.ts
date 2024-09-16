import { describe, it, expect, vi, afterEach } from 'vitest';
import { getGitHubLicense, getNpmLicense, isLicenseCompatible, getGitHubLicenseScore, getNpmLicenseScore, extractLicenseFromText } from '../src/license';
import * as utils from '../src/utils';



describe('getGitHubLicense', () => {
  afterEach(() => {
    // Restore all mocks after each test
    vi.restoreAllMocks();
  });
  it('should return the correct SPDX ID if license info is provided in only the README file', async () => {
    vi.spyOn(utils, 'gitHubRequest').mockResolvedValue({
      repository: {
        licenseInfo: { spdxId: 'MIT' },
        readme: { text: `## License
                        MIT License`},
        licenseFile: { text: `(The MIT License)
          Copyright (c) 2015 Marcel Klehr <mklehr@gmx.net>

          Permission is hereby granted, free of charge, to any person obtaining
          a copy of this software and associated documentation files (the
          'Software'), to deal in the Software without restriction, including
          without limitation the rights to use, copy, modify, merge, publish,
          distribute, sublicense, and/or sell copies of the Software, and to
          permit persons to whom the Software is furnished to do so, subject to
          the following conditions:

          The above copyright notice and this permission notice shall be
          included in all copies or substantial portions of the Software.

          THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
          EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
          MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
          IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
          CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
          TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
          SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`},
      },
    });

    const result = await getGitHubLicense('owner', 'repo');
    expect(result).toBe('MIT');
  });
  
  it('should return the correct SPDX ID if license info is provided in only the README file', async () => {
    vi.spyOn(utils, 'gitHubRequest').mockResolvedValue({
      repository: {
        licenseInfo: { spdxId: null },
        readme: { text: `MIT License`},
        licenseFile: { text: null},
      },
    });

    const result = await getGitHubLicense('owner', 'repo');
    expect(result).toBe('MIT');
  });

  it('should return the correct SPDX ID if license info is provided in only the LICENSE file', async () => {
    vi.spyOn(utils, 'gitHubRequest').mockResolvedValue({
      repository: {
        licenseInfo: { spdxId: null },
        readme: { text: null},
        licenseFile: { text: `(The MIT License)
          Copyright (c) 2015 Marcel Klehr <mklehr@gmx.net>

          Permission is hereby granted, free of charge, to any person obtaining
          a copy of this software and associated documentation files (the
          'Software'), to deal in the Software without restriction, including
          without limitation the rights to use, copy, modify, merge, publish,
          distribute, sublicense, and/or sell copies of the Software, and to
          permit persons to whom the Software is furnished to do so, subject to
          the following conditions:

          The above copyright notice and this permission notice shall be
          included in all copies or substantial portions of the Software.

          THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
          EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
          MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
          IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
          CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
          TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
          SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`  },
      },
    });
  });

  it('should return the null if no license info is available', async () => {
    vi.spyOn(utils, 'gitHubRequest').mockResolvedValue({
      repository: {
        licenseInfo: { spdxId: null },
        readme: { text: null},
        licenseFile: { text: null},
      },
    });

    const result = await getGitHubLicense('owner', 'repo');
    expect(result).toBeNull();
  });
});

describe('extractLicenseFromText', () => {
  afterEach(() => {
    // Restore all mocks after each test
    vi.restoreAllMocks();
  });
  const testCases = [
    { text: 'This project is licensed under the Academic Free License v3.0.', expected: 'Academic Free License v3.0' },
    { text: 'This software is licensed under the Apache license 2.0.', expected: 'Apache license 2.0' },
    { text: 'The Artistic license 2.0 applies to this project.', expected: 'Artistic license 2.0' },
    { text: 'Licensed under the BSD 2-clause "Simplified" license.', expected: 'BSD 2-clause "Simplified" license' },
    { text: 'This project is licensed under the MIT license.', expected: 'MIT License' },
    { text: 'The GNU General Public License v3.0 applies to this software.', expected: 'GNU General Public License v3.0' },
    { text: 'This is a sample README file without any license information.', expected: null },
    { text: '', expected: null },
    { text: null, expected: null },
    { text: 'This text contains some information but no recognizable license.', expected: null },
  ];

  testCases.forEach(({ text, expected }) => {
    it(`should return ${expected === null ? 'null' : `"${expected}"`} for text: "${text}"`, () => {
      expect(extractLicenseFromText(text)).toBe(expected);
    });
  });
});

describe('getNpmLicense', () => {
  afterEach(() => {
    // Restore all mocks after each test
    vi.restoreAllMocks();
  });
  it('should return the license when it is a string', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        license: 'MIT',
      }),
    });

    const license = await getNpmLicense('package-name');
    expect(license).toBe('MIT');
  });

  it('should return the license type when it is an object', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        license: { type: 'MIT' },
      }),
    });

    const license = await getNpmLicense('package-name');
    expect(license).toBe('MIT');
  });

  it('should return null when no license is present', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({}),
    });

    const license = await getNpmLicense('package-name');
    expect(license).toBeNull();
  });
});

describe('isLicenseCompatible', () => {
  afterEach(() => {
    // Restore all mocks after each test
    vi.restoreAllMocks();
  });
  it('should return 1 for compatible licenses', () => {
    const compatibleLicenses = [
      'LGPLv2.1', 'MIT', 'BSD-2-Clause', 'BSD-3-Clause',
      'Apache-2.0', 'CC0-1.0', 'ISC', 'Zlib', 'Unlicense'
    ];

    compatibleLicenses.forEach(license => {
      expect(isLicenseCompatible(license)).toBe(1);
    });
  });

  it('should return 0 for incompatible licenses', () => {
    const incompatibleLicenses = ['Proprietary', 'Custom', 'NonStandard'];

    incompatibleLicenses.forEach(license => {
      expect(isLicenseCompatible(license)).toBe(0);
    });
  });
});

describe('getGitHubLicenseScore', () => {
  afterEach(() => {
    // Restore all mocks after each test
    vi.restoreAllMocks();
  });
  it('should return 1 for a GitHub link with a compatible license', async () => {
    // Mock the helper function results for a GitHub case
    vi.spyOn(utils, 'gitHubRequest').mockResolvedValue({
      repository: {
        licenseInfo: { spdxId: 'MIT' },
        readme: { text: `## License
                        MIT License`},
        licenseFile: { text: `(The MIT License)
          Copyright (c) 2015 Marcel Klehr <mklehr@gmx.net>

          Permission is hereby granted, free of charge, to any person obtaining
          a copy of this software and associated documentation files (the
          'Software'), to deal in the Software without restriction, including
          without limitation the rights to use, copy, modify, merge, publish,
          distribute, sublicense, and/or sell copies of the Software, and to
          permit persons to whom the Software is furnished to do so, subject to
          the following conditions:

          The above copyright notice and this permission notice shall be
          included in all copies or substantial portions of the Software.

          THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
          EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
          MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
          IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
          CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
          TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
          SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`},
      },
    });

    // Call the function
    const score = await getGitHubLicenseScore('owner', 'name');

    // Verify the results
    expect(score).toBe(1);
  });


  it('should return 0 for a GitHub repo with no license', async () => {
    // Mock the helper function results for a GitHub case with no license
    // Call the function
    vi.spyOn(utils, 'gitHubRequest').mockResolvedValue({
      repository: {
        licenseInfo: { spdxId: null },
        readme: { text: null},
        licenseFile: { text: null},
      },
    });
    const score = await getGitHubLicenseScore('owner', 'name');

    // Verify the results
    expect(score).toBe(0);
  });


  it('should return 0 for a GitHub repo with an incompatible license', async () => {
    // Mock the helper function results for a GitHub case with an incompatible license
    // Call the function
    vi.spyOn(utils, 'gitHubRequest').mockResolvedValue({
      repository: {
        licenseInfo: { spdxId: null},
        readme: { text: null},
        licenseFile: { text: `
          MySoftware End User License Agreement (EULA)
          Last Updated: [Date]
          IMPORTANT: READ THIS LICENSE AGREEMENT CAREFULLY BEFORE INSTALLING OR USING THIS SOFTWARE.
          By installing, copying, or otherwise using "MySoftware" (the "Software"), you agree to be bound by the terms of this End User License Agreement (the "Agreement"). If you do not agree to the terms of this Agreement, do not install or use the Software.
          1. GRANT OF LICENSE
          Subject to the terms of this Agreement, [Your Company Name] (the "Licensor") grants you a limited, non-exclusive, non-transferable license to use the Software on a single device. You may not use the Software on more than one device at a time without obtaining additional licenses.
          2. RESTRICTIONS
          No Modification: You may not modify, adapt, translate, or create derivative works based on the Software.
          No Distribution: You may not distribute, sell, lease, sublicense, or otherwise transfer the Software to any third party.
          No Reverse Engineering: You may not reverse engineer, decompile, disassemble, or otherwise attempt to discover the source code of the Software.
          3. OWNERSHIP
          The Software is licensed, not sold, to you under this Agreement. The Licensor retains all rights, title, and interest in and to the Software, including all intellectual property rights.
          4. TERMINATION
          This Agreement will terminate automatically if you fail to comply with any of its terms. Upon termination, you must cease all use of the Software and destroy all copies of the Software in your possession.
          5. WARRANTY DISCLAIMER
          The Software is provided "as is" without warranty of any kind. The Licensor disclaims all warranties, whether express or implied, including but not limited to the implied warranties of merchantability and fitness for a particular purpose.
          6. LIMITATION OF LIABILITY
          In no event shall the Licensor be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with the use or inability to use the Software, even if the Licensor has been advised of the possibility of such damages.
          7. GOVERNING LAW
          This Agreement shall be governed by and construed in accordance with the laws of the [Your State/Country], without regard to its conflict of laws principles.
          8. ENTIRE AGREEMENT
          This Agreement constitutes the entire agreement between you and the Licensor regarding the Software and supersedes all prior agreements and understandings, whether written or oral, relating to the Software.
          9. CONTACT INFORMATION
          For any questions about this Agreement, please contact:
          [Your Company Name]
          [Your Address]
          [Your Email Address]
          [Your Phone Number]
          BY INSTALLING OR USING THE SOFTWARE, YOU ACKNOWLEDGE THAT YOU HAVE READ AND UNDERSTOOD THIS AGREEMENT AND AGREE TO BE BOUND BY ITS TERMS.`},
      },
    });

    const score = await getGitHubLicenseScore('owner', 'name');

    // Verify the results
    expect(score).toBe(0);
  });

});

describe('getNpmLicenseScore', () => {
  afterEach(() => {
    // Restore all mocks after each test
    vi.restoreAllMocks();
  });
  it('should return 1 for an npm module with a compatible license', async () => {
    // Mock the helper function results for a GitHub case
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        license: 'MIT',
      }),
    });

    // Call the function
    const score = await getNpmLicenseScore('name');

    // Verify the results
    expect(score).toBe(1);
  });

  it('should return 0 for an npm repo with no license', async () => {
    // Mock the helper function results for a GitHub case with no license
    // Call the function
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        license: null,
      }),
    });
    const score = await getNpmLicenseScore('name');

    // Verify the results
    expect(score).toBe(0);
  });


  it('should return 0 for an npm module with an incompatible license', async () => {
    // Mock the helper function results for a GitHub case with an incompatible license
    // Call the function
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        license: 'Proprietary',
      }),
    });
    const score = await getNpmLicenseScore('name');

    // Verify the results
    expect(score).toBe(0);
  });
});

