import { gql } from 'graphql-request';
import { JSDOM } from 'jsdom';
import { gitHubRequest } from './utils.js';

const KEYWORDS = ["installation", "usage", "api", "examples"];
const SCORE_THRESHOLD = 0; // Default score when no documentation is found

interface RampUpScore {
    documentationScore: number;
    dependenciesScore: number;
}

interface ReadmeResponse {
    repository: {
        object: {
            text: string;
        }
    }
}

// Helper function to calculate the documentation score
function calculateScore(text: string): number {
    const lowerCaseText = text.toLowerCase();
    const keywordCount = KEYWORDS.reduce((count, keyword) => 
        count + (lowerCaseText.includes(keyword) ? 1 : 0), 0
    );
    return KEYWORDS.length > 0 ? keywordCount / KEYWORDS.length : SCORE_THRESHOLD;
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
        const data = await gitHubRequest(query, { repoOwner, repoName }) as ReadmeResponse;
        console.log(data);
        const readmeContent = data.repository.object.text || '';
        console.log(readmeContent);
        const dom = new JSDOM(readmeContent);
        console.log(dom);
        const text = dom.window.document.body.textContent || '';
        return calculateScore(text);
    } catch (err) {
        console.error('Error fetching README:', err);
        return SCORE_THRESHOLD; // No documentation found
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


// Main function to calculate the overall Ramp-Up Time Score
export async function calculateRampUpScore(owner: string, name: string, repoPath: string): Promise<RampUpScore> {

    const documentationScore = await getDocumentationScore(owner, name);
    const dependenciesScore = await getDependenciesScore(repoPath);

    return {
        documentationScore,
        dependenciesScore
    };
}
