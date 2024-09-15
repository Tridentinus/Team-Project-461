import { describe, it, expect, vi, afterEach } from 'vitest';
import { getGitHubLicense, getNpmLicense, isLicenseCompatible, getGitHubLicenseScore, getNpmLicenseScore } from '../src/license';
import * as utils from '../src/utils';

describe('getGitHubLicense', () => {
  afterEach(() => {
    // Restore all mocks after each test
    vi.restoreAllMocks();
  });
  it('should return the license spdxId when the repository has a license', async () => {
    vi.spyOn(utils, 'gitHubRequest').mockResolvedValue({
      repository: {
        licenseInfo: {
          spdxId: 'MIT',
        },
      },
    });

    const license = await getGitHubLicense('owner', 'repo');
    expect(license).toBe('MIT');
  });

  it('should return null when the repository does not have a license', async () => {
    vi.spyOn(utils, 'gitHubRequest').mockResolvedValue({
      repository: {
        licenseInfo: null,
      },
    });

    const license = await getGitHubLicense('owner', 'repo');
    expect(license).toBeNull();
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
      'LGPLv2.1', 'GPL-2.0', 'MIT', 'BSD-2-Clause', 'BSD-3-Clause',
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
        licenseInfo: {
          spdxId: 'MIT',
        },
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
        licenseInfo: null,
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
        licenseInfo: {
          spdxId: 'Proprietary',
        },
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

