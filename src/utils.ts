import { GraphQLClient } from "graphql-request";
import { GITHUB_TOKEN, LOG_FILE } from "./config.js";
import * as fs from "fs";
import axios from "axios";

/**
 * Determines the type of a given link.
 *
 * @param link - The link to be evaluated.
 * @returns The type of the link. Possible values are "GitHub", "npm", or "Unknown".
 */
export function getLinkType(link: string): string {
  const githubRegex = /(?:git\+)?(?:https?:\/\/)?(?:www\.)?(?:git@)?github\.com[:\/]([^\/]+)\/([^\/]+?)(?:\.git)?\/?$/;
  const npmRegex = /(https?:\/\/)?(www\.)?npmjs\.com\/package\/([^\/]+)(?:\/.*)?/;

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
export function parseGitHubUrl(repoLink: string): { owner: string; repo: string } | null {
  // Regex to handle various GitHub URL formats
  const regex = /(?:git\+)?(?:https?:\/\/)?(?:www\.)?(?:git@)?github\.com[:\/]([^\/]+)\/([^\/]+?)(?:\.git)?\/?$/;
  const match = repoLink.match(regex);

  // Check if the regex matched and extract owner and repo
  if (match && match[1] && match[2]) {
    const owner = match[1]; // The owner is captured in group 1
    const repo = match[2];  // The repository is captured in group 2
    return { owner, repo };
  } else {
    logMessage("ERROR", "Invalid GitHub repository link.");
    return null;
  }
}

/**
 * Extracts the module name from a given npm link.
 *
 * @param link - The link to the npm package.
 * @returns The module name extracted from the link, or null if the link is invalid.
 */
export function parseNpmUrl(link: string): string | null {
  // Flexible regex to capture the package name from npm URLs
  const npmRegex = /^(https?:\/\/)?(www\.)?npmjs\.com\/package\/([^\/]+)/;

  // Match the URL against the regular expression
  const match = link.match(npmRegex);

  // Return the captured package name if found, otherwise return null
  if (match && match[3]) {
    return match[3]; // match[3] is the package name captured by the third group
  } else {
    logMessage("ERROR", "Invalid npm package link.");
    return null;
  }
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
    logMessage("INFO", "Log file has been cleared.");
  } else {
    logMessage("ERROR", "Log file does not exist.");
  }
}

export function getUrlsFromFile(filePath: string): string[] {
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
  variables: TVariables
) {
  const endpoint = "https://api.github.com/graphql";

  // Create GraphQL client instance with dynamic token
  const client = new GraphQLClient(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GITHUB_TOKEN}`,
    },
  });

  try {
    const data = await client.request(query, variables);
    return data; // Return the fetched data
  } catch (error) {
    logMessage("ERROR", `GitHub request error: ${(error as Error).message}`);
    return null; // Return null in case of error
  }
}

/**
* Fetches the GitHub repository owner and repo name for a given npm package. 
* @param packageName - The name of the npm package.
* @returns A promise that resolves to an object containing the owner and name of the GitHub repository, or null if the package does not have a GitHub repository or an error occurs.
*/
export async function npmToGitHub(packageName: string): Promise<{owner: string, repo: string} | null> {

  try {
    logMessage("INFO", `Fetching metadata for npm package: ${packageName}`);
    const response = await axios.get(`https://registry.npmjs.org/${packageName}`);

    const repoUrl = response.data.repository?.url;
    if (!repoUrl) {
      logMessage("ERROR", `No repository information found for the npm package: ${packageName}`);
      return null;
    }
    if (getLinkType(repoUrl) === "GitHub") {
      const repoInfo = parseGitHubUrl(repoUrl) || { owner: "", repo: "" };
      logMessage(
        "INFO", `Found GitHub repository: ${repoInfo.owner}, ${repoInfo.repo}`
      );
      return repoInfo;
    }
  } catch (error) {
    const errorMessage = `Error fetching package data from npm API for package: ${packageName}. Error: ${
      (error as Error).message
    }`;
    logMessage("ERROR", errorMessage);
  }
  return null;
}
