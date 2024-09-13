import { request, getLinkType, getRepoOwnerAndName, getModuleNameFromNpmLink} from "./utils.js";
import { gql } from 'graphql-request';

 /**
 * Fetches repository license using a GraphQL query.
 * @param owner - The owner of the repository.
 * @param name - The name of the repository.
 * @param token - The GitHub token used for authentication.
 * @returns The name of the license or null in case of an error.
 */
 async function getGitHubLicense(owner: string, name: string, token: string): Promise<string | null> {
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
  } else {  // log an error message if the license information could not be fetched
    console.log(`Could not fetch license information for ${owner}/${name}`);
    return null;
  }
}

/**
 * Fetches the license of an npm module using a GraphQL query.
 * 
 * @param moduleName - The name of the npm module.
 * @param token - The GitHub token used for authentication.
 * @returns A promise that resolves to the license of the npm module, or null if the license information is not found. }
**/
export async function getNpmModuleLicense(moduleName: string, token: string): Promise<string | null> {
  console.log('Fetching license for', moduleName);
  const endpoint = 'https://registry.npmjs.org/-/graphql';

  // GraphQL query to fetch the license for a module
  const query = gql`
    query getPackageInfo($name: String!) {
      package(name: $name) {
        license
      }
    }
  `;

  try {
    const variables = { name: moduleName };
    
    const data: { package?: { license?: string } } = await request(endpoint, query, variables, token || '') as { package?: { license?: string } };
    
    if (data?.package?.license) {
      return data.package.license;
    } else {
      console.log(`License information for ${moduleName} not found.`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching license for ${moduleName}: ${error}`);
    return null;
  }
}

/**
 * Checks if a given license is compatible with LGPLv2.1.
 * 
 * @param license - The license to check compatibility for.
 * @returns A number indicating the compatibility of the license. Returns 1 if the license is compatible, and 0 if it is not.
 */
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

/**
 * Retrieves the license score for a given repository.
 * 
 * @param owner - The owner of the repository.
 * @param name - The name of the repository.
 * @param token - The GitHub token used for authentication.
 * @returns A promise that resolves to the license score of the repository.
 */
export async function getLicenseScore(url: string): Promise<number> {
  // Get the type of the link
  const linkType = getLinkType(url);

  // Get the license of the repository
  let license: string | null = null;
  if (linkType === 'GitHub') {
    // Extract the owner and name of the repository
    const { owner, name } = getRepoOwnerAndName(url) ?? { owner: '', name: '' };
    // Get the license of the repository
    license = await getGitHubLicense(owner, name, process.env.GITHUB_TOKEN || '');
  } else if (linkType === 'npm') {
    // Extract the module name from the npm link
    const moduleName = getModuleNameFromNpmLink(url) ?? '';
    // Get the license of the npm module
    license = await getNpmModuleLicense(moduleName, process.env.NPM_TOKEN || '');
  }
  else {
    console.error("Invalid link type.");
    return 0;
  }
  if (license !== null) {
    const score = isLicenseCompatible(license);
    return score;
  }
  return 0;
}