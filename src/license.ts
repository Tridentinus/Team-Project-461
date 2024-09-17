import { gitHubRequest, logMessage } from "./utils.js";
import { gql } from 'graphql-request';

// Define the structure of the license response based on the GraphQL query
interface LicenseResponse {
  repository: {
    licenseInfo: {
      spdxId: string;
    };
    readme: {
      text: string;
    };
    licenseFile: {
      text: string;
    };
  };
}


/**
 * Fetches repository license using a GraphQL query and cross-references it with the README and LICENSE file.
 * @param owner - The owner of the repository.
 * @param name - The name of the repository.
 * @returns The SPDX ID of the license or null in case of an error.
 */
export async function getGitHubLicense(owner: string, name: string): Promise<string | null> {
  // Specify the GraphQL query to fetch the license information, README content, and LICENSE file content
  const query = gql`
  query($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      licenseInfo {
        spdxId
      }
      readme: object(expression: "HEAD:README.md") {
        ... on Blob {
          text
        }
      }
      licenseFile: object(expression: "HEAD:LICENSE") {
        ... on Blob {
          text
        }
      }
    }
  }
`;

  const variables = { owner, name };
  const data: LicenseResponse = await gitHubRequest(query, variables) as LicenseResponse;

  let spdxId = null;
  let readmeContent = null;
  let licenseContent = null;
  if (data && data.repository) {
    spdxId = data.repository.licenseInfo?.spdxId || null;
    readmeContent = data.repository.readme?.text || null;
    licenseContent = data.repository.licenseFile?.text || null;
  }

  // Extract license names from the README and LICENSE files
  const readmeLicense = extractLicenseFromText(readmeContent);
  const fileLicense = extractLicenseFromText(licenseContent);

  // License names to SPDX IDs
  const licenseMappings: { [key: string]: string } = {
      'Academic Free License v3.0': 'AFL-3.0',
      'Apache license 2.0': 'Apache-2.0',
      'Artistic license 2.0': 'Artistic-2.0',
      'Boost Software License 1.0': 'BSL-1.0',
      'BSD 2-clause "Simplified" license': 'BSD-2-Clause',
      'BSD 3-clause "New" or "Revised" license': 'BSD-3-Clause',
      'BSD 3-clause Clear license': 'BSD-3-Clause-Clear',
      'BSD 4-clause "Original" or "Old" license': 'BSD-4-Clause',
      'BSD Zero-Clause license': '0BSD',
      'Creative Commons license family': 'CC',
      'Creative Commons Zero v1.0 Universal': 'CC0-1.0',
      'Creative Commons Attribution 4.0': 'CC-BY-4.0',
      'Creative Commons Attribution ShareAlike 4.0': 'CC-BY-SA-4.0',
      'Do What The F*ck You Want To Public License': 'WTFPL',
      'Educational Community License v2.0': 'ECL-2.0',
      'Eclipse Public License 1.0': 'EPL-1.0',
      'Eclipse Public License 2.0': 'EPL-2.0',
      'European Union Public License 1.1': 'EUPL-1.1',
      'GNU Affero General Public License v3.0': 'AGPL-3.0',
      'GNU General Public License family': 'GPL',
      'GNU General Public License v2.0': 'GPL-2.0',
      'GNU General Public License v3.0': 'GPL-3.0',
      'GNU Lesser General Public License family': 'LGPL',
      'GNU Lesser General Public License v2.1': 'LGPL-2.1',
      'GNU Lesser General Public License v3.0': 'LGPL-3.0',
      'ISC License': 'ISC',
      'LaTeX Project Public License v1.3c': 'LPPL-1.3c',
      'Microsoft Public License': 'MS-PL',
      'MIT License': 'MIT',
      'Mozilla Public License 2.0': 'MPL-2.0',
      'Open Software License 3.0': 'OSL-3.0',
      'PostgreSQL License': 'PostgreSQL',
      'SIL Open Font License 1.1': 'OFL-1.1',
      'University of Illinois/NCSA Open Source License': 'NCSA',
      'The Unlicense': 'Unlicense',
      'zLib License': 'Zlib'
  };

  // Log the SPDX ID if available, useful for debugging
  if (spdxId) {
    logMessage('INFO', `Retrieved spdxId: ${spdxId}`);
  }

  if (fileLicense && licenseMappings[fileLicense]) {
    logMessage('INFO', `Retrieved from LICENSE: ${licenseMappings[fileLicense]}`);
    return licenseMappings[fileLicense];
  }

  if (readmeLicense && licenseMappings[readmeLicense]) {
    logMessage('INFO', `Retrieved from README: ${licenseMappings[readmeLicense]}`);
    return licenseMappings[readmeLicense];
  }

  return null;
}

