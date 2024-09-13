import { GraphQLClient } from "graphql-request";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

// GraphQL endpoint
const endpoint = "https://api.github.com/graphql";


// getRepoInfo.ts
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
  
  /**
 * Fetches repository data using a GraphQL query and a dynamic GitHub token.
 * @param query - The GraphQL query to fetch the data.
 * @param variables - The variables required for the GraphQL query.
 * @param token - The GitHub token used for authentication.
 * @returns The fetched data or null in case of an error.
 */
export async function fetchRepoData(
  query: string,
  variables: { owner: string; name: string },
  token: string
) {
  // Create GraphQL client instance with dynamic token
  const client = new GraphQLClient(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`, // Use the provided token instead of process.env.GITHUB_TOKEN
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