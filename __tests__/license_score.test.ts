import { describe, it, expect, vi } from 'vitest';
import { getLicenseScore } from '../src/license';
import * as license from '../src/license'; // Adjust path to the file where the function is located
import * as utils from '../src/utils'; // Adjust path to the helpers file


describe('getLicenseScore', () => {
  afterEach(() => {
    // Restore all mocks after each test
    vi.restoreAllMocks();
  });
  it('should return 1 for a GitHub link with a compatible license', async () => {
    // Mock the helper function results for a GitHub case
    vi.spyOn(utils, 'getLinkType').mockReturnValue('GitHub');
    vi.spyOn(utils, 'request').mockResolvedValue({
      repository: {
        licenseInfo: {
          spdxId: 'MIT',
        },
      },
    });
    vi.spyOn(utils, 'getRepoOwnerAndName').mockReturnValue({ owner: 'facebook', name: 'react' });
    vi.spyOn(license, 'getGitHubLicense').mockResolvedValue('MIT');
    vi.spyOn(license, 'isLicenseCompatible').mockReturnValue(1);

    // Call the function
    const score = await getLicenseScore('https://github.com/facebook/react');

    // Verify the results
    expect(score).toBe(1);
  });

  it('should return the 1 for an npm link with a compatible license', async () => {
    // Mock the helper function results for an npm case
    vi.spyOn(utils, 'getLinkType').mockReturnValue('npm');
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        license: 'MIT',
      }),
    });
    vi.spyOn(utils, 'getModuleNameFromNpmLink').mockReturnValue('react');
    vi.spyOn(license, 'getNpmLicense').mockResolvedValue('MIT');
    vi.spyOn(license, 'isLicenseCompatible').mockReturnValue(1); // Assume 1 means compatible

    // Call the function
    const score = await getLicenseScore('https://www.npmjs.com/package/react');

    // Verify the results
    expect(score).toBe(1);
  });

  it('should return 0 for an invalid link type', async () => {
    // Mock the helper function to return an invalid link type
    vi.spyOn(utils, 'getLinkType').mockReturnValue('Unknown');
    
    // Call the function
    const score = await getLicenseScore('https://invalid-url.com');

    // Verify the results
    expect(score).toBe(0);
  });

  it('should return 0 for a GitHub repo with no license', async () => {
    // Mock the helper function results for a GitHub case with no license
    // Call the function
    vi.spyOn(utils, 'request').mockResolvedValue({
      repository: {
        licenseInfo: null,
      },
    });
    const score = await getLicenseScore('https://github.com/facebook/react');

    // Verify the results
    expect(score).toBe(0);
  });

  it('should return 0 for an npm repo with no license', async () => {
    // Mock the helper function results for a GitHub case with no license
    // Call the function
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        license: null,
      }),
    });
    const score = await getLicenseScore('https://www.npmjs.com/package/react');

    // Verify the results
    expect(score).toBe(0);
  });

  it('should return 0 for a GitHub repo with an incompatible license', async () => {
    // Mock the helper function results for a GitHub case with an incompatible license
    // Call the function
    vi.spyOn(utils, 'request').mockResolvedValue({
      repository: {
        licenseInfo: {
          spdxId: 'Proprietary',
        },
      },
    });
    const score = await getLicenseScore('https://github.com/facebook/react');

    // Verify the results
    expect(score).toBe(0);
  });

  it('should return 0 for an npm repo with an incompatible license', async () => {
    // Mock the helper function results for an npm case with an incompatible license
    // Call the function
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        license: 'Proprietary',
      }),
    });
    const score = await getLicenseScore('https://www.npmjs.com/package/react');

    // Verify the results
    expect(score).toBe(0);
  });
});
