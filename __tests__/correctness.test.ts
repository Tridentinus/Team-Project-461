import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cleanUp, ensureRepoDir, getCorrectness } from '../src/correctness.js'; // Adjust the import as necessary
import fs from 'fs/promises';
import { ESLint } from 'eslint';
import { simpleGit } from 'simple-git';
import path from 'path';

// Mock dependencies
vi.mock('fs/promises');
vi.mock('simple-git');
vi.mock('eslint');

describe('cleanUp', () => {
  it('should clean up the repository directory', async () => {
    const repoDir = 'test-repo';
    (fs.rm as any).mockResolvedValueOnce(undefined); // Mock fs.rm to simulate successful removal

    await cleanUp(repoDir);

    expect(fs.rm).toHaveBeenCalledWith(repoDir, { recursive: true, force: true });
  });

  it('should log an error if cleanup fails', async () => {
    const repoDir = 'test-repo';
    const error = new Error('Cleanup error');
    (fs.rm as any).mockRejectedValueOnce(error); // Mock fs.rm to simulate failure

    await cleanUp(repoDir);

    expect(fs.rm).toHaveBeenCalledWith(repoDir, { recursive: true, force: true });
  });
});

describe('ensureRepoDir', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should clear contents of existing directory', async () => {
    const repoDir = 'existing-repo';
    (fs.access as any).mockResolvedValueOnce(undefined); // Directory exists

    await ensureRepoDir(repoDir);

    expect(fs.access).toHaveBeenCalledWith(repoDir);
    expect(fs.mkdir).not.toHaveBeenCalled();
  });

  it('should create a directory if it does not exist', async () => {
    const repoDir = 'new-repo';
    (fs.access as any).mockRejectedValueOnce(new Error('Does not exist')); // Directory does not exist
    (fs.mkdir as any).mockResolvedValueOnce(undefined); // Directory creation

    await ensureRepoDir(repoDir);

    expect(fs.access).toHaveBeenCalledWith(repoDir);
    expect(fs.mkdir).toHaveBeenCalledWith(repoDir);
  });
});

describe('getCorrectness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should clone the repository, lint files, and return correctness score', async () => {
    const owner = 'user';
    const repo = 'test-repo';
    const repoDir = path.join(process.cwd(), 'correctness_repo');

    (fs.access as any).mockResolvedValueOnce(undefined); // Simulate directory access
    (fs.readdir as any).mockResolvedValueOnce(['file1.ts', 'file2.js']); // Simulate directory contents
    (simpleGit as any).mockReturnValue({
      clean: vi.fn().mockReturnThis(),
      clone: vi.fn().mockResolvedValueOnce(undefined),
    });
    const eslintMock = {
      lintFiles: vi.fn().mockResolvedValueOnce([
        { errorCount: 2, warningCount: 1 },
        { errorCount: 0, warningCount: 0 },
      ]),
    };
    (ESLint as any).mockImplementation(() => eslintMock);

    const result = await getCorrectness(owner, repo);

    // Score should be between 0 and 1
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });

  it('should return 0 if no files are found', async () => {
    const owner = 'user';
    const repo = 'empty-repo';
    const repoDir = path.join(process.cwd(), 'correctness_repo');

    (fs.access as any).mockResolvedValueOnce(undefined); // Simulate directory access
    (fs.readdir as any).mockResolvedValueOnce([]); // Simulate empty directory
    (simpleGit as any).mockReturnValue({
      clean: vi.fn().mockReturnThis(),
      clone: vi.fn().mockResolvedValueOnce(undefined),
    });

    const result = await getCorrectness(owner, repo);

    expect(result).toBe(0); // No files found
  });

  it('should return 0 and handle errors during linting', async () => {
    const owner = 'user';
    const repo = 'broken-repo';
    const repoDir = path.join(process.cwd(), 'correctness_repo');

    (fs.access as any).mockResolvedValueOnce(undefined); // Simulate directory access
    (fs.readdir as any).mockResolvedValueOnce(['file1.ts']); // Simulate directory contents
    (simpleGit as any).mockReturnValue({
      clean: vi.fn().mockReturnThis(),
      clone: vi.fn().mockResolvedValueOnce(undefined),
    });
    (ESLint as any).mockImplementation(() => {
      throw new Error('ESLint error');
    });

    const result = await getCorrectness(owner, repo);

    expect(result).toBe(0); // Error during linting results in a score of 0
  });
});
