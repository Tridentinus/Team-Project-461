import { describe, it, expect, vi } from 'vitest';
import { getLinkType, getRepoOwnerAndName, getNpmName, logMessage, clearLog, getLinksFromFile, gitHubRequest } from '../src/utils.ts'; // adjust the path as necessary
import { GraphQLClient } from 'graphql-request';
import * as fs from 'fs';

describe('getLinkType', () => {
  it('should return "GitHub" for GitHub URLs', () => {
    expect(getLinkType('https://github.com/someuser/somerepo')).toBe('GitHub');
    expect(getLinkType('http://www.github.com/someuser/somerepo')).toBe('GitHub');
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

describe('getRepoOwnerAndName', () => {
  it('should extract owner and name from a valid GitHub repository link', () => {
    const repoLink = 'https://github.com/ownername/reponame';
    const result = getRepoOwnerAndName(repoLink);

    expect(result).toEqual({ owner: 'ownername', name: 'reponame' });
  });

  it('should return null for an invalid GitHub repository link', () => {
    const invalidLink = 'https://github.com/ownername';
    const result = getRepoOwnerAndName(invalidLink);

    expect(result).toBeNull();
  });

  it('should return null and log an error for a non-GitHub URL', () => {
    const nonGithubLink = 'https://example.com/ownername/reponame';
    const result = getRepoOwnerAndName(nonGithubLink);

    expect(result).toBeNull();
  });

  it('should handle edge cases such as empty or malformed URLs', () => {
    expect(getRepoOwnerAndName('')).toBeNull(); // Empty string
    expect(getRepoOwnerAndName('https://github.com/')).toBeNull(); // Incomplete GitHub URL
    expect(getRepoOwnerAndName('https://github.com/ownername/')).toBeNull(); // Missing repository name
  });
});

describe('getNpmName', () => {
  it('should extract the module name from a valid npm link', () => {
    const validLink = 'https://www.npmjs.com/package/express';
    const result = getNpmName(validLink);
    expect(result).toBe('express');
  });

  it('should extract the module name from an npm link without "www"', () => {
    const validLinkNoWWW = 'https://npmjs.com/package/lodash';
    const result = getNpmName(validLinkNoWWW);
    expect(result).toBe('lodash');
  });

  it('should return null for an invalid npm link', () => {
    const invalidLink = 'https://www.npmjs.com/notapackage/express';
    const result = getNpmName(invalidLink);
    expect(result).toBeNull();
  });

  it('should return null for a non-npm link', () => {
    const nonNpmLink = 'https://example.com/package/express';
    const result = getNpmName(nonNpmLink);
    expect(result).toBeNull();
  });

  it('should handle edge cases like empty or malformed URLs', () => {
    expect(getNpmName('')).toBeNull(); // Empty string
    expect(getNpmName('https://npmjs.com/package/')).toBeNull(); // Missing module name
    expect(getNpmName('https://www.npmjs.com/')).toBeNull(); // Incomplete URL
  });
});

// Mock the file system module
vi.mock('fs');

describe('logMessage', () => {
  it('should log the correct message format', () => {
    // Arrange: Mock the current date and fs.appendFileSync
    const mockDate = new Date('2024-09-13T12:00:00Z');
    vi.setSystemTime(mockDate);
    const mockAppendFileSync = vi.spyOn(fs, 'appendFileSync');
    
    const level = 'INFO';
    const message = 'This is a test log message';
    
    // Act: Call the function
    logMessage(level, message);
    
    // Assert: Check if fs.appendFileSync was called with the correct arguments
    const expectedLogEntry = `2024-09-13T12:00:00.000Z [INFO] - This is a test log message\n`;
    expect(mockAppendFileSync).toHaveBeenCalledWith(expect.any(String), expectedLogEntry, { flag: 'a' });
  });

  it('should append the message to the log file', () => {
    const mockAppendFileSync = vi.spyOn(fs, 'appendFileSync');
    
    const level = 'ERROR';
    const message = 'An error occurred';
    
    logMessage(level, message);
    
    expect(mockAppendFileSync).toHaveBeenCalledTimes(1);
  });
});

// Mock the file system module
vi.mock('fs');

describe('clearLog', () => {
  const mockLogFile = 'myLog.log'; // You can replace this with your actual log file path

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

describe('getLinksFromFile', () => {
    it('should return an array of links when the file contains links', () => {
        // Setup the mock
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.readFileSync).mockReturnValue('https://github.com/cloudinary/cloudinary_npm\nhttps://www.npmjs.com/package/express\n');
        
        const filePath = 'mock/path/to/package.json';
        const result = getLinksFromFile(filePath);
        
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
        const result = getLinksFromFile(filePath);
        
        expect(result).toEqual([]);
    });

    it('should throw an error when the file does not exist', () => {
        // Setup the mock
        vi.mocked(fs.existsSync).mockReturnValue(false);
        
        const filePath = 'mock/path/to/nonexistent-file.json';
        
        expect(() => getLinksFromFile(filePath)).toThrow(`File not found: ${filePath}`);
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