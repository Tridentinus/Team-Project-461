import { GraphQLClient } from 'graphql-request';
import { logMessage, gitHubRequest } from './utils.js';
import axios from 'axios';
import { GITHUB_TOKEN } from './config.js';

// GraphQL endpoint
const endpoint = 'https://api.github.com/graphql';


// this type is the author name and email for each commit
type CommitAuthor = {
    name: string;
    email: string;
  };
// this type is the node for each commit (author and committed date)
type CommitNode = {
    node: {
      author: CommitAuthor;
      committedDate: string;
    };
  };
 // this type is the response from the GitHub API for fetching contributors
// it contains the repository, default branch, and commit history
// there are edges between each commit node which are the commits
  type RepoContributorsResponse = {
    repository: {
      defaultBranchRef: {
        target: {
          history: {
            edges: CommitNode[];
          };
        };
      };
    };
  };



/**
 * Fetches the contributors of a given GitHub repository.
 *
 * @param owner - The owner of the repository.
 * @param name - The name of the repository.h * @returns A promise that resolves to an array of commit nodes representing the contributors. *
 * @throws Will log an error message if the request fails and return an empty array. * * @example * ```typescript * const contributors = await fetchRepoContributors('octocat', 'Hello-World'); * console.log(contributors); * ```
 */
export async function fetchRepoContributors(owner: string, name: string): Promise<CommitNode[]> {
  const client = new GraphQLClient(endpoint, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
    },
  });

  const query = `
    query GetRepoContributors($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        defaultBranchRef {
          target {
            ... on Commit {
              history(first: 100) {
                edges {
                  node {
                    author {
                      name
                      email
                    }
                    committedDate
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const data: RepoContributorsResponse = await gitHubRequest(query, {owner, name}) as RepoContributorsResponse;
    // const data = await client.request<RepoContributorsResponse>(query, { owner, name });
    logMessage('INFO', `Successfully fetched contributors for ${owner}/${name}`);
    return data.repository.defaultBranchRef.target.history.edges;
  } catch (error) {
    const errorMessage = (error instanceof Error) ? error.message : 'Unknown error occurred';
    logMessage('ERROR', `Error fetching contributors for BusFactor: ${errorMessage}`);
    return [];
  }
}



/**
 * Calculates the bus factor for a given set of contributors.
 * 
 * The bus factor is a measure of the risk resulting from information and capabilities not being shared among team members.
 * It is defined as the number of key developers who would need to be incapacitated to cause a project to stall due to lack of knowledgeable or competent personnel.
 * 
 * This function calculates the bus factor by determining the minimum number of contributors who together account for at least 50% of the total commits.
 * 
 * @param contributors - An array of `CommitNode` objects representing the contributors and their commits.
 * @returns The bus factor, which is the number of contributors covering at least 50% of the total commits.
 */
export function calculateBusFactor(contributors: CommitNode[]): number {
    const commitCountByAuthor: { [author: string]: number } = {};
  
    // Count commits by contributor
    contributors.forEach((commit: CommitNode) => {
      const author = commit.node.author.name;
      commitCountByAuthor[author] = (commitCountByAuthor[author] || 0) + 1;
    });
  
    // Log the number of commits per contributor
    logMessage('DEBUG', 'Commit count by author:');
    Object.entries(commitCountByAuthor).forEach(([author, count]) => {
      logMessage('DEBUG', `${author}: ${count} commits`);
    });
  
    // Sort contributors by commit count
    const sortedContributors = Object.entries(commitCountByAuthor).sort((a, b) => b[1] - a[1]);
  
    // Log the sorted contributors
    logMessage('DEBUG', 'Sorted contributors by commit count:');
    sortedContributors.forEach(([author, count]) => {
      logMessage('DEBUG', `${author}: ${count} commits`);
    });
  
    // Calculate the bus factor (e.g., contributors covering 50% of the total commits)
    const totalCommits = contributors.length;
    logMessage('INFO', `Total number of commits: ${totalCommits}`);
  
    let cumulativeCommits = 0;
    let busFactor = 0;
  
    for (let [author, commitCount] of sortedContributors) {
      cumulativeCommits += commitCount;
      busFactor++;
      
      // Log cumulative commit count and current bus factor
      logMessage('INFO', `Cumulative commits: ${cumulativeCommits}, Current bus factor: ${busFactor}`);
  
      if (cumulativeCommits >= totalCommits * 0.5) {  // Cover 50% of the commits
        logMessage('INFO', `Reached 50% of the total commits. Bus factor is: ${busFactor}`);
        break;
      }
    }
  
    logMessage('INFO', `Final calculated Bus Factor: ${busFactor}`);
    return busFactor;
  }
  



  

/**
 * Calculates the Bus Factor score for a given repository.
 * The Bus Factor is a measure of the risk associated with the concentration of information in a project.
 * 
 * @param owner - The owner of the repository.
 * @param repo - The name of the repository.
 * @returns A promise that resolves to the Bus Factor score, a number between 0 and 1.
 */
export async function getBusFactorScore(owner: string, repo: string): Promise<number> {
  const contributors = await fetchRepoContributors(owner, repo);
  const busFactor = calculateBusFactor(contributors);
  const score = Math.min(busFactor / 5, 1);
  return score;
}
