import { GraphQLClient } from 'graphql-request'; 
import dotenv from 'dotenv';
import * as fs from 'fs';
import { log } from 'console';
import exp from 'constants';



dotenv.config();  // Load environment variables

// GraphQL endpoint
const logFile = process.env.LOG_FILE || 'myLog.log';
const endpoint = 'https://api.github.com/graphql';

// Function to log messages to the log file
function logMessage(level: string, message: string) {
  const logEntry = `${new Date().toISOString()} [${level}] - ${message}\n`;
  fs.appendFileSync(logFile, logEntry, { flag: 'a' });
}


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
export async function fetchRepoContributors(owner: string, name: string, token: string): Promise<CommitNode[]> {
  const client = new GraphQLClient(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
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
    const data = await client.request<RepoContributorsResponse>(query, { owner, name });
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
  
  export { logMessage, GraphQLClient};
