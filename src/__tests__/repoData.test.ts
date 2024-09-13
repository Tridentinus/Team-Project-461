import { fetchRepoData } from '../repoData';
import { GraphQLClient } from 'graphql-request';

// Mock the GraphQLClient
jest.mock('graphql-request');
//use the .env file to get the token
require('dotenv').config();



test('Repo Data Fetching', () => {
  const mockClient = GraphQLClient as jest.MockedClass<typeof GraphQLClient>;

  beforeEach(() => {
    // Reset the mock before each test
    mockClient.mockClear();
  });

  it('should fetch repository data', async () => {
    const mockRequest = jest.fn();
    mockClient.prototype.request = mockRequest;

    const mockData = {
      repository: {
        name: 'dummyPackage',
        description: 'A dummy package repo for testing metrics',
        stargazerCount: 1,
      },
    };



    mockRequest.mockResolvedValueOnce(mockData);
    //use the .env file to get the token

    await fetchRepoData('Tridentinus', 'dummyPackage', process.env.GITHUB_TOKEN || '');

    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(mockRequest).toHaveBeenCalledWith(expect.any(String), { owner: 'Tridentinus', name: 'dummyPackage' });
  });
});
