import { describe, it, expect, vi, afterEach } from 'vitest';
import { isLicenseCompatible,  extractLicenseFromText } from '../src/license';
import * as utils from '../src/utils';



describe('isLicenseCompatible', () => {
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

    const result = await isLicenseCompatible('owner', 'repo');
    expect(result).toBe(1);
  });
  
  it('should return the correct SPDX ID if license info is provided in only the README file', async () => {
    vi.spyOn(utils, 'gitHubRequest').mockResolvedValue({
      repository: {
        licenseInfo: { spdxId: null },
        readme: { text: `MIT License`},
        licenseFile: { text: null},
      },
    });

    const result = await isLicenseCompatible('owner', 'repo');
    expect(result).toBe(1);
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

    const result = await isLicenseCompatible('owner', 'repo');
    expect(result).toBe(0);
  });

  it('should return 0 on error', async () => {
    // Spy on the functions
    vi.spyOn(utils, 'gitHubRequest').mockRejectedValue(new Error('Network error'));
  
    const result = await isLicenseCompatible('owner', 'name');
    expect(result).toBe(0);

  });
});

const licenseMappings = {
  'Academic Free License v3.0': 'AFL-3.0',
  'Apache license 2.0': 'Apache-2.0',
  'Artistic license 2.0': 'Artistic-2.0',
  'Boost Software License 1.0': 'BSL-1.0',
  'BSD 2-clause "Simplified" license': 'BSD-2-Clause',
  'BSD 3-clause "New" or "Revised" license': 'BSD-3-Clause',
  'BSD 3-clause Clear license': 'BSD-3-Clause-Clear',
  'BSD 4-clause "Original" or "Old" license': 'BSD-4-Clause',
  'BSD Zero-Clause license': '0BSD',
  'Creative Commons Zero v1.0 Universal': 'CC0-1.0',
  'Creative Commons Attribution 4.0': 'CC-BY-4.0',
  'Creative Commons Attribution ShareAlike 4.0': 'CC-BY-SA-4.0',
  'Educational Community License v2.0': 'ECL-2.0',
  'Eclipse Public License 1.0': 'EPL-1.0',
  'Eclipse Public License 2.0': 'EPL-2.0',
  'European Union Public License 1.1': 'EUPL-1.1',
  'GNU Affero General Public License v3.0': 'AGPL-3.0',
  'GNU General Public License v2.0': 'GPL-2.0',
  'GNU General Public License v3.0': 'GPL-3.0',
  'GNU Lesser General Public License v2.1': 'LGPL-2.1',
  'GNU Lesser General Public License v3.0': 'LGPL-3.0',
  'ISC License': 'ISC',
  'LaTeX Project Public License v1.3c': 'LPPL-1.3c',
  'Microsoft Public License': 'MS-PL',
  'MIT License': 'MIT',
  'Mozilla Public License 2.0': 'MPL-2.0',
  'Open Software License 3.0': 'OSL-3.0',
  'PostgreSQL License': 'PostgreSQL',
  'SIL Open Font License 1.1': 'OFL-1.1',
  'University of Illinois/NCSA Open Source License': 'NCSA',
  'The Unlicense': 'Unlicense',
  'zLib License': 'Zlib'
};

describe('extractLicenseFromText', () => {
  for (const [name, spdxId] of Object.entries(licenseMappings)) {
    it(`should return the correct SPDX license ID for "${name}"`, () => {
      const text = `This project is licensed under the ${name}`;
      expect(extractLicenseFromText(text)).toBe(spdxId);
    });

    it(`should return the correct SPDX license ID for case-insensitive match of "${name}"`, () => {
      const text = `This project is licensed under the ${name.toUpperCase()}`;
      expect(extractLicenseFromText(text)).toBe(spdxId);
    });

    it(`should return the correct SPDX license ID for partial match of "${name}"`, () => {
      const text = `Details about the ${name.split(' ')[0]}`;
      expect(extractLicenseFromText(text)).toBe(null); // Assuming partial match should not return any SPDX ID
    });
  }

  it('should return null if no license name is found in the text', () => {
    const text = 'This is a generic text without any license information.';
    expect(extractLicenseFromText(text)).toBe(null);
  });

  it('should return null if the text is null', () => {
    expect(extractLicenseFromText(null)).toBe(null);
  });

  it('should return null if the text is an empty string', () => {
    expect(extractLicenseFromText('')).toBe(null);
  });

  it('should return null if the license name is present but not in the mappings', () => {
    const text = 'Licensed under a new and obscure license not in the mappings';
    expect(extractLicenseFromText(text)).toBe(null);
  });
});