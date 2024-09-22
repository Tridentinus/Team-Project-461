import dotenv from 'dotenv';
import { GraphQLClient } from 'graphql-request';
import fs from 'fs';
import { logMessage } from './utils.js';
dotenv.config(); // Load environment variables

// TODO: Add GitHub token as a secret on the repository. Then remove the default value.
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const LOG_FILE = process.env.LOG_FILE || 'myLog.log';
const LOG_LEVEL = process.env.LOG_LEVEL || '0';

if (!GITHUB_TOKEN) {
  logMessage('ERROR', 'GitHub token is missing');
  process.exit(1);
}

// create empty log file
fs.writeFileSync(LOG_FILE, '', { flag: "w" });


// Validate the GitHub token
try {
  const isValid = validateGitHubToken(GITHUB_TOKEN);
  if (!isValid) {
    logMessage('ERROR', 'Invalid GitHub token');
    process.exit(1);
  }
} catch (error) {
  logMessage('ERROR', `GitHub token validation error: ${(error as Error).message}`);
  process.exit(1);
}

export { GITHUB_TOKEN, LOG_FILE, LOG_LEVEL };


export async function validateGitHubToken(token: string): Promise<boolean> {
    const client = new GraphQLClient('https://api.github.com/graphql', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  
    const query = `
      query {
        viewer {
          login
        }
      }
    `;
  
    try {
      // Try making a simple request to GitHub's API to check the token
      interface GitHubViewerResponse {
        viewer: {
          login: string;
        };
      }

      const data: GitHubViewerResponse = await client.request(query);
      //check error to see if the token is valid (err: "Bad credentials")
        return true;
    }
    catch (error) {
      if ((error as Error).message.includes('Bad credentials')) {
        return false;
      
      } 
      logMessage('ERROR', `GitHub token validation error: ${(error as Error).message}`);
      throw error;//throw error if it is not a bad credentials error
    }
    }
