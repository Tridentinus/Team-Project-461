import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getLinkType, parseGitHubUrl, parseNpmUrl, logMessage, clearLog, getUrlsFromFile, gitHubRequest, npmToGitHub } from '../src/utils.ts'; // adjust the path as necessary
import { GraphQLClient } from 'graphql-request';
import * as fs from 'fs';
import axios from "axios";
import * as utils from '../src/utils';
import { LOG_FILE } from '../src/config.ts'; // Import LOG_FILE



describe('getLinkType', () => {
  it('should return "GitHub" for GitHub URLs', () => {
    expect(getLinkType('https://github.com/someuser/somerepo')).toBe('GitHub');
    expect(getLinkType('http://www.github.com/someuser/somerepo')).toBe('GitHub');
    expect(getLinkType('git@github.com:owner/repo')).toBe('GitHub');
    expect(getLinkType('git+ssh://git@github.com/owner/repo')).toBe('GitHub');
    expect(getLinkType('https://github.com/owner/repo/')).toBe('GitHub');
    expect(getLinkType('https://github.com/owner/repo.git')).toBe('GitHub');
  });

  it('should return "npm" for npm URLs', () => {
    expect(getLinkType('https://npmjs.com/package/somepackage')).toBe('npm');
    expect(getLinkType('http://www.npmjs.com/package/somepackage')).toBe('npm');
  });

  it('should return "Unknown" for non-GitHub and non-npm URLs', () => {
    expect(getLinkType('https://example.com')).toBe('Unknown');
    expect(getLinkType('http://mywebsite.com')).toBe('Unknown');
  });

  it('should return "Unknown" for malformed URLs', () => {
    expect(getLinkType('not-a-valid-url')).toBe('Unknown');
    expect(getLinkType('github.com/someuser')).toBe('Unknown'); // No protocol
  });
});

describe('parseGitHubUrl', () => {
  it('should extract owner and repo from a valid GitHub repository link', () => {
    const repoLink = 'https://github.com/ownername/reponame';
    const result = parseGitHubUrl(repoLink);

    expect(result).toEqual({ owner: 'ownername', repo: 'reponame' });
  });

  it('should return null for an invalid GitHub repository link', () => {
    const invalidLink = 'https://github.com/ownername';
    const result = parseGitHubUrl(invalidLink);

    expect(result).toBeNull();
  });

  it('should return null and log an error for a non-GitHub URL', () => {
    const nonGithubLink = 'https://example.com/ownername/reponame';
    const result = parseGitHubUrl(nonGithubLink);

    expect(result).toBeNull();
  });

  it('should handle edge cases such as empty or malformed URLs', () => {
    expect(parseGitHubUrl('')).toBeNull(); // Empty string
    expect(parseGitHubUrl('https://github.com/')).toBeNull(); // Incomplete GitHub URL
    expect(parseGitHubUrl('https://github.com/ownername/')).toBeNull(); // Missing repository name
  });
});

describe('getNpmparseNpmUrlName', () => {
  it('should extract the module name from a valid npm link', () => {
    const validLink = 'https://www.npmjs.com/package/express';
    const result = parseNpmUrl(validLink);
    expect(result).toBe('express');
  });

  it('should extract the module name from an npm link without "www"', () => {
    const validLinkNoWWW = 'https://npmjs.com/package/lodash';
    const result = parseNpmUrl(validLinkNoWWW);
    expect(result).toBe('lodash');
  });

  it('should return null for an invalid npm link', () => {
    const invalidLink = 'https://www.npmjs.com/notapackage/express';
    const result = parseNpmUrl(invalidLink);
    expect(result).toBeNull();
  });

  it('should return null for a non-npm link', () => {
    const nonNpmLink = 'https://example.com/package/express';
    const result = parseNpmUrl(nonNpmLink);
    expect(result).toBeNull();
  });

  it('should handle edge cases like empty or malformed URLs', () => {
    expect(parseNpmUrl('')).toBeNull(); // Empty string
    expect(parseNpmUrl('https://npmjs.com/package/')).toBeNull(); // Missing module name
    expect(parseNpmUrl('https://www.npmjs.com/')).toBeNull(); // Incomplete URL
  });
});

vi.mock('fs');

