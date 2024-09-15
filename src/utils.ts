import { GraphQLClient } from "graphql-request";
import { GITHUB_TOKEN, LOG_FILE } from './config.js';
import dotenv from "dotenv";
import * as fs from "fs";

dotenv.config(); // Load environment variables


/**
 * Determines the type of a given link.
 *
 * @param link - The link to be evaluated.
 * @returns The type of the link. Possible values are "GitHub", "npm", or "Unknown".
 */
export function getLinkType(link: string): string {
  const githubRegex = /^https?:\/\/(www\.)?github\.com\//;
  const npmRegex = /^https?:\/\/(www\.)?npmjs\.com\//;

  if (githubRegex.test(link)) {
    return "GitHub";
  } else if (npmRegex.test(link)) {
    return "npm";
  } else {
    return "Unknown";
  }
}


/**
 * Extracts the owner and name of a GitHub repository from a given repository link.
 * @param repoLink - The link to the GitHub repository.
 * @returns An object containing the owner and name of the repository, or null if the link is invalid.
 */
export function getRepoOwnerAndName(
  repoLink: string
): { owner: string; name: string } | null {
  const regex = /https:\/\/github\.com\/([^\/]+)\/([^\/]+)/;
  const match = repoLink.match(regex);

  if (match && match.length === 3) {
    const owner = match[1];
    const name = match[2];
    return { owner, name };
  } else {
    console.log("Invalid GitHub repository link.");
    return null;
  }
}

/**
 * Extracts the module name from a given npm link.
 *
 * @param link - The link to the npm package.
 * @returns The module name extracted from the link, or null if the link is invalid.
 */
export function getNpmName(link: string): string | null {
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
  fs.appendFileSync(LOG_FILE, logEntry, { flag: "a" });
}

/**
 * Clears the log file by removing all its contents.
 *
 * @returns void
 */
export function clearLog() {
  // Check if the log file exists
  if (fs.existsSync(LOG_FILE)) {
    // Clear the contents of the log file by writing an empty string
    fs.writeFileSync(LOG_FILE, "", { flag: "w" });
    console.log(`Log file "${LOG_FILE}" has been cleared.`);
  } else {
    console.log(`Log file "${LOG_FILE}" does not exist.`);
  }
}

export function getLinksFromFile(filePath: string): string[] {
  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Read the file content
  const fileContent = fs.readFileSync(filePath, "utf-8");

  // Split the content by newlines, trim each line, and filter out any empty lines
  const linksArray: string[] = fileContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return linksArray;
}

/**
 * Fetches repository data using a GraphQL query and a dynamic GitHub token.
 * @param query - The GraphQL query to fetch the data.
 * @param variables - The variables required for the GraphQL query.
 * @returns The fetched data or null in case of an error.
 */
export async function gitHubRequest<TVariables extends object | undefined>(
  query: string,
  variables: TVariables,
) {
  const endpoint = "https://api.github.com/graphql";

  // Create GraphQL client instance with dynamic token
  const client = new GraphQLClient(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GITHUB_TOKEN}`, // Use the provided token instead of process.env.GITHUB_TOKEN
    },
  });

  try {
    const data = await client.request(query, variables);
    return data; // Return the fetched data
  } catch (error) {
    console.log("GitHub request error:", error);
    return null; // Return null in case of error
  }
}