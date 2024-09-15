import { getGitHubLicenseScore, getNpmLicenseScore } from './license.js';
import { getRepoOwnerAndName, getNpmName, getLinksFromFile, getLinkType, logMessage } from './utils.js';
import { fetchRepoContributors, calculateBusFactor } from './busFactor.js';
import { exec } from 'child_process';
import { analyzeUrl } from './analyzeUrl.js';
import * as dotenv from 'dotenv';
import { GITHUB_TOKEN } from './config.js';

dotenv.config();  // Load environment variables

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
  // check if the argument is "install"
  console.log("Installing dependencies...");
  exec('npm install', (error, stdout, stderr) => {
    if (error) {
        console.error(`Error executing npm install: ${error.message}`);
        process.exit(1);
    }

    if (stderr) {
        console.error(`npm install stderr: ${stderr}`);
        process.exit(1);
    }

    console.log(`npm install stdout: ${stdout}`);
    const installMessage = "Installing dependencies...";
    console.log(installMessage);
    logMessage('INFO', installMessage);
    process.exit(0);
});
} else if (args[0] === "test") {
  const testMessage = "Running tests...";
  console.log(testMessage);
  logMessage('INFO', testMessage);
  // Add your test logic here if needed
} else {
  // otherwise, assume we have a URL_FILE
  
  // Read links from file
  const links = getLinksFromFile(args[0]);

  for (const link of links) {
    console.log(`Analyzing repository: ${link}`);

    const linkType = getLinkType(link);

    if (linkType === 'Unknown') {
      console.log(`Unknown link type: ${link}`);
      process.exit(1);
    }

    if (linkType === 'npm') {
      const name = getNpmName(link);
      if (!name) {
        console.log(`Invalid npm link: ${link}`);
        process.exit(1);
      }
      const license_score = await getNpmLicenseScore(name);
    }

    if (linkType === 'GitHub') {
      const { owner, name } = getRepoOwnerAndName(link) || { owner: '', name: '' };
      if (!owner || !name) {
        console.log(`Invalid GitHub link: ${link}`);
        process.exit(1);
      }
      const license_score = await getGitHubLicenseScore(owner, name);
      const contributors = await fetchRepoContributors(owner, name, GITHUB_TOKEN);
      const bus_factor = calculateBusFactor(contributors);
      
      console.log(`License score: ${license_score}`);
      console.log(`Bus factor: ${bus_factor}`);
    }
  }

  // Trent's code
  const urlFilePath = args[0];
  logMessage('INFO', `Processing URL file: ${urlFilePath}`);
  processUrls(urlFilePath);
}

// Function to process URLs from the file
async function processUrls(urlFilePath: string) {
  const urls = getLinksFromFile(urlFilePath);

  for (const url of urls) {
    if (url) {
      const analyzingMessage = `Analyzing URL: ${url}`;
      console.log(analyzingMessage);
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

