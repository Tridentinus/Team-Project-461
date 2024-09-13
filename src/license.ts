import { fetchRepoData } from "./utils.js";


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


export async function getLicenseScore(owner: string, name: string, token: string): Promise<number> {
  const license = await getRepoLicense(owner, name, token);
  if (license !== null) {
    const score = isLicenseCompatible(license);
    return score;
  }
  return 0;
}