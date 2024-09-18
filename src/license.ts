import { log } from "console";
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

// Software licenses that are compatible with a project licensed under LGPL-2.1
const compatibleLicenses = [
  '0BSD', // OK: Permissive license with no restrictions on use, distribution, or modification; effectively public domain
  'AFL-3.0',  // OK: Requires inclusion of a copy of the license; allows use, modification, and distribution with minimal restrictions
  'Apache-2.0',  // OK: Requires inclusion of the license and a NOTICE file; provides an explicit grant of patent rights and has a strong copyleft
  'Artistic-2.0', // OK: Allows use, modification, and distribution with attribution; requires including a license copy and provides flexibility
  'BSL-1.0',  // OK: Requires inclusion of the license and disclaimer; permits use and modification under certain conditions with limited restrictions
  'BSD-2-Clause', // OK: Permissive license requiring inclusion of the copyright notice, list of conditions, and disclaimer; allows broad usage
  'BSD-3-Clause',  // OK: Permissive license requiring inclusion of the copyright notice, list of conditions, and disclaimer; prevents use of names for endorsement or promotion
  'BSD-3-Clause-Clear',  // OK: Permissive license requiring inclusion of the license and disclaimer; removes the advertising clause found in earlier BSD licenses
  'BSD-4-Clause',  // OK: Permissive license including an advertising clause; requires inclusion of the copyright notice and disclaimer, allowing broad usage
  'ECL-2.0',  // OK: Educational Community License v2.0; requires inclusion of the license text; offers compatibility with other licenses
  'EUPL-1.1',  // OK: European Union Public License v1.1; requires inclusion of the license text; offers a broad compatibility with other licenses
  'ISC',   // OK: Permissive and simple license; requires inclusion of copyright notice and license text; allows broad usage and modification
  'LGPL-2.1', // OK: Allows linking with LGPL-2.1 code; modifications to LGPL-2.1 code must be released under LGPL-2.1; suitable for libraries
  'LGPL-3.0', // OK: Similar to LGPL-2.1 but includes additional terms for better compatibility with other licenses; requires release of modifications under LGPL-3.0
  'LPPL-1.3c', // OK: LaTeX Project Public License v1.3c; requires inclusion of license text and attribution; allows modification and distribution with conditions
  'MPL-2.0',  // OK: Mozilla Public License 2.0; requires inclusion of license information; allows modification and distribution with certain conditions
  'MIT', // OK: Widely used permissive license; requires inclusion of the license and copyright notice; allows broad usage and modification
  'MS-PL', // OK: Microsoft Public License; requires inclusion of license text; allows use, modification, and distribution with limited restrictions
  'NCSA',  // OK: University of Illinois/NCSA Open Source License; requires inclusion of the license; allows use, modification, and distribution with minimal restrictions
  'OFL-1.1',  // OK: SIL Open Font License 1.1; requires inclusion of font name, author, and license; allows use and modification of fonts with attribution
  'PostgreSQL',  // OK: PostgreSQL License; permissive and simple; requires inclusion of the license; allows broad use, modification, and distribution
  'Zlib', // OK: Permissive license; requires that the notice not be removed or altered; allows use, modification, and distribution with minimal restrictions
  'WTFPL',  // OK: Do What The F*ck You Want To Public License; allows unrestricted use, modification, and distribution with no conditions
  'CC0-1.0',  // OK: Creative Commons Zero v1.0; effectively places work in the public domain; allows unrestricted use, modification, and distribution
  'CC-BY-4.0'  // OK: Creative Commons Attribution 4.0; requires giving appropriate credit to the original author; allows use, modification, and distribution with attribution
];


/**
 * Fetches repository license using GraphQL and cross-references with README and LICENSE file.
 * @param owner - The owner of the repository.
 * @param name - The name of the repository.
 * @returns 1 if the license is compatible with LGPLv2.1, otherwise 0.
 */
export async function isLicenseCompatible(owner: string, name: string): Promise<number> {
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

  try {
    const variables = { owner, name };
    const data: LicenseResponse = await gitHubRequest(query, variables) as LicenseResponse;

    // Extract SPDX ID from the GraphQL response
    const spdxId = data.repository.licenseInfo?.spdxId;
    if (spdxId) {
      logMessage('DEBUG', `SPDX ID found: ${spdxId}`);
    }

    // Fallback to checking LICENSE and README files
    const licenseText = data.repository.licenseFile?.text || data.repository.readme?.text || '';
    const extractedLicense = extractLicenseFromText(licenseText);
    if (extractedLicense) {
      logMessage('INFO', `Extracted license from file: ${extractedLicense}`);
      return compatibleLicenses.includes(extractedLicense) ? 1 : 0;
    }

    return 0; // If no license is found or compatible
  } catch (error: any) {
    logMessage('ERROR', `Failed to fetch license: ${error.message}`);
    return 0; // Return not compatible on error
  }
}

/**
 * Extracts SPDX license identifier from provided text using common patterns.
 * @param text - The text content of README or LICENSE file.
 * @returns SPDX license ID or null if not found.
 */
export function extractLicenseFromText(text: string | null): string | null {
  if (!text) {
    return null;
  }
  const licenseMappings = {
    'Academic Free License v3.0': 'AFL-3.0',
    'Apache license 2.0': 'Apache-2.0',
    'Artistic license 2.0': 'Artistic-2.0',
    'Boost Software License 1.0': 'BSL-1.0',
    'BSD 2-clause "Simplified" license': 'BSD-2-Clause',
    'BSD 3-clause "New" or "Revised" license': 'BSD-3-Clause',
    'BSD 3-clause Clear license': 'BSD-3-Clause-Clear',
    'BSD 4-clause "Original" or "Old" license': 'BSD-4-Clause',
    'BSD Zero-Clause license': '0BSD',
    'Creative Commons Zero v1.0 Universal': 'CC0-1.0',
    'Creative Commons Attribution 4.0': 'CC-BY-4.0',
    'Creative Commons Attribution ShareAlike 4.0': 'CC-BY-SA-4.0',
    'Educational Community License v2.0': 'ECL-2.0',
    'Eclipse Public License 1.0': 'EPL-1.0',
    'Eclipse Public License 2.0': 'EPL-2.0',
    'European Union Public License 1.1': 'EUPL-1.1',
    'GNU Affero General Public License v3.0': 'AGPL-3.0',
    'GNU General Public License v2.0': 'GPL-2.0',
    'GNU General Public License v3.0': 'GPL-3.0',
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

  // Convert text to lowercase for case-insensitive matching
  const lowerText = text.toLowerCase();

  // Iterate over license mappings and match text using case-insensitive regex
  for (const [name, spdxId] of Object.entries(licenseMappings)) {
    // Create a case-insensitive regex pattern for each license name
    const pattern = new RegExp(name.toLowerCase(), 'i');
    if (pattern.test(lowerText)) {
      return spdxId;
    }
  }
  return null;
}