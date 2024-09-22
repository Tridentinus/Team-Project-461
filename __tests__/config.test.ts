import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GraphQLClient } from 'graphql-request';
import { validateGitHubToken, GITHUB_TOKEN } from '../src/config.ts'; // Adjust the import based on your file name

describe('GitHub Token Validation', () => {
  const mockToken = 'mockToken';

  beforeEach(() => {
    process.env.GITHUB_TOKEN = mockToken; // Set the mock token
    // Mock the GraphQLClient to avoid actual API calls
    vi.spyOn(GraphQLClient.prototype, 'request').mockImplementation(async () => {
      return { viewer: { login: 'mockUser' } }; // Mock a successful response
    });
  });

  it('should validate a valid GitHub token', async () => {
    const isValid = await validateGitHubToken(GITHUB_TOKEN);
    expect(isValid).toBe(true);
  });

  it('should return false for an invalid GitHub token', async () => {
    // Override the mock implementation to simulate an invalid token
    vi.spyOn(GraphQLClient.prototype, 'request').mockImplementation(async () => {
      throw new Error('Bad credentials'); // Simulate a bad credentials error
    });

    const isValid = await validateGitHubToken(mockToken);
    expect(isValid).toBe(false);
  });

  it('should throw an error for unexpected errors', async () => {
    // Override the mock implementation to simulate an unexpected error
    vi.spyOn(GraphQLClient.prototype, 'request').mockImplementation(async () => {
      throw new Error('Some unexpected error');
    });

    await expect(validateGitHubToken(mockToken)).rejects.toThrow('Some unexpected error');
  });
});
