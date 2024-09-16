import { getGitHubScores, getNpmScores } from './score.js';
import { parseGitHubUrl, parseNpmUrl, getUrlsFromFile, getLinkType, logMessage, npmToGitHub } from './utils.js';
import { exec } from 'child_process';
import * as dotenv from 'dotenv';
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
  logMessage('ERROR', errorMessage);
  process.exit(1);
} else if (args[0] === "install") {
  // check if the argument is "install"
  logMessage('INFO', 'Installing dependencies...');
  exec('npm install', (error, stdout, stderr) => {
    if (error) {
        logMessage('ERROR', `Error executing npm install: ${error.message}`);
        process.exit(1);
    }

    if (stderr) {
        logMessage('ERROR', `npm install stderr: ${stderr}`);
        process.exit(1);
    }

    const installMessage = "Installing dependencies...";
    logMessage('INFO', installMessage);
    process.exit(0);
});
} else if (args[0] === "test") {
  const testMessage = "Running tests...";

  logMessage('INFO', testMessage);
  // Add your test logic here if needed
} else {
  // otherwise, assume we have a URL_FILE
  
  // Read links from file
  const url_array = getUrlsFromFile(args[0]);

  for (const url of url_array) {
    logMessage('INFO', `Analyzing repository: ${url}`);

    let linkType = getLinkType(url);

    if (linkType === 'Unknown') {
      logMessage('ERROR', `Unknown link type: ${url}`);
      process.exit(1);
    }

    let {owner, repo} = {owner: '', repo: ''};

    if (linkType === 'npm') {
      const npmName = parseNpmUrl(url);

      if (!npmName) {

        logMessage('ERROR', `Invalid npm link: ${url}`);
        process.exit(1);
      }

      const repoInfo = await npmToGitHub(npmName);
      if (repoInfo) {
        owner = repoInfo.owner;
        repo = repoInfo.repo;
        const message = `GitHub repository found for npm package: ${owner}/${repo}`;
        logMessage('INFO', message);
      }
      else {
        const output = await getNpmScores(npmName);
        console.log(output);
      }
    }

    if (linkType === 'GitHub' || (linkType === 'npm' && owner && repo)) {
      if (!owner || !repo) {
        const { owner: o, repo: r } = parseGitHubUrl(url) || { owner: '', repo: '' };
        owner = o;
        repo = r;
      }

      if (!owner || !repo) {
        logMessage('ERROR', `Invalid GitHub link: ${url}`);
        process.exit(1);
      }

      const output = await getGitHubScores(owner, repo);
      console.log(output);
    }
  }
}
