import { GraphQLClient } from 'graphql-request';
import dotenv from 'dotenv';
import * as fs from 'fs';

// const { GraphQLClient } = require('graphql-request');
// const dotenv = require('dotenv');
// const fs = require('fs');

dotenv.config();  // Load environment variables

// GraphQL endpoint
const logFile = process.env.LOG_FILE || 'myLog.log';
const endpoint = 'https://api.github.com/graphql';

// Function to log messages to the log file
function logMessage(level: string, message: string) {
  const logEntry = `${new Date().toISOString()} [${level}] - ${message}\n`;
  fs.appendFileSync(logFile, logEntry, { flag: 'a' });
}

// Function to fetch repository data with dynamic GitHub token
export async function fetchRepoData(owner: string, name: string, token: string) {
  // Create GraphQL client instance with dynamic token
  const client = new GraphQLClient(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,  // Use the provided token instead of process.env.GITHUB_TOKEN
    },
  });

  const query = `
    query GetRepo($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        name
        description
        stargazerCount
      }
    }
  `;

  try {
    const data = await client.request(query, { owner, name });
    logMessage('INFO', `Successfully fetched data for ${owner}/${name}`);
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    const errorMessage = (error instanceof Error) ? error.message : 'Unknown error occurred';
    logMessage('ERROR', `Error fetching data: ${errorMessage}`);
    console.error(`Error fetching data: ${errorMessage}`);
  }
}
