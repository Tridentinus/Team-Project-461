import { GraphQLClient } from "graphql-request";
import dotenv from "dotenv";
import * as fs from 'fs';

dotenv.config(); // Load environment variables

// Global variables
const endpoint = "https://api.github.com/graphql";  // GraphQL endpoint
const logFile = process.env.LOG_FILE || 'myLog.log';  // Log file path


export function getLinkType(link: string): string {
  const githubRegex = /^https?:\/\/(www\.)?github\.com\//;
  const npmRegex = /^https?:\/\/(www\.)?npmjs\.com\//;

  if (githubRegex.test(link)) {
    return 'GitHub';
  } else if (npmRegex.test(link)) {
    return 'npm';
  } else {
    return 'Unknown';
  }
}
  
  /**
 * Fetches repository data using a GraphQL query and a dynamic GitHub token.
 * @param query - The GraphQL query to fetch the data.
 * @param variables - The variables required for the GraphQL query.
 * @param token - The GitHub token used for authentication.
 * @returns The fetched data or null in case of an error.
 */

export async function request<TVariables extends object | undefined>(
  endpoint: string,
  query: string,
  variables: TVariables,
  token: string
) {
  // Create GraphQL client instance with dynamic token
  const client = new GraphQLClient(endpoint, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`, // Use the provided token instead of process.env.GITHUB_TOKEN
    },
  });
  try {
    const data = await client.request(query, variables);
    return data; // Return the fetched data
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`Error fetching data: ${errorMessage}`);
    return null; // Return null in case of error
  }
}

/**
 * Extracts the owner and name of a GitHub repository from a given repository link.
 * @param repoLink - The link to the GitHub repository.
 * @returns An object containing the owner and name of the repository, or null if the link is invalid.
 */
export function getRepoOwnerAndName(repoLink: string): { owner: string, name: string } | null {
  const regex = /https:\/\/github\.com\/([^\/]+)\/([^\/]+)/;
  const match = repoLink.match(regex);

  if (match && match.length === 3) {
    const owner = match[1];
    const name = match[2];
    return { owner, name };
  } else {
    console.error("Invalid GitHub repository link.");
    return null;
  }
}

export function getModuleNameFromNpmLink(link: string): string | null {
  // Define a regular expression to match npmjs.com URLs and capture the module name
  const npmRegex = /^https?:\/\/(?:www\.)?npmjs\.com\/package\/([^\/]+)/;

  // Match the URL against the regular expression
  const match = link.match(npmRegex);

  // Return the captured module name if found, otherwise return null
  return match ? match[1] : null;
}


/**
 * Logs a message to the log file.
 * 
 * @param level - The log level of the message.
 * @param message - The message to be logged.
 * @returns void
 */
export function logMessage(level: string, message: string) {
  const logEntry = `${new Date().toISOString()} [${level}] - ${message}\n`;
  fs.appendFileSync(logFile, logEntry, { flag: 'a' });
}

/**
 * Clears the log file by removing all its contents.
 * 
 * @returns void
 */ 
export function clearLog() {
  // Check if the log file exists
  if (fs.existsSync(logFile)) {
    // Clear the contents of the log file by writing an empty string
    fs.writeFileSync(logFile, '', { flag: 'w' });
    console.log(`Log file "${logFile}" has been cleared.`);
  } else {
    console.log(`Log file "${logFile}" does not exist.`);
  }
}

