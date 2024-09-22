import dotenv from 'dotenv';
import { GraphQLClient } from 'graphql-request';
dotenv.config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const LOG_FILE = process.env.LOG_FILE || '';
const LOG_LEVEL = process.env.LOG_LEVEL ?? 0;

if (!GITHUB_TOKEN) {
  throw new Error('GITHUB_TOKEN is required');
}

if (!LOG_FILE) {
  throw new Error('LOG_FILE is required');
}

// Validate the GitHub token
const isValid = await validateGitHubToken(GITHUB_TOKEN);
if (!isValid) {
  throw new Error('Invalid GitHub token');
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
    throw error;//throw error if it is not a bad credentials error
  }
}
