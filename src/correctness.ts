import fs from 'fs/promises';
import path from 'path';
import { ESLint } from 'eslint';
import { simpleGit, SimpleGit, CleanOptions } from 'simple-git';
import { logMessage } from './utils.js';
import { log } from 'console';


export async function cleanUp(repoDir: string): Promise<void> {
  logMessage('INFO', `Cleaning up ${repoDir}`);
  try {
    await fs.rm(repoDir, { recursive: true, force: true });
    
    // Retry logic: Check if directory is truly deleted
    const maxRetries = 5;
    const delayBetweenRetries = 500; // 0.5 seconds between retries
    let retries = 0;
    let dirExists = true;

    while (retries < maxRetries && dirExists) {
      try {
        await fs.access(repoDir);
        logMessage('INFO', `Directory still exists after removal attempt. Retrying...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenRetries));
      } catch {
        // Directory doesn't exist anymore
        dirExists = false;
      }
      retries++;
    }

    if (dirExists) {
      logMessage('ERROR', `Failed to fully clean up ${repoDir} after ${maxRetries} retries`);
    } else {
      logMessage('INFO', 'Repository contents cleaned up successfully');
    }
  } catch (error) {
    logMessage('ERROR', `Error cleaning up repository contents: ${error instanceof Error ? error.message : String(error)}`);
  }
}


export async function ensureRepoDir(repoDir: string): Promise<void> {
  try {
    await fs.access(repoDir);
    logMessage('INFO', `${repoDir} exists, clearing contents...`);
    await cleanUp(repoDir);
  } catch {
    logMessage('INFO', `${repoDir} does not exist, creating directory...`);
    await fs.mkdir(repoDir);
  }
}

export async function getCorrectness(owner: string, repo: string): Promise<number> {
  const repoDir = path.join(process.cwd(), 'correctness_repo');
  await ensureRepoDir(repoDir);

  try {

    const git: SimpleGit = simpleGit().clean(CleanOptions.FORCE);
    
    const repoUrl = `https://github.com/${owner}/${repo}.git`;
    logMessage('DEBUG', `Cloning from: ${repoUrl}`);
    await git.clone(repoUrl, repoDir, ['--depth', '1']);
    logMessage('INFO', 'Repository cloned successfully');

    // Verify repository existence
    await fs.access(repoDir);
    
    // List contents of the cloned directory
    const files = await fs.readdir(repoDir);
    logMessage('DEBUG', `Repository contents: ${files.join(', ')}`);

    // Initialize ESLint and lint files
    const eslint = new ESLint();
    logMessage('INFO', `Linting files in ${repoDir}`);
    const results = await eslint.lintFiles([path.join(repoDir, '**', '*.{ts,tsx,js,jsx}')]);
    // console.log('ESLint results:', JSON.stringify(results, null, 2));

    // Calculate ESLint score
    const totalProblems = results.reduce((sum, result) => sum + result.errorCount + result.warningCount, 0);
    const eslintScore = results.length > 0 ? Math.max(0, 1 - (totalProblems / (results.length * 10))) : 0;

    logMessage('INFO', `Final ESLint score: ${eslintScore}`);
    await cleanUp(repoDir);
    return parseFloat(eslintScore.toFixed(3));
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('No files matching')) {
        // Handle no files found error gracefully
        logMessage('INFO', 'No JavaScript or TypeScript files found.');
        await cleanUp(repoDir);
        return 0;
    }
    logMessage('ERROR', `Error measuring correctness: ${error instanceof Error ? error.message : String(error)}`);
    await cleanUp(repoDir);
    return 0;
  }
}