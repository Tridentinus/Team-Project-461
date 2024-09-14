import { describe, it, expect, vi } from 'vitest';
import { calculateRampUpScore, getDocumentationScore, getDependenciesScore } from '../src/rampUpTime';
import * as simpleGitModule from 'simple-git';
import * as graphqlRequestModule from 'graphql-request';
import * as fs from 'fs';

// Mock external dependencies
vi.mock('graphql-request');
vi.mock('simple-git');
vi.mock('fs');

describe('calculateRampUpScore', () => {
  afterEach(() => {
    // Restore mocks after each test
    vi.restoreAllMocks();
  });

  it('should calculate ramp-up score with valid data', async () => {
    // Mock GraphQL request for README
    vi.spyOn(graphqlRequestModule, 'request').mockResolvedValue({
      repository: {
        object: {
          text: '## Installation\n## Usage\n## API\n## Examples'
        }
      }
    });

    // Mock simple-git clone
    const cloneMock = vi.fn().mockResolvedValue(true);
    vi.spyOn(simpleGitModule, 'simpleGit').mockReturnValue({
      clone: cloneMock
    } as unknown as simpleGitModule.SimpleGit);

    // Mock dependencies in package.json
    vi.spyOn(fs, 'existsSync').mockReturnValue(true); // Check if package.json exists
    vi.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({ dependencies: { react: "^17.0.0" } }));

    const repoUrl = 'https://github.com/facebook/react';
    const repoPath = '/path/to/repo';
    const result = await calculateRampUpScore(repoUrl, repoPath);

    expect(result.documentationScore).toBe(1);
    expect(result.dependenciesScore).toBe(0); 
  });

  it('should return 0 for missing README file', async () => {
    // Mock GraphQL request for missing README
    vi.spyOn(graphqlRequestModule, 'request').mockResolvedValue({
      repository: {
        object: null // No README found
      }
    });

    const repoUrl = 'https://github.com/facebook/react';
    const repoPath = '/path/to/repo';
    const result = await calculateRampUpScore(repoUrl, repoPath);

    expect(result.documentationScore).toBe(0);
  });

  it('should return 0 for too many dependencies', async () => {
    // Mock GraphQL request for README
    vi.spyOn(graphqlRequestModule, 'request').mockResolvedValue({
      repository: {
        object: {
          text: '## Installation\n## Usage\n## API\n## Examples'
        }
      }
    });

    // Mock simple-git clone
    const cloneMock = vi.fn().mockResolvedValue(true);
    vi.spyOn(simpleGitModule, 'simpleGit').mockReturnValue({
      clone: cloneMock
    } as unknown as simpleGitModule.SimpleGit);

    // Mock too many dependencies in package.json
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({
      dependencies: {
        react: "^17.0.0",
        vue: "^3.0.0",
        angular: "^10.0.0",
        lodash: "^4.17.0"
      }
    }));

    const repoUrl = 'https://github.com/facebook/react';
    const repoPath = '/path/to/repo';
    const result = await calculateRampUpScore(repoUrl, repoPath);

    expect(result.dependenciesScore).toBeLessThan(1); // Too many dependencies
  });
});
