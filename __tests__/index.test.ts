import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as utils from '../src/utils.ts';
import * as score from '../src/score.ts';
import * as fs from "fs";

vi.mock('./score');
vi.mock('./utils');
// Mock the `fs` module
vi.mock('fs');

const clearIndexCache = () => {
    // Delete the cached module entry to force re-import of index.ts
    delete require.cache[require.resolve('../src/index.ts')];
  };
describe('CLI logic', () => {
  const originalArgv = process.argv; // Save the original process.argv
  beforeEach(() => {
        process.argv = [...originalArgv]; // Reset process.argv before each test
        vi.clearAllMocks();
        clearIndexCache();  // Ensure fresh module import
  });
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('should return the expected output given a file of valid URLs', async () => {
    process.argv = ['node', 'dist/index.js', 'SampleUrlFile.txt'];
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('https://github.com/cloudinary/cloudinary_npm\nhttps://www.npmjs.com/package/express');
    const mockGetScores = vi.spyOn(score, 'getScores').mockResolvedValueOnce('some-score-output');;
    const mockGetLinkType = vi.spyOn(utils, 'getLinkType')
    clearIndexCache();
    await import('../src/index.ts');

    expect(mockGetScores).toHaveBeenCalledTimes(2);
    expect(mockGetLinkType).toHaveBeenCalledTimes(2);
  }, { timeout: 10000 });
});
