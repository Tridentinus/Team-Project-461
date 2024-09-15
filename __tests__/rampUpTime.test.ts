// import { describe, it, expect, vi, afterEach } from 'vitest';
// import { calculateRampUpScore } from '../src/rampUpTime';
// import * as simpleGitModule from 'simple-git';
// import * as graphqlRequestModule from 'graphql-request';
// import * as fs from 'fs';

// // Mock external dependencies
// vi.mock('graphql-request');
// vi.mock('simple-git');
// vi.mock('fs');

// describe('calculateRampUpScore', () => {
//   afterEach(() => {
//     // Restore mocks after each test
//     vi.restoreAllMocks();
//   });

//   it('should calculate ramp-up score with valid data', async () => {
//     // Mock GraphQL request for README
//     vi.spyOn(graphqlRequestModule, 'request').mockResolvedValue({
//       repository: {
//         object: {
//           text: '## Installation\n## Usage\n## API\n## Examples'
//         }
//       }
//     });

//     // Mock simple-git clone
//     const cloneMock = vi.fn().mockResolvedValue(true);
//     vi.spyOn(simpleGitModule, 'simpleGit').mockReturnValue({
//       clone: cloneMock
//     } as unknown as simpleGitModule.SimpleGit);

//     // Mock dependencies in package.json
//     vi.spyOn(fs, 'existsSync').mockReturnValue(true); // Check if package.json exists
//     vi.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({ dependencies: { react: "^17.0.0" } }));

//     const repoUrl = 'https://github.com/facebook/react';
//     const repoPath = '/path/to/repo';
//     const result = await calculateRampUpScore('facebok', 'react', repoPath);

//     expect(result.documentationScore).toBe(1);
//     expect(result.dependenciesScore).toBe(0); 
//   });

//   it('should return 0 for missing README file', async () => {
//     // Mock GraphQL request for missing README
//     vi.spyOn(graphqlRequestModule, 'request').mockResolvedValue({
//       repository: {
//         object: null // No README found
//       }
//     });

//     const repoUrl = 'https://github.com/facebook/react';
//     const repoPath = '/path/to/repo';
//     const result = await calculateRampUpScore('facebook', 'react', repoPath);

//     expect(result.documentationScore).toBe(0);
//   });

//   it('should return 0 for too many dependencies', async () => {
//     // Mock GraphQL request for README
//     vi.spyOn(graphqlRequestModule, 'request').mockResolvedValue({
//       repository: {
//         object: {
//           text: '## Installation\n## Usage\n## API\n## Examples'
//         }
//       }
//     });

//     // Mock simple-git clone
//     const cloneMock = vi.fn().mockResolvedValue(true);
//     vi.spyOn(simpleGitModule, 'simpleGit').mockReturnValue({
//       clone: cloneMock
//     } as unknown as simpleGitModule.SimpleGit);

//     // Mock too many dependencies in package.json
//     vi.spyOn(fs, 'existsSync').mockReturnValue(true);
//     vi.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({
//       dependencies: {
//         react: "^17.0.0",
//         vue: "^3.0.0",
//         angular: "^10.0.0",
//         lodash: "^4.17.0"
//       }
//     }));

//     const repoUrl = 'https://github.com/facebook/react';
//     const repoPath = '/path/to/repo';
//     const result = await calculateRampUpScore('facebook', 'react', repoPath);

//     expect(result.dependenciesScore).toBeLessThan(1); // Too many dependencies
//   });
// });

import { describe, it, expect, vi, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { getDocumentationScore } from '../src/rampUpTime.ts'; // Adjust the import path
import { gitHubRequest } from '../src/utils.ts'; // Adjust the import path
import * as utils from '../src/utils';

// Mock the `gitHubRequest` and `JSDOM` dependencies
vi.mock('./path-to-utils', () => ({
    gitHubRequest: vi.fn(),
}));

// Mock `JSDOM` properly
vi.mock('jsdom', () => ({
    JSDOM: vi.fn().mockImplementation((html: string) => ({
        window: {
            document: {
                body: {
                    textContent: html
                }
            }
        }
    })),
}));

describe('getDocumentationScore', () => {
    afterEach(() => {
        // Restore all mocks after each test
        vi.restoreAllMocks();
    });
    it('should return a score based on README content', async () => {
        const repoOwner = 'exampleOwner';
        const repoName = 'exampleRepo';

        vi.spyOn(utils, 'gitHubRequest').mockResolvedValue({
          repository: {
            object: {
                text: `
                    # Project
                    ## Installation
                    Instructions for installation.
                    ## Usage
                    How to use the project.
                    ## API
                    API documentation.
                    ## Examples
                    Code examples.
                `
            }
        }
        });

        // Mock `JSDOM` to simulate parsing of README content
        const mockJSDOM = new JSDOM(`
            <body>
                <h1>Project</h1>
                <h2>Installation</h2>
                <p>Instructions for installation.</p>
                <h2>Usage</h2>
                <p>How to use the project.</p>
                <h2>API</h2>
                <p>API documentation.</p>
                <h2>Examples</h2>
                <p>Code examples.</p>
            </body>
        `);
        vi.mocked(JSDOM).mockImplementation(() => mockJSDOM);

        // Call the function and check the result
        const score = await getDocumentationScore(repoOwner, repoName);
        expect(score).toBe(1); // All keywords are present, so the score should be 1
    });

    it('should return 0 if README does not contain any keywords', async () => {
        const repoOwner = 'exampleOwner';
        const repoName = 'exampleRepo';

        vi.spyOn(utils, 'gitHubRequest').mockResolvedValue({
          repository: {
            object: {
                text: 'This README does not contain the specified keywords.'
            }
        }
        });

        // Mock `JSDOM` to simulate parsing of README content
        const mockJSDOM = new JSDOM('<body>This README does not contain the specified keywords.</body>');
        vi.mocked(JSDOM).mockImplementation(() => mockJSDOM);

        // Call the function and check the result
        const score = await getDocumentationScore(repoOwner, repoName);
        expect(score).toBe(0);
    });

    it('should return 0 if there is an error fetching README', async () => {
        const repoOwner = 'exampleOwner';
        const repoName = 'exampleRepo';

        vi.spyOn(utils, 'gitHubRequest').mockRejectedValue(new Error('Network Error'));

        // Call the function and check the result
        const score = await getDocumentationScore(repoOwner, repoName);
        expect(score).toBe(0);
    });
});
