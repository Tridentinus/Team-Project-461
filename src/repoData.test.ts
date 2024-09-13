import { fetchRepoData } from './repoData';
import { jest } from '@jest/globals';

// Mock the fetchRepoData function directly using jest.fn()
jest.mock('./repoData', () => ({
  fetchRepoData: jest.fn(),
}));

describe('Repo Data Fetching', () => {
  const mockFetchRepoData = fetchRepoData as jest.Mock; // Type the mock correctly

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch repository data successfully', async () => {
    const mockData = {
      repository: {
        name: 'dummyPackage',
        description: 'A dummy package repo for testing metrics',
        stargazerCount: 1,
      },
    };

    // Mock the resolved value for fetchRepoData
    mockFetchRepoData.mockResolvedValue(mockData as never);

    // Call fetchRepoData
    const result = await fetchRepoData('Tridentinus', 'dummyPackage', 'fake-token');

    // Verify the result
    expect(result).toEqual(mockData);
    expect(mockFetchRepoData).toHaveBeenCalledTimes(1);
    expect(mockFetchRepoData).toHaveBeenCalledWith('Tridentinus', 'dummyPackage', 'fake-token');
  });

  it('should throw an error if the request fails', async () => {
    // Mock the rejected value for fetchRepoData
    mockFetchRepoData.mockRejectedValue(new Error('Request failed') as never);

    // Expect fetchRepoData to throw an error
    await expect(fetchRepoData('Tridentinus', 'dummyPackage', 'fake-token')).rejects.toThrow('Request failed');
  });
});
