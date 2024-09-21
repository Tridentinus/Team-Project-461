import { isLicenseCompatible } from "./license.js";
import { getBusFactorScore } from "./busFactor.js";
import { getIRM } from "./irmMetric.js";
import { measureConcurrentLatencies } from "./latency.js";

interface score {
  id: number;
  name: string;
  active: boolean;
}


export async function getScores(owner: string, repo: string, url: string): Promise<string> {
  // const issues = await fetchRepoIssues(owner, repo);
  // const irm = calculateIRM(issues);

  const { latencies, results, errors } = await measureConcurrentLatencies([getBusFactorScore, isLicenseCompatible], owner, repo);
  
  // const responsiveMaintainer = results[0] ?? 0;
  // const responsiveMaintainerLatency = latencies[0];

  const busFactor = results[0] ?? 0;
  const busFactorLatency = latencies[0];
  const license = results[1] ?? 0;
  const licenseLatency = latencies[1];

  //create array of weights for each metric
  const size = 3;
  //create array of weights = 1/size for each metric
  const weights = new Array(size).fill(1 / size);

  //calculate the net score
  // const netScore = licenseScore * weights[0] + busFactor * weights[1] + irm * weights[2]
  const netScore = 0.5 * license + 0.5 * busFactor;

  const output = {
    "URL": url,
    "NetScore": netScore,
    "NetScore_Latency": -1,
    "RampUp": -1,
    "RampUp_Latency": -1,
    "Correctness": -1,
    "Correctness_Latency": -1,
    "BusFactor": busFactor,
    "BusFactor_Latency": busFactorLatency,
    "ResponsiveMaintainer": -1,
    "ResponsiveMaintainer_Latency": -1,
    "License": license,
    "License_Latency": licenseLatency
  };

  return JSON.stringify(output);
}
