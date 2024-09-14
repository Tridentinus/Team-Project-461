import { describe, it, expect, vi } from 'vitest';
import { getGitHubLicense, getNpmLicense, isLicenseCompatible, getLicenseScore } from '../src/license';
import * as utils from '../src/utils';

describe('getGitHubLicense', () => {
  it('should return the license spdxId when the repository has a license', async () => {
    const mockRequest = vi.spyOn(utils, 'request').mockResolvedValue({
      repository: {
        licenseInfo: {
          spdxId: 'MIT',
        },
      },
    });

    const license = await getGitHubLicense('owner', 'repo', 'token');
    expect(license).toBe('MIT');
    mockRequest.mockRestore();
  });

  it('should return null when the repository does not have a license', async () => {
    const mockRequest = vi.spyOn(utils, 'request').mockResolvedValue({
      repository: {
        licenseInfo: null,
      },
    });

    const license = await getGitHubLicense('owner', 'repo', 'token');
    expect(license).toBeNull();
    mockRequest.mockRestore();
  });
});

describe('getNpmLicense', () => {
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

  it('should return "No license information found" when no license is present', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({}),
    });

    const license = await getNpmLicense('package-name');
    expect(license).toBe('No license information found');
  });
});

describe('isLicenseCompatible', () => {
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
