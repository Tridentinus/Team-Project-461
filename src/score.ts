import { isLicenseCompatible } from "./license.js";
import { calculateBusFactor, fetchRepoContributors } from "./busFactor.js";
import { GITHUB_TOKEN } from "./config.js";
import { fetchRepoIssues, calculateIRM } from "./irmMetric.js";

export async function getScores(owner: string, repo: string): Promise<string> {
  const licenseScore = await isLicenseCompatible(owner, repo);
  const contributors = await fetchRepoContributors(owner, repo, GITHUB_TOKEN);
  const busFactor = calculateBusFactor(contributors);
  const issues = await fetchRepoIssues(owner, repo, GITHUB_TOKEN);
  const irm = calculateIRM(issues);

  //create array of weights for each metric
  const size = 3;
  //create array of weights = 1/size for each metric
  const weights = new Array(size).fill(1 / size);


  //calculate the net score
  const netScore = licenseScore * weights[0] + busFactor * weights[1] + irm * weights[2]

  const output = {
    "NetScore": netScore,
    "BusFactor": busFactor,
    "License": licenseScore,
    "IRM": irm
  };

  return JSON.stringify(output).replace(/,/g, ', ');
}
