import { isLicenseCompatible } from "./license.js";
import { getBusFactorScore } from "./busFactor.js";
import { getIRM } from "./irmMetric.js";
import { calculateRampUpScore } from "./rampUpTime.js";
import { measureConcurrentLatencies } from "./latency.js";

export async function getScores(owner: string, repo: string, url: string): Promise<string> {

  const { latencies, results, errors } = await measureConcurrentLatencies([calculateRampUpScore, getBusFactorScore, getIRM, isLicenseCompatible], owner, repo);

  const rampUp = results[0] ?? 0;
  const rampUpLatency = latencies[0];

  const busFactor = results[1] ?? 0;
  const busFactorLatency = latencies[1];

  const responsiveMaintainer = results[2] ?? 0;
  const responsiveMaintainerLatency = latencies[2];

  const license = results[3] ?? 0;
  const licenseLatency = latencies[3];

  // calculate the net score and latency
  const netScore = Number((0.1 * rampUp + 0.2 * responsiveMaintainer + 0.3 * busFactor + 0.4 * license).toFixed(3));
  const netScoreLatency = Number((busFactorLatency + responsiveMaintainerLatency + licenseLatency).toFixed(3));

  const output = {
    "URL": url,
    "NetScore": netScore,
    "NetScore_Latency": netScoreLatency,
    "RampUp": rampUp,
    "RampUp_Latency": rampUpLatency,
    "Correctness": -1,
    "Correctness_Latency": -1,
    "BusFactor": busFactor,
    "BusFactor_Latency": busFactorLatency,
    "ResponsiveMaintainer": responsiveMaintainer,
    "ResponsiveMaintainer_Latency": responsiveMaintainerLatency,
    "License": license,
    "License_Latency": licenseLatency
  };

  return JSON.stringify(output);
}
