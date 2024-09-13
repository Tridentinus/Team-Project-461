import { GraphQLClient } from "graphql-request";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

// GraphQL endpoint
const endpoint = "https://api.github.com/graphql";


/**
 * Fetches repository data using a GraphQL query and a dynamic GitHub token.
 * @param query - The GraphQL query to fetch the data.
 * @param variables - The variables required for the GraphQL query.
 * @param token - The GitHub token used for authentication.
 * @returns The fetched data or null in case of an error.
 */
async function fetchRepoData(
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


 /**
 * Fetches repository license using a GraphQL query.
 * @param owner - The owner of the repository.
 * @param name - The name of the repository.
 * @param token - The GitHub token used for authentication.
 * @returns The name of the license or null in case of an error.
 */
async function getRepoLicense(owner: string, name: string, token: string): Promise<string | null> {
  const query = `
    query($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        licenseInfo {
          name
          spdxId

        }
      }
    }
  `;

  const variables = { owner, name };
  const data: { repository?: { licenseInfo?: { name: string, spdxId: string } } } =
      (await fetchRepoData(query, variables, token)) as {
        repository?: { licenseInfo?: { name: string, spdxId: string } };
      };

  if (data && data.repository && data.repository.licenseInfo) {
    console.log(
      `License for ${owner}/${name}: ${data.repository.licenseInfo.spdxId}`
    );
    return data.repository.licenseInfo.spdxId;
  } else {
    console.log(`Could not fetch license information for ${owner}/${name}`);
    return null;
  }
}

function isLicenseCompatible(license: string): number {
  // List of licenses compatible with LGPLv2.1
  const compatibleLicenses = [
    "LGPLv2.1",
    "GPL-2.0",
    "MIT",
    "BSD-2-Clause",
    "BSD-3-Clause",
    "Apache-2.0",
    "CC0-1.0",
    "ISC",
    "Zlib",
    "Unlicense"
  ];

  // Check if the provided license is in the list of compatible licenses
  if (compatibleLicenses.includes(license)) {
    return 1; // License is compatible
  }

  return 0; // License is not compatible
}

// Example: Fetch license for a repo
const owner = "magenta";
const name = "midi-ddsp";
const token = process.env.GITHUB_TOKEN || "";
const license = await getRepoLicense(owner, name, token);

if (license !== null) {
  const score = isLicenseCompatible(license);
  console.log(`License compatibility score: ${score}`);
}