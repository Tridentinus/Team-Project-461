import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { measureCorrectness, CorrectnessMetrics } from '../src/correctness';
import { ESLint } from 'eslint';
import fs from 'fs/promises';
import dotenv from 'dotenv';
import simpleGit from 'simple-git';
import path from 'path';

vi.mock('simple-git');
vi.mock('fs/promises');
vi.mock('eslint');

describe('Mocked Integration test: measureCorrectness', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should clone and analyze the Team-Project-461 repository', async () => {
    const owner = 'Tridentinus';
    const repo = 'Team-Project-461';
    const token = "not used";

    console.log(`Starting mocked test for ${owner}/${repo}`);

    // Mock simpleGit
    const mockClone = vi.fn().mockResolvedValue(undefined);
    vi.mocked(simpleGit).mockReturnValue({ clone: mockClone } as any);

    // Mock fs.access and fs.readdir
    vi.mocked(fs.access).mockResolvedValue(undefined);
    vi.mocked(fs.readdir).mockResolvedValue(['file1.js', 'file2.ts'] as any);

    // Mock ESLint
    vi.mocked(ESLint).mockImplementation(() => ({
      lintFiles: vi.fn().mockResolvedValue([
        { errorCount: 2, warningCount: 3 },
        { errorCount: 1, warningCount: 1 },
      ]),
    } as any));

    try {
      const result = await measureCorrectness(owner, repo, token);

      console.log('Mocked test result:', result);

      expect(result).toHaveProperty('eslintScore');
      expect(result.eslintScore).toBeGreaterThanOrEqual(0);
      expect(result.eslintScore).toBeLessThanOrEqual(1);

      console.log(`Mocked correctness score for ${owner}/${repo}: ${result.eslintScore}`);

      // Check if clone was called
      expect(mockClone).toHaveBeenCalledWith(`https://github.com/${owner}/${repo}.git`, expect.any(String));
    } catch (error) {
      console.error('Mocked test error:', error);
      throw error;
    }
  });
});

describe('Real Integration test: measureCorrectness', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unmock('simple-git');
    vi.unmock('fs/promises');
    vi.unmock('eslint');
  });

  it('should clone and analyze the actual Team-Project-461 repository', async () => {
    const owner = 'Tridentinus';
    const repo = 'Team-Project-461';
    const token = ''; // No token needed for public repos

    console.log(`Starting real clone test for ${owner}/${repo}`);

    try {
      const result = await measureCorrectness(owner, repo, token);

      console.log('Real test result:', result);

      expect(result).toHaveProperty('eslintScore');
      expect(result.eslintScore).toBeGreaterThanOrEqual(0);
      expect(result.eslintScore).toBeLessThanOrEqual(1);

      console.log(`Real correctness score for ${owner}/${repo}: ${result.eslintScore}`);

      // Verify that the repository was actually cloned
      const repoDir = path.join(process.cwd(), 'correctness_repo');
      const repoExists = await fs.access(repoDir).then(() => true).catch(() => false);
      expect(repoExists).toBe(true);

    } catch (error) {
      console.error('Real test error:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      throw error;
    } finally {
      // Clean up: delete the contents of the cloned repository
      const repoDir = path.join(process.cwd(), 'correctness_repo');
      try {
        await fs.rm(repoDir, { recursive: true, force: true });
        console.log('Cleanup completed');
      } catch (error) {
        console.error('Error cleaning up repository contents:', error);
      }
    }
  }, 300000); // Increase timeout to 5 minutes for real cloning and analysis
});


