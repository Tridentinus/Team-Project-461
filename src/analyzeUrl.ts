import axios from 'axios';
import * as fs from 'fs';
import { fetchYearContributors, calculateYearBusFactor} from './busFactor.js';
import { getGitHubLicense, isLicenseCompatible, getGitHubLicenseScore } from './license.js';
import { GITHUB_TOKEN } from './config.js';
import { getUrlsFromFile } from './utils.js';

// Log file path (can be set via environment variable)
const logFile = process.env.LOG_FILE || 'myLog.log';

// Function to log messages to the log file
function logMessage(level: string, message: string) {
  const logEntry = `${new Date().toISOString()} [${level}] - ${message}\n`;
  fs.appendFileSync(logFile, logEntry, { flag: 'a' });
}

export function isGithub(url: string): boolean {
  const gitRegex = /^(https?:\/\/)?(www\.)?github\.com\/[^/]+\/[^/]+/;
  const isGithubUrl = gitRegex.test(url);
  
  // Log whether the URL is a GitHub URL
  logMessage('INFO', `Checked if URL is GitHub: ${url} - Result: ${isGithubUrl}`);
  
  return isGithubUrl;
}

export function isNpm(url: string): boolean {
  const npmRegex = /^(https?:\/\/)?(www\.)?npmjs\.com\/package\/[^/]+/;
  const isNpmUrl = npmRegex.test(url);
  
  // Log whether the URL is an npm package URL
  logMessage('INFO', `Checked if URL is npm package: ${url} - Result: ${isNpmUrl}`);
  
  return isNpmUrl;
}

export async function getGithubRepo(url: string): Promise<{ owner: string, repo: string } | null> {
  const packageName = extractPackageName(url);
  const npmApiUrl = `https://api.npms.io/v2/package/${packageName}`;

  logMessage('INFO', `Fetching metadata for npm package: ${packageName}`);

  try {
    const response = await axios.get(npmApiUrl);

    // Accessing the repository field under the collected metadata
    const repositoryInfo = response.data.collected?.metadata?.repository;

    if (repositoryInfo) {
      logMessage('INFO', `Repository information for ${packageName}: ${JSON.stringify(repositoryInfo, null, 2)}`);
      console.log(`Repository information for ${packageName}:`, repositoryInfo);

      let repoUrl = repositoryInfo.url;
      // Remove the 'git+' prefix if it exists
      if (repoUrl.startsWith('git+')) {
        repoUrl = repoUrl.substring(4); // Remove 'git+'
      }
      // Remove the '.git' suffix if it exists
      if (repoUrl.endsWith('.git')) {
        repoUrl = repoUrl.slice(0, -4); // Remove '.git'
      }

      if (isGithub(repoUrl)) {
        const repoInfo = parseGithubUrl(repoUrl);
        logMessage('INFO', `Found GitHub repository: ${repoInfo.owner}/${repoInfo.repo}`);
        return repoInfo;
      } else {
        logMessage('ERROR', `No GitHub repository found for the npm package: ${url}`);
        console.error("No GitHub repository found for the package.");
        return null;
      }
    } else {
      logMessage('ERROR', `No repository information found for the npm package: ${url}`);
      console.error("No repository information found for the package.");
      return null;
    }
  } catch (error) {
    const errorMessage = `Error fetching package data from npm API for package: ${packageName}. Error: ${(error as Error).message}`;
    logMessage('ERROR', errorMessage);
    console.error(errorMessage);
    return null;
  }
}


function extractPackageName(url: string): string {
  const match = url.match(/https:\/\/www.npmjs.com\/package\/([^/]+)/);
  return match ? match[1] : '';
}

function parseGithubUrl(url: string): { owner: string, repo: string } {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (match) {
    return { owner: match[1], repo: match[2] };
  }
  return { owner: '', repo: '' };
}

export async function analyzeUrl(url: string, token: string) {
  logMessage('INFO', `Starting analysis for URL: ${url}`);
  console.log(`Analyzing URL: ${url}`);

  if (isGithub(url)) {
    const { owner, repo } = parseGithubUrl(url);
    const message = `GitHub repository detected: ${owner}/${repo}`;
    console.log(message);
    logMessage('INFO', message);

    // Fetch repository contributors and calculate Bus Factor
    await analyzeRepository(owner, repo, token);

  } else if (isNpm(url)) {
    const repoInfo = await getGithubRepo(url);
    if (repoInfo) {
      const { owner, repo } = repoInfo;
      const message = `GitHub repository found for npm package: ${owner}/${repo}`;
      console.log(message);
      logMessage('INFO', message);

      // Fetch repository contributors and calculate Bus Factor
      await analyzeRepository(owner, repo, token);
    }
  } else {
    const invalidUrlMessage = `Invalid URL provided: ${url}`;
    console.log(invalidUrlMessage);
    logMessage('ERROR', invalidUrlMessage);
  }

  logMessage('INFO', `Finished analysis for URL: ${url}`);
}

async function analyzeRepository(owner: string, repo: string, token: string) {
  try {
    logMessage('INFO', `Fetching contributors for ${owner}/${repo} over the last 12 months...`);
    console.log(`Fetching contributors for ${owner}/${repo} over the last 12 months...`);

    // Fetch contributors for the last 12 months

    const recentContributors = await fetchYearContributors(owner, repo, token);
    // Calculate the Bus Factor for the last 12 months
    if (recentContributors.length > 0) {
      const busFactor12Months = calculateYearBusFactor(recentContributors);
      logMessage('INFO', `Bus factor for the last 12 months for ${owner}/${repo}: ${busFactor12Months}`);
      console.log(`Bus factor for the last 12 months for ${owner}/${repo}: ${busFactor12Months}`);
    } else {
      logMessage('ERROR', `No contributors found for the past 12 months in ${owner}/${repo}`);
    }
  } catch (error) {
    const errorMessage = `Error analyzing repository ${owner}/${repo}: ${(error as Error).message}`;
    logMessage('ERROR', errorMessage);
    console.error(errorMessage);
  }
  // return license score
  const license = await getGitHubLicense(owner, repo);
  logMessage('INFO', `License for ${owner}/${repo}: ${license}`);
  console.log(`License for ${owner}/${repo}: ${license}`);

  //check if license is compatible
  const compatibility = isLicenseCompatible(license as string);
  if (compatibility === 1) {
    logMessage('INFO', `License is compatible with LGPLv2.1`);
    console.log(`License is compatible with LGPLv2.1`);
  }
  else {
    logMessage('INFO', `License is not compatible with LGPLv2.1`);
    console.log(`License is not compatible with LGPLv2.1`);
  }
 
}

// Function to process URLs from the file
export async function processUrls(urlFilePath: string) {
  const urls = getUrlsFromFile(urlFilePath);

  for (const url of urls) {
    if (url) {
      const analyzingMessage = `Analyzing URL: ${url}`;
      logMessage('INFO', analyzingMessage);
      try {
        await analyzeUrl(url, GITHUB_TOKEN);
        logMessage('INFO', `Successfully analyzed: ${url}`);
      } catch (error) {
        const errorMessage = `Error analyzing URL: ${url} - ${(error as Error).message}`;
        console.error(errorMessage);
        logMessage('ERROR', errorMessage);
      }
    }
  }
    const finishedMessage = "Finished processing URLs";
    console.log(finishedMessage);
    logMessage('INFO', finishedMessage);
}