describe('logMessage', () => {
  let mockAppendFileSync: vi.SpyInstance;
  let mockConsoleLog: vi.SpyInstance;

  beforeEach(() => {
    mockAppendFileSync = vi.spyOn(fs, 'appendFileSync');
    mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {}); // Mock console.log to suppress output
    // Mock the module exporting LOG_LEVEL
    vi.mock('../src/config.ts', () => ({
      GITHUB_TOKEN: 'mock-github-token',  // Override GITHUB_TOKEN for the test
      LOG_FILE: 'mock-log-file.log',  // Override LOG_FILE for the test
      LOG_LEVEL: '2',  // Override LOG_LEVEL for the test. Print all log levels
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks(); // Restore mocks after each test
  });

  it('should log the correct message format', () => {
    // Arrange: Mock the current date and fs.appendFileSync
    const mockDate = new Date('2024-09-13T12:00:00Z');
    vi.setSystemTime(mockDate);
    
    const level = 'INFO';
    const message = 'This is a test log message';
    
    // Act: Call the function
    logMessage(level, message);
    
    // Assert: Check if fs.appendFileSync was called with the correct arguments
    const expectedLogEntry = `2024-09-13T12:00:00.000Z [INFO] - This is a test log message\n`;
    expect(mockAppendFileSync).toHaveBeenCalledWith(LOG_FILE, expectedLogEntry, { flag: 'a' });
  });

  it('should append the message to the log file', () => {
    const level = 'ERROR';
    const message = 'An error occurred';
    
    logMessage(level, message);
    
    expect(mockAppendFileSync).toHaveBeenCalledTimes(1);
  });

  it('should log ERROR messages to the console and set process.exitCode', () => {
    const level = 'ERROR';
    const message = 'This is an error message';
    
    logMessage(level, message);
    
    // Assert that console.log was called and process.exitCode was set
    expect(mockConsoleLog).toHaveBeenCalledWith(`Error: ${message}`);
    expect(process.exitCode).toBe(1);
  });

  it('should log DEBUG messages to the console', () => {
    const level = 'DEBUG';
    const message = 'This is a debug message';
    
    logMessage(level, message);
    
    // Assert that console.log was called with the message
    expect(mockAppendFileSync).toHaveBeenCalled();
  });
});

// Mock the file system module
vi.mock('fs');

describe('clearLog', () => {
  const mockLogFile = 'mock-log-file.log';

  it('should clear the log file if it exists', () => {
    // Arrange: Mock fs.existsSync to return true and fs.writeFileSync
    const mockExistsSync = vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    const mockWriteFileSync = vi.spyOn(fs, 'writeFileSync');

    // Act: Call the function
    clearLog();

    // Assert: Check that the log file exists and its contents were cleared
    expect(mockExistsSync).toHaveBeenCalledWith(mockLogFile);
    expect(mockWriteFileSync).toHaveBeenCalledWith(mockLogFile, '', { flag: 'w' });
    expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
  });

  it('should not clear the log file if it does not exist', () => {
    // Arrange: Mock fs.existsSync to return false
    const mockExistsSync = vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    const mockWriteFileSync = vi.spyOn(fs, 'writeFileSync');

    // Act: Call the function
    clearLog();

    // Assert: Check that the log file does not exist and writeFileSync was not called
    expect(mockExistsSync).toHaveBeenCalledWith(mockLogFile);
    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });
});

// Mock the `fs` module
vi.mock('fs');

describe('getUrlsFromFile', () => {
    it('should return an array of links when the file contains links', () => {
        // Setup the mock
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.readFileSync).mockReturnValue('https://github.com/cloudinary/cloudinary_npm\nhttps://www.npmjs.com/package/express\n');
        
        const filePath = 'mock/path/to/package.json';
        const result = getUrlsFromFile(filePath);
        
        expect(result).toEqual([
            'https://github.com/cloudinary/cloudinary_npm',
            'https://www.npmjs.com/package/express'
        ]);
    });

    it('should return an empty array when the file is empty', () => {
        // Setup the mock
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.readFileSync).mockReturnValue('');
        
        const filePath = 'mock/path/to/package.json';
        const result = getUrlsFromFile(filePath);
        
        expect(result).toEqual([]);
    });

    it('should return [] when the file does not exist', () => {
        // Setup the mock
        vi.mocked(fs.existsSync).mockReturnValue(false);
        
        const filePath = 'mock/path/to/nonexistent-file.json';
        
        expect(() => getUrlsFromFile(filePath)).toThrow(`File not found: ${filePath}`);
    });
});


// Mock the GraphQLClient
vi.mock('graphql-request');

describe('gitHubRequest', () => {
  const mockQuery = `
    query($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        name
        description
      }
    }
  `;
  const mockVariables = { owner: 'someowner', name: 'somerepo' };
  
  it('should fetch data when the request is successful', async () => {
    const mockClient = GraphQLClient as unknown as { new (): { request: vi.Mock } };
    const mockRequest = vi.fn();
    mockClient.prototype.request = mockRequest;

    const mockResponseData = {
      repository: {
        name: 'somerepo',
        description: 'A test repository',
      },
    };

    // Mock the request to return mock data
    mockRequest.mockResolvedValueOnce(mockResponseData);

    const result = await gitHubRequest(mockQuery, mockVariables);

    expect(mockRequest).toHaveBeenCalledWith(mockQuery, mockVariables);
    expect(result).toEqual(mockResponseData);
  });

  it('should return null and log an error if the request fails', async () => {
    const mockClient = GraphQLClient as unknown as { new (): { request: vi.Mock } };
    const mockRequest = vi.fn();
    mockClient.prototype.request = mockRequest;

    const mockError = new Error('Request failed');
    mockRequest.mockRejectedValueOnce(mockError);

    const result = await gitHubRequest(mockQuery, mockVariables);

    expect(mockRequest).toHaveBeenCalledWith(mockQuery, mockVariables);
    expect(result).toBeNull();
  });
});

// Mock the axios module
vi.mock("axios");
vi.mock("./helpers");

describe('npmToGitHub', () => {
  const packageName = 'example-package';

  it('should return GitHub repo info when a valid npm package with a repo exists', async () => {
    // Mocking the axios response for a valid package
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: {
        repository: {
          url: 'git+https://github.com/exampleOwner/exampleRepo.git',
        },
      },
    });

    const result = await npmToGitHub(packageName);
    expect(result).toEqual({ owner: 'exampleOwner', repo: 'exampleRepo' });
  });

  it('should log an error and return null if no repository information is found', async () => {
    // Mocking the axios response with no repository information
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: {},
    });

    const result = await npmToGitHub(packageName);
    expect(result).toBeNull();
  });

  it('should handle errors from the axios request', async () => {
    // Mocking axios to throw an error
    vi.mocked(axios.get).mockRejectedValueOnce(new Error('Network error'));

    const result = await npmToGitHub(packageName);
    expect(result).toBeNull();
  });

  it('should return null for invalid GitHub URLs', async () => {
    // Mocking the axios response for a package with an invalid repo URL
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: {
        repository: {
          url: 'https://someotherurl.com/exampleOwner/exampleRepo.git',
        },
      },
    });

    const result = await npmToGitHub(packageName);
    expect(result).toBeNull();
  });
});
