import { gitHubRequest } from "./utils.js";

 /**
 * Fetches repository license using a GraphQL query.
 * @param owner - The owner of the repository.
 * @param name - The name of the repository.
 * @returns The name of the license or null in case of an error.
 */
 export async function getGitHubLicense(owner: string, name: string): Promise<string | null> {
  // specify the GraphQL query to fetch the license information
  const query = `
    query($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        licenseInfo {
          spdxId
        }
      }
    }
  `;

  const variables = { owner, name };  // variables required for the query
  const data: { repository?: { licenseInfo?: { spdxId: string } } } =
      (await gitHubRequest(query, variables)) as {
        repository?: { licenseInfo?: { spdxId: string } };
      };  // fetch the data using the query

  // extract the license information from the fetched data
  if (data && data.repository && data.repository.licenseInfo) {
    return data.repository.licenseInfo.spdxId;
  }
  else {
    return null;
  }
}

/**
 * Fetches the license of an npm module using a GraphQL query.
 * 
 * @param packageName - The name of the npm module.
 * @returns A promise that resolves to the license of the npm module}
**/
export async function getNpmLicense(packageName: string) {
  const response = await fetch(`https://registry.npmjs.org/${packageName}`);
  const data = await response.json();
  
  // Check if 'license' is an object (it could be a string)
  if (typeof data.license === 'string') {
    return data.license; // This will often be the SPDX ID
  } else if (data.license && data.license.type) {
    return data.license.type; // Return SPDX ID
  }

  return null;
}

/**
 * Checks if a given license is compatible with LGPLv2.1.
 * 
 * @param license - The license to check compatibility for.
 * @returns A number indicating the compatibility of the license. Returns 1 if the license is compatible, and 0 if it is not.
 */
export function isLicenseCompatible(license: string): number {
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

/**
 * Calculates the license score for a GitHub repository.
 * 
 * @param owner - The owner of the repository.
 * @param name - The name of the repository.
 * @returns A number indicating the license score of the repository.
 */
export async function getGitHubLicenseScore(owner: string, name: string): Promise<number> {
    const license = await getGitHubLicense(owner, name);
    if (license === null) {
      console.log('No license information found');
      return 0;
    }

    return isLicenseCompatible(license);
}

/**
 * Calculates the license score for an npm module.
 * 
 * @param name - The name of the npm module.
 * @returns A number indicating the license score of the module.
 */
export async function getNpmLicenseScore(name: string): Promise<number> {
    const license = await getNpmLicense(name);
    if (license === null) {
      console.log('No license information found');
      return 0;
    }

    return isLicenseCompatible(license);
}