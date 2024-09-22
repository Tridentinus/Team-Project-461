import { GraphQLClient } from 'graphql-request';
import { logMessage, gitHubRequest } from './utils.js';
import dotenv from 'dotenv';
import axios from 'axios';
import { GITHUB_TOKEN } from './config.js';


dotenv.config();  // Load environment variables

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



// Function to fetch repository data with dynamic GitHub token
// Arguments: owner (string), name (string), token (string)
// Returns: Promise<void>

//how it works: fetches the repository data from the owner and name provided
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
    logMessage('ERROR', `Error fetching contributors: ${errorMessage}`);
    console.error(`Error fetching contributors: ${errorMessage}`);
    return [];
  }
}


// Function to calculate the Bus Factor for a list of contributors
// Arguments: contributors (array of CommitNode)
// Returns: number

//how it works: calculates the bus factor for the contributors by 
//counting the commits by each contributor and sorting them by commit count
//then calculates the bus factor by finding the contributors that cover 50% of the total commits

export function calculateBusFactor(contributors: CommitNode[]): number {
    const commitCountByAuthor: { [author: string]: number } = {};
  
    // Count commits by contributor
    contributors.forEach((commit: CommitNode) => {
      const author = commit.node.author.name;
      commitCountByAuthor[author] = (commitCountByAuthor[author] || 0) + 1;
    });
  
    // Log the number of commits per contributor
    logMessage('INFO', 'Commit count by author:');
    Object.entries(commitCountByAuthor).forEach(([author, count]) => {
      logMessage('INFO', `${author}: ${count} commits`);
    });
  
    // Sort contributors by commit count
    const sortedContributors = Object.entries(commitCountByAuthor).sort((a, b) => b[1] - a[1]);
  
    // Log the sorted contributors
    logMessage('INFO', 'Sorted contributors by commit count:');
    sortedContributors.forEach(([author, count]) => {
      logMessage('INFO', `${author}: ${count} commits`);
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
  
  // Function to fetch contributors for a GitHub repository
// Arguments: owner (string), repo (string), token (string)
// Returns: Promise<any[]>



  export async function fetchYearContributors(owner: string, repo: string, token: string): Promise<any[]> {
    const endpoint = `https://api.github.com/repos/${owner}/${repo}/contributors`;
  
    const client = axios.create({
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
  
    let contributors: any[] = [];
    let page = 1;
    const perPage = 100;  // Fetch maximum 100 contributors per page
  
    try {
      while (true) {
        const response = await client.get(endpoint, {
          params: {
            anon: true,  // Include anonymous contributors
            per_page: perPage,
            page: page,
          },
        });
  
        // Check if response data is valid and an array
        if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
          logMessage('INFO', `No more contributors to fetch for ${owner}/${repo}.`);
          break;  // No more contributors to fetch
        }
  
        // Safely concatenate contributors if data is valid
        contributors = contributors.concat(response.data);
        page++;
      }
  
      // Sort contributors by the number of commits (contributions) in descending order
      contributors.sort((a, b) => b.contributions - a.contributions);
  
      return contributors;
  
    } catch (error) {
      console.error(`Error fetching contributors: ${(error as Error).message}`);
      return [];
    }
  }

export function calculateYearBusFactor(contributors: any[]): number {
  const totalCommits = contributors.reduce((sum, contributor) => sum + contributor.contributions, 0);

  // Sort contributors by the number of commits in descending order
  const sortedContributors = contributors.sort((a, b) => b.contributions - a.contributions);

  let cumulativeCommits = 0;
  let busFactor = 0;

  for (let contributor of sortedContributors) {
    cumulativeCommits += contributor.contributions;
    busFactor++;

    // Stop when cumulative commits reach 50% of total commits
    if (cumulativeCommits >= totalCommits * 0.5) {
      break;
    }
  }

  return busFactor;
}

export async function getBusFactorScore(owner: string, repo: string): Promise<number> {
  const contributors = await fetchRepoContributors(owner, repo);
  const busFactor = calculateBusFactor(contributors);
  const score = Math.min(busFactor / 5, 1);
  return score;
}