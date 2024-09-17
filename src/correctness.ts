import { GraphQLClient } from 'graphql-request';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { ESLint } from 'eslint';

const execAsync = promisify(exec);

interface CorrectnessMetrics {
  eslintScore: number;
}

async function measureCorrectness(owner: string, repo: string, token: string): Promise<CorrectnessMetrics> {
  const repoDir = path.join(process.cwd(), 'correctness_repo');

  try {
    // Clone the repository
    await execAsync(`git clone https://github.com/${owner}/${repo}.git ${repoDir}`);

    // Run ESLint
    const eslint = new ESLint();
    const results = await eslint.lintFiles([`${repoDir}/**/*.{js,jsx,ts,tsx}`]);

    // Calculate score based on ESLint results
    const totalProblems = results.reduce((sum, result) => sum + result.errorCount + result.warningCount, 0);
    const totalFiles = results.length;
    const eslintScore = Math.max(0, 1 - (totalProblems / (totalFiles * 10))); // Adjust the denominator as needed

    return {
      eslintScore: Number(eslintScore.toFixed(2)),
    };
  } catch (error) {
    console.error('Error measuring correctness:', error);
    if (error instanceof Error && error.message.includes('git clone')) {
      throw new Error(`Error measuring correctness: Clone failed - ${error.message}`);
    }
    throw new Error(`Error measuring correctness: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    // Clean up: delete the cloned repository
    try {
      await fs.rm(repoDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Error deleting cloned repository:', error);
    }
  }
}

export { measureCorrectness, CorrectnessMetrics };