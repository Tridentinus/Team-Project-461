import { GraphQLClient } from 'graphql-request';
import fs from 'fs/promises';
import path from 'path';
import { ESLint } from 'eslint';
import { exec } from 'child_process';
import { promisify } from 'util';
import { simpleGit, SimpleGit, CleanOptions } from 'simple-git';

interface CorrectnessMetrics {
  eslintScore: number;
}

async function measureCorrectness(owner: string, repo: string, token: string): Promise<CorrectnessMetrics> {
  const repoDir = path.join(process.cwd(), 'correctness_repo');

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
    const results = await eslint.lintFiles([path.join(repoDir, 'src', 'license.ts')]);
    // const results = await eslint.lintFiles([`C:\\Users\\rtjor\\OneDrive - purdue.edu\\Documents\\Courses\\Fall 2024\\ECE 461\\Team-Project-461\\correctness_repo\\src\\license.ts`]);
    console.log('ESLint results:', JSON.stringify(results, null, 2));

    if (!results || results.length === 0) {
      console.log('No linting results found');
      return { eslintScore: 0 };
    }
    
    // Calculate score based on ESLint results
    console.log('Calculating ESLint score');
    const totalProblems = results.reduce((sum: number, result: ESLint.LintResult) => sum + result.errorCount + result.warningCount, 0);
    const totalFiles = results.length;
    console.log(`Total problems: ${totalProblems}, Total files: ${totalFiles}`);
    const eslintScore = Math.max(0, 1 - (totalProblems / (totalFiles * 10))); // Adjust the denominator as needed

    console.log(`Final ESLint score: ${eslintScore}`);
    return {
      eslintScore: Number(eslintScore.toFixed(2)),
    };
  } catch (error) {
    console.error('Error measuring correctness:', error);
    if (error instanceof Error && error.message.includes('clone')) {
      throw new Error(`Error measuring correctness: Clone failed - ${error.message}`);
    }
    throw new Error(`Error measuring correctness: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export { measureCorrectness, CorrectnessMetrics };

measureCorrectness('Tridentinus', 'Team-Project-461', '');