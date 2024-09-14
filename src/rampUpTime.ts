import { request, gql } from 'graphql-request';
import { simpleGit, SimpleGit } from 'simple-git'; 
import { JSDOM } from 'jsdom';

interface RampUpScore {
    documentationScore: number;
    dependenciesScore: number;
}

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || 'your-github-token';
const GITHUB_API_URL = 'https://api.github.com/graphql';

// GraphQL client setup
const client = async (query: string, variables = {}) => {
    return request(GITHUB_API_URL, query, variables, {
        Authorization: `Bearer ${GITHUB_TOKEN}`
    });
};

interface ReadmeResponse {
    repository: {
        object: {
            text: string;
        }
    }
}

// 1. Analyze Documentation (presence of README.md, tutorials, etc.)
export async function getDocumentationScore(repoOwner: string, repoName: string): Promise<number> {
    const query = gql`
        query GetReadme($repoOwner: String!, $repoName: String!) {
            repository(owner: $repoOwner, name: $repoName) {
                object(expression: "HEAD:README.md") {
                    ... on Blob {
                        text
                    }
                }
            }
        }
    `;
    try {
        const data = await client(query, { repoOwner, repoName }) as ReadmeResponse;
        const readmeContent = data.repository.object.text || '';
        const dom = new JSDOM(readmeContent);
        const text = dom.window.document.body.textContent || '';
        const keywords = ["installation", "usage", "api", "examples"];
        const score = keywords.reduce((acc, keyword) => acc + (text.toLowerCase().includes(keyword) ? 1 : 0), 0) / keywords.length;
        return score;
    } catch (err) {
        console.error('Error fetching README:', err);
        return 0; // No documentation found
    }
}

// 2. Analyze Dependencies (fewer dependencies == better)
export async function getDependenciesScore(repoPath: string): Promise<number> {
    try {
        const packageJson = require(`${repoPath}/package.json`);
        const dependenciesCount = Object.keys(packageJson.dependencies || {}).length;
        return dependenciesCount < 10 ? 1 : (10 / dependenciesCount); // Fewer dependencies = higher score
    } catch (err) {
        console.error('Error reading package.json:', err);
        return 0;
    }
}

// Utility function to extract owner and name from the repository URL
function extractRepoOwnerAndName(repoUrl: string): { repoOwner: string, repoName: string } {
    const urlParts = repoUrl.split('/');
    return {
        repoOwner: urlParts[urlParts.length - 2],
        repoName: urlParts[urlParts.length - 1]
    };
}

// Main function to calculate the overall Ramp-Up Time Score
export async function calculateRampUpScore(repoUrl: string, repoPath: string): Promise<RampUpScore> {
    const { repoOwner, repoName } = extractRepoOwnerAndName(repoUrl);

    const documentationScore = await getDocumentationScore(repoOwner, repoName);
    const dependenciesScore = await getDependenciesScore(repoPath);

    return {
        documentationScore,
        dependenciesScore
    };
}

// // Example Usage
// (async () => {
//     const repoUrl = 'https://github.com/someuser/somerepo';
//     const repoPath = '/path/to/repo';
//     const rampUpScore = await calculateRampUpScore(repoUrl, repoPath);
//     console.log('Ramp-Up Score:', rampUpScore);
// })();
