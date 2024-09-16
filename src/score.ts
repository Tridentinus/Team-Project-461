import { getGitHubLicenseScore, getNpmLicenseScore } from "./license.js";
import { calculateBusFactor, fetchRepoContributors } from "./busFactor.js";
import { GITHUB_TOKEN } from "./config.js";

export async function getGitHubScores(owner: string, repo: string): Promise<string> {
  const licenseScore = await getGitHubLicenseScore(owner, repo);
  const contributors = await fetchRepoContributors(owner, repo, GITHUB_TOKEN);
  const busFactor = calculateBusFactor(contributors);
  const netScore = licenseScore + busFactor;

  const output = {
    "NetScore": netScore,
    "BusFactor": busFactor,
    "License": licenseScore
  };

  return JSON.stringify(output).replace(/,/g, ', ');
}

export async function getNpmScores(packageName: string): Promise<string> {
  const licenseScore = await getNpmLicenseScore(packageName);
  const netScore = licenseScore;

  const output = {
    "NetScore": netScore,
    "License": licenseScore
  };

  return JSON.stringify(output).replace(/,/g, ', ');
}