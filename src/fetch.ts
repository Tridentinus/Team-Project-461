import * as dotenv from 'dotenv';
import { fetchRepoData } from './graphqlClient.js';
import minimist from 'minimist';
import fs from 'fs';



// Load environment variables from .env file
dotenv.config();

// Parse command-line arguments
const args = minimist(process.argv.slice(2));

const logFile = process.env.LOG_FILE || 'myLog.log';  // Default log file
const token = args.token || process.env.GITHUB_TOKEN;
const owner = args.owner || args.o;
const name = args.repo || args.r;

// Function to log messages to the log file
function logMessage(message: string) {
  fs.appendFileSync(logFile, `${new Date().toISOString()} - ${message}\n`, { flag: 'a' });
}

if (!token) {
  logMessage('Error: No GitHub token provided');
  console.error('Error: Please provide a GitHub token either via --token or in the .env file');
  process.exit(1);
}

if (!owner || !name) {
  logMessage('Error: No owner or repository provided');
  console.error('Error: Please provide repository owner and name');
  process.exit(1);
}

(async () => {
  try {
    logMessage(`Fetching data for ${owner}/${name}...`);
    console.log(`Fetching data for ${owner}/${name}...`);

    // Pass token along with owner and repo name
    await fetchRepoData(owner, name, token);
  } catch (error) {
    const errorMessage = (error instanceof Error) ? error.message : 'Unknown error occurred';
    logMessage(`Error fetching data: ${errorMessage}`);
    console.error(`Error fetching data: ${errorMessage}`);
  }
})();
