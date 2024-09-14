import { describe, it, beforeEach, expect, vi } from 'vitest';
import { fetchRepoData } from '../src/repoData.ts';
import { GraphQLClient } from 'graphql-request';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Mock the GraphQLClient
vi.mock('graphql-request');

describe('Repo Data Fetching', () => {
  const mockClient = GraphQLClient as unknown as { new (): { request: vi.Mock } };

  beforeEach(() => {
    // Reset the mock before each test
    vi.resetAllMocks();
  });

  it('should fetch repository data', async () => {
    const mockRequest = vi.fn();
    mockClient.prototype.request = mockRequest;

    const mockData = {
      repository: {
        name: 'dummyPackage',
        description: 'A dummy package repo for testing metrics',
        stargazerCount: 1,
      },
    };

    mockRequest.mockResolvedValueOnce(mockData);

    await fetchRepoData('Tridentinus', 'dummyPackage', process.env.GITHUB_TOKEN || '');

    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(mockRequest).toHaveBeenCalledWith(expect.any(String), { owner: 'Tridentinus', name: 'dummyPackage' });
  });
});
