import { request, getLinkType, getRepoOwnerAndName, getModuleNameFromNpmLink} from "./utils.js";

 /**
 * Fetches repository license using a GraphQL query.
 * @param owner - The owner of the repository.
 * @param name - The name of the repository.
 * @param token - The GitHub token used for authentication.
 * @returns The name of the license or null in case of an error.
 */
 export async function getGitHubLicense(owner: string, name: string, token: string): Promise<string | null> {
  const endpoint = "https://api.github.com/graphql"
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
      (await request(endpoint, query, variables, token)) as {
        repository?: { licenseInfo?: { spdxId: string } };
      };  // fetch the data using the query
  // extract the license information from the fetched data

  if (data && data.repository && data.repository.licenseInfo) {
    return data.repository.licenseInfo.spdxId;
  }
  else {  // log an error message if the license information could not be fetched
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

  return 'No license information found';
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
 * Retrieves the license score for a given repository or npm module.
 * 
 * @param url - The URL of the repository or npm module.
 * @returns A promise that resolves to the license score.
 */
export async function getLicenseScore(url: string): Promise<number> {
  const linkType = getLinkType(url);
  let license: string | null = null;

  try {
    if (linkType === 'GitHub') {
      const { owner, name } = getRepoOwnerAndName(url) ?? {};
      if (!owner || !name) {
        throw new Error('Invalid GitHub repository URL.');
      }
      license = await getGitHubLicense(owner, name, process.env.GITHUB_TOKEN || '');
    } else if (linkType === 'npm') {
      const moduleName = getModuleNameFromNpmLink(url);
      if (!moduleName) {
        throw new Error('Invalid npm module URL.');
      }
      license = await getNpmLicense(moduleName);
    } else {
      return 0;
    }

    if (license) {
      return isLicenseCompatible(license);
    }
    return 0;
  } catch (error) {
    return 0;
  }
}
