import { GraphQLClient } from 'graphql-request';
import { logMessage } from './utils.js';
import * as dotenv from 'dotenv';
import { differenceInMinutes, parseISO } from 'date-fns';
import { GITHUB_TOKEN } from './config.js';

dotenv.config();  // Load environment variables

// GraphQL endpoint
const endpoint = 'https://api.github.com/graphql';
export const maxResponseTime = 4 * 7 * 24 * 60; // 28 days in minutes

type IssueNode = {
    node: {
      createdAt: string;
      comments: {
        nodes: {
          createdAt: string;
        }[];
      };
      closedAt: string | null;
    };
  };
  
type RepoIssuesResponse = {
    repository: {
      issues: {
        edges: IssueNode[];
      };
    };
};

// Function to fetch repository issues with dynamic GitHub token
/**
 * Fetches the open issues for a given GitHub repository.
 *
 * @param owner - The owner of the repository.
 * @param name - The name of the repository.
 * @returns A promise that resolves to an array of issue edges, each containing issue details.
 *
 * @throws Will log an error message if the request fails and return an empty array.
 *
 * @example
 * ```typescript
 * const issues = await fetchRepoIssues('octocat', 'Hello-World');
 * console.log(issues);
 * ```
 */
export async function fetchRepoIssues(owner: string, name: string) {
    const client = new GraphQLClient(endpoint, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
      },
    });
  
    const query = `
      query GetRepoIssues($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
          issues(first: 100, states: OPEN) {
            edges {
              node {
                createdAt
                comments(first: 1) {
                  nodes {
                    createdAt
                  }
                }
                closedAt
              }
            }
          }
        }
      }
    `;
  
    try {
      const data = await client.request<RepoIssuesResponse>(query, { owner, name });
      logMessage('INFO', `Successfully fetched issues for ${owner}/${name}`);
      return data.repository.issues.edges;
    } catch (error) {
      const errorMessage = (error instanceof Error) ? error.message : 'Unknown error occurred';
      logMessage('ERROR', `Error fetching issues for ResponsiveMaintainer: ${errorMessage}`);
      return [];
    }
}

// Function to calculate IRM
/**
 * Calculates the Issue Response Metric (IRM) for a given set of issues.
 * The IRM is the average response time for issues, normalized to a score between 0 and 1.
 *
 * @param issues - An array of IssueNode objects representing the issues to calculate the IRM for.
 * @returns The normalized IRM score.
 *
 * @remarks
 * - The response time is calculated based on the time difference between the issue creation and the first comment.
 * - If there are no comments, the response time is calculated based on the time difference between the issue creation and closure.
 * - If neither comments nor closure time is available, a maximum response time is used.
 * - The IRM is logged as an informational message.
 *
 * @example
 * ```typescript
 * const issues = [
 *   {
 *     node: {
 *       createdAt: '2023-01-01T00:00:00Z',
 *       comments: { nodes: [{ createdAt: '2023-01-01T01:00:00Z' }] },
 *       closedAt: null
 *     }
 *   },
 *   {
 *     node: {
 *       createdAt: '2023-01-02T00:00:00Z',
 *       comments: { nodes: [] },
 *       closedAt: '2023-01-02T02:00:00Z'
 *     }
 *   }
 * ];
 * const irmScore = calculateIRM(issues);
 * console.log(irmScore); // Output: normalized IRM score
 * ```
 */
export function calculateIRM(issues: IssueNode[]) {
  let totalResponseTime = 0;
  let issueCount = 0;

  issues.forEach(issue => {
    const createdAt = parseISO(issue.node.createdAt);
    let responseTime = null;

    // Check if there was a comment, otherwise use closedAt
    if (issue.node.comments.nodes.length > 0) {
      const firstCommentAt = parseISO(issue.node.comments.nodes[0].createdAt);
      responseTime = differenceInMinutes(firstCommentAt, createdAt);
    } else if (issue.node.closedAt) {
      const closedAt = parseISO(issue.node.closedAt);
      responseTime = differenceInMinutes(closedAt, createdAt);
    }

    if (responseTime !== null) {
      totalResponseTime += responseTime;
      issueCount++;
    }
    //else add the maxResponseTime
    else{
      totalResponseTime += maxResponseTime;
      issueCount++;
    }
  });

  const averageResponseTime = issueCount > 0 ? totalResponseTime / issueCount : 0;

  logMessage('INFO', `Calculated IRM (Average Issue Response Time): ${averageResponseTime} minutes`);
  
  // Normalize IRM to a score between 0 and 1
  return normalizeIRM(averageResponseTime, maxResponseTime);
}

// Function to normalize IRM score
/**
 * Normalizes the Incident Response Metric (IRM) based on the average response time.
 * 
 * @param averageResponseTime - The average response time in minutes.
 * @param maxResponseTime - The maximum allowable response time in minutes.
 * @returns The normalized IRM score, clamped between 0 and 1.
 * 
 * @remarks
 * The function clamps the average response time to the maximum response time if it exceeds it,
 * and then normalizes the clamped response time to a value between 0 and 1. The normalized score
 * is calculated as `1 - (clampedResponseTime / maxResponseTime)`.
 * 
 * @example
 * ```typescript
 * const irmScore = normalizeIRM(30, 60);
 * console.log(irmScore); // Output: 0.5
 * ```
 */
export function normalizeIRM (averageResponseTime: number, maxResponseTime: number) {
  // Clamp response time to maxResponseTime and normalize between 0 and 1
  const clampedResponseTime = Math.min(averageResponseTime, maxResponseTime);
  logMessage('INFO', `Clamped Response Time: ${clampedResponseTime} minutes`);
  logMessage('INFO', `Normalized IRM Score: ${1 - clampedResponseTime / maxResponseTime}`);
  return 1 - clampedResponseTime / maxResponseTime;
  
}

/**
 * Retrieves the Issue Resolution Metric (IRM) for a given repository.
 *
 * @param owner - The owner of the repository.
 * @param repo - The name of the repository.
 * @returns A promise that resolves to the IRM value.
 */
export async function getIRM(owner: string, repo: string): Promise<number> {
  const issues = await fetchRepoIssues(owner, repo);;
  return calculateIRM(issues);
  
}
