import fs from 'fs/promises';
import path from 'path';
import { ESLint } from 'eslint';
import { simpleGit, SimpleGit, CleanOptions } from 'simple-git';

interface CorrectnessMetrics {
  eslintScore: number;
}

async function cleanUp(repoDir: string): Promise<void> {
  console.log(`Cleaning up ${repoDir}`);
  try {
    await fs.rm(repoDir, { recursive: true, force: true });
    console.log('Cleanup completed');
  } catch (error) {
    console.error('Error cleaning up repository contents:', error);
  }
}

async function ensureRepoDir(repoDir: string): Promise<void> {
  try {
    await fs.access(repoDir);
    console.log(`${repoDir} exists, clearing contents...`);
    await cleanUp(repoDir);
  } catch {
    console.log(`${repoDir} does not exist, creating directory...`);
    await fs.mkdir(repoDir);
  }
}

async function measureCorrectness(owner: string, repo: string, token: string): Promise<CorrectnessMetrics> {
  const repoDir = path.join(process.cwd(), 'correctness_repo');
  await ensureRepoDir(repoDir);

  try {
    console.log(`Attempting to clone repository: ${owner}/${repo} into ${repoDir}`);
    
    const git: SimpleGit = simpleGit().clean(CleanOptions.FORCE);
    
    // Clone the repository
    const repoUrl = `https://github.com/${owner}/${repo}.git`;
    console.log(`Cloning from: ${repoUrl}`);
    await git.clone(repoUrl, repoDir);
    console.log('Repository cloned successfully');

    // Check if the repository was actually cloned
    const repoExists = await fs.access(repoDir).then(() => true).catch(() => false);
    if (!repoExists) {
      throw new Error(`Repository directory ${repoDir} does not exist after cloning`);
    }

    // List contents of the cloned directory
    const files = await fs.readdir(repoDir);
    console.log(`Contents of ${repoDir}:`, files);

    console.log('Initializing ESLint');
    // Run ESLint with a basic configuration
    const eslint = new ESLint();
    console.log(`Linting files in ${repoDir}`);
    const results = await eslint.lintFiles([path.join(repoDir, '**', '*.{ts, tsx}')]);
    console.log('ESLint results:', JSON.stringify(results, null, 2));

    if (!results || results.length === 0) {
      console.log('No linting results found');
      await cleanUp(repoDir);
      return { eslintScore: 0 };
    }
    
    // Calculate score based on ESLint results
    console.log('Calculating ESLint score');
    const totalProblems = results.reduce((sum: number, result: ESLint.LintResult) => sum + result.errorCount + result.warningCount, 0);
    const totalFiles = results.length;
    console.log(`Total problems: ${totalProblems}, Total files: ${totalFiles}`);
    const eslintScore = Math.max(0, 1 - (totalProblems / (totalFiles * 10))); // Adjust the denominator as needed

    console.log(`Final ESLint score: ${eslintScore}`);
    await cleanUp(repoDir);
    return {
      eslintScore: Number(eslintScore.toFixed(2)),
    };
  } catch (error) {
    console.error('Error measuring correctness:', error);
    await cleanUp(repoDir);
    if (error instanceof Error && error.message.includes('clone')) {
      throw new Error(`Error measuring correctness: Clone failed - ${error.message}`);
    }
    throw new Error(`Error measuring correctness: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export { measureCorrectness, CorrectnessMetrics };

measureCorrectness('Tridentinus', 'Team-Project-461', '');