/**
 * Extracts license information from the provided text.
 * @param text - The text content of the README or LICENSE file.
 * @returns The name of the license or null if not found.
 */
export function extractLicenseFromText(text: string | null): string | null {
  if (!text) return null;

  // Regex patterns to identify common licenses
  const patterns = [
    // Academic Free License v3.0
    /Academic Free License v3.0/i, // AFL-3.0
  
    // Apache license 2.0
    /Apache license 2.0/i,         // Apache-2.0
  
    // Artistic license 2.0
    /Artistic license 2.0/i,       // Artistic-2.0
  
    // Boost Software License 1.0
    /Boost Software License 1.0/i, // BSL-1.0
  
    // BSD 2-clause "Simplified" license
    /BSD 2-clause "Simplified" license/i, // BSD-2-Clause
  
    // BSD 3-clause "New" or "Revised" license
    /BSD 3-clause "New" or "Revised" license/i, // BSD-3-Clause
  
    // BSD 3-clause Clear license
    /BSD 3-clause Clear license/i, // BSD-3-Clause-Clear
  
    // BSD 4-clause "Original" or "Old" license
    /BSD 4-clause "Original" or "Old" license/i, // BSD-4-Clause
  
    // BSD Zero-Clause license
    /BSD Zero-Clause license/i,    // 0BSD
  
    // Creative Commons license family
    /Creative Commons license family/i, // CC
  
    // Creative Commons Zero v1.0 Universal
    /Creative Commons Zero v1.0 Universal/i, // CC0-1.0
  
    // Creative Commons Attribution 4.0
    /Creative Commons Attribution 4.0/i, // CC-BY-4.0
  
    // Creative Commons Attribution ShareAlike 4.0
    /Creative Commons Attribution ShareAlike 4.0/i, // CC-BY-SA-4.0
  
    // Do What The F*ck You Want To Public License
    /Do What The F\*ck You Want To Public License/i, // WTFPL
  
    // Educational Community License v2.0
    /Educational Community License v2.0/i, // ECL-2.0
  
    // Eclipse Public License 1.0
    /Eclipse Public License 1.0/i, // EPL-1.0
  
    // Eclipse Public License 2.0
    /Eclipse Public License 2.0/i, // EPL-2.0
  
    // European Union Public License 1.1
    /European Union Public License 1.1/i, // EUPL-1.1
  
    // GNU Affero General Public License v3.0
    /GNU Affero General Public License v3.0/i, // AGPL-3.0
  
    // GNU General Public License v2.0
    /GNU General Public License v2.0/i, // GPL-2.0
  
    // GNU General Public License v3.0
    /GNU General Public License v3.0/i, // GPL-3.0
  
    // GNU Lesser General Public License v2.1
    /GNU Lesser General Public License v2.1/i, // LGPL-2.1
  
    // GNU Lesser General Public License v3.0
    /GNU Lesser General Public License v3.0/i, // LGPL-3.0
  
    // ISC
    /ISC License/i, // ISC
  
    // LaTeX Project Public License v1.3c
    /LaTeX Project Public License v1.3c/i, // LPPL-1.3c
  
    // Microsoft Public License
    /Microsoft Public License/i, // MS-PL
  
    // MIT
    /MIT License/i, // MIT
  
    // Mozilla Public License 2.0
    /Mozilla Public License 2.0/i, // MPL-2.0
  
    // Open Software License 3.0
    /Open Software License 3.0/i, // OSL-3.0
  
    // PostgreSQL License
    /PostgreSQL License/i, // PostgreSQL
  
    // SIL Open Font License 1.1
    /SIL Open Font License 1.1/i, // OFL-1.1
  
    // University of Illinois/NCSA Open Source License
    /University of Illinois\/NCSA Open Source License/i, // NCSA
  
    // The Unlicense
    /The Unlicense/i, // Unlicense
  
    // zLib License
    /zLib License/i // Zlib
  ];
  

  for (const pattern of patterns) {
    if (pattern.test(text)) {
      const matchResult = pattern.toString().match(/\/(.*?)\//);
      if (matchResult) {
        return matchResult[1];
      }
    }
  }

  return null;
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
  logMessage('INFO', `Checking compatibility for license: ${license}`);
  // List of licenses compatible with LGPLv2.1
  const compatibleLicenses = [
    "LGPLv2.1",
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
      logMessage('ERROR', 'No license information found');
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
      logMessage('ERROR', 'No license information found');
      return 0;
    }

    return isLicenseCompatible(license);
}