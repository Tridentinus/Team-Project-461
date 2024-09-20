import dotenv from 'dotenv';
import { GraphQLClient } from 'graphql-request';
dotenv.config(); // Load environment variables

// TODO: Add GitHub token as a secret on the repository. Then remove the default value.
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const LOG_FILE = process.env.LOG_FILE || 'myLog.log';
const LOG_LEVEL = process.env.LOG_LEVEL || 'INFO';

if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN is required');
}

// Validate the GitHub token
await validateGitHubToken(GITHUB_TOKEN).then(isValid => {
    if (!isValid) {
        throw new Error('Invalid GitHub token');
    }
});

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
      console.log(`GitHub token is valid for user: ${data.viewer.login}`);
      return true;
    } catch (error) {
      console.error('Invalid GitHub token',token );
      return false;
    }
  }
  