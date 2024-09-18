import { GraphQLClient } from 'graphql-request';
import { logMessage } from './utils.js';
import * as dotenv from 'dotenv';
import { differenceInMinutes, parseISO } from 'date-fns';
import { log } from 'console';

dotenv.config();  // Load environment variables

// GraphQL endpoint
const endpoint = 'https://api.github.com/graphql';
export const maxResponseTime = 4 * 7 * 24 * 60; // 7 days in minutes

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
export async function fetchRepoIssues(owner: string, name: string, token: string) {
    const client = new GraphQLClient(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
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
      logMessage('ERROR', `Error fetching issues: ${errorMessage}`);
      console.error(`Error fetching issues: ${errorMessage}`);
      return [];
    }
}

// Function to calculate IRM
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
export function normalizeIRM (averageResponseTime: number, maxResponseTime: number) {
  // Clamp response time to maxResponseTime and normalize between 0 and 1
  const clampedResponseTime = Math.min(averageResponseTime, maxResponseTime);
  logMessage('INFO', `Clamped Response Time: ${clampedResponseTime} minutes`);
  return 1 - clampedResponseTime / maxResponseTime;
}
