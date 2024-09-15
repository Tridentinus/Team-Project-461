import {getLicenseScore} from './license.js';
import { analyzeUrl } from './analyzeUrl.js';
import { isGithub, isNpm, getGithubRepo } from './analyzeUrl.js';
import { fetchRepoContributors, calculateBusFactor } from './busFactor.js';
import * as fs from 'fs';
import * as readline from 'readline';
import * as dotenv from 'dotenv';

dotenv.config();  // Load environment variables
const logFile = process.env.LOG_FILE || 'myLog.log';  // Log file path
const token = process.env.GITHUB_TOKEN || '';  // GitHub token
// Function to log messages to the log file
function logMessage(level: string, message: string) {
  const logEntry = `${new Date().toISOString()} [${level}] - ${message}\n`;
  fs.appendFileSync(logFile, logEntry, { flag: 'a' });
}

// Function to handle process termination with logging
function exitWithError(message: string) {
  console.error(message);
  logMessage('ERROR', message);
  process.exit(1);
}

// Main CLI logic
const args = process.argv.slice(2); // exclude first two arguments (node and script path)

if (args.length !== 1) {
  const errorMessage = "Incorrect number of arguments provided";
  console.log(errorMessage);
  logMessage('ERROR', errorMessage);
  process.exit(1);
} else if (args[0] === "install") {
  const installMessage = "Installing dependencies...";
  console.log(installMessage);
  logMessage('INFO', installMessage);
  // Add your npm install logic here if needed
} else if (args[0] === "test") {
  const testMessage = "Running tests...";
  console.log(testMessage);
  logMessage('INFO', testMessage);
  // Add your test logic here if needed
} else {
  // otherwise, assume we have a URL_FILE
  const license_score = await getLicenseScore(args[0]);
  console.log(`License compatibility score: ${license_score}`);
  const urlFilePath = args[0];
  const token = process.env.GITHUB_TOKEN;

  if (!token || typeof token !== 'string') {
    exitWithError("Error: No GitHub token provided");
  }

  logMessage('INFO', `Processing URL file: ${urlFilePath}`);
  processUrls(urlFilePath, token as string);
}

// Function to process URLs from the file
async function processUrls(urlFilePath: string, token: string) {
  if (!fs.existsSync(urlFilePath)) {
    exitWithError(`Error: URL file does not exist: ${urlFilePath}`);
  }

  const rl = readline.createInterface({
    input: fs.createReadStream(urlFilePath),
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    const url = line.trim();
    if (url) {
      const analyzingMessage = `Analyzing URL: ${url}`;
      console.log(analyzingMessage);
      logMessage('INFO', analyzingMessage);
      try {
        await analyzeUrl(url, token);
        logMessage('INFO', `Successfully analyzed: ${url}`);
      } catch (error) {
        const errorMessage = `Error analyzing URL: ${url} - ${(error as Error).message}`;
        console.error(errorMessage);
        logMessage('ERROR', errorMessage);
      }
    }
  }

  rl.on('close', () => {
    const finishedMessage = "Finished processing URLs";
    console.log(finishedMessage);
    logMessage('INFO', finishedMessage);
  });
}

async function analyzeRepository(owner: string, repo: string, token: string) {
  try {
    logMessage('INFO', `Fetching contributors for ${owner}/${repo}...`);
    console.log(`Fetching contributors for ${owner}/${repo}...`);

    // Fetch contributors and calculate the Bus Factor
    const contributors = await fetchRepoContributors(owner, repo, token);

    if (contributors) {
      const busFactor = calculateBusFactor(contributors);
      logMessage('INFO', `Bus factor for ${owner}/${repo}: ${busFactor}`);
      console.log(`Bus factor for ${owner}/${repo}: ${busFactor}`);
    } else {
      logMessage('ERROR', `Failed to fetch contributors for ${owner}/${repo}`);
    }
  } catch (error) {
    const errorMessage = `Error analyzing repository ${owner}/${repo}: ${(error as Error).message}`;
    logMessage('ERROR', errorMessage);
    console.error(errorMessage);
  }
}
