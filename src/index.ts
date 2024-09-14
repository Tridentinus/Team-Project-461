import { getLicenseScore } from './license.js';
import { getRepoOwnerAndName } from './utils.js';
import { fetchRepoContributors, calculateBusFactor } from './busFactor.js';
import { exec } from 'child_process';


const args = process.argv.slice(2); // exclude first two arguments (node and script path)

if (args.length !== 1) {
  // check if exactly one argument is provided
  console.log("Incorrect number of arguments provided");
  process.exit(1);
} else if (args[0] === "install") {
  // check if the argument is "install"
  console.log("Installing dependencies...");
  exec('npm install', (error, stdout, stderr) => {
    if (error) {
        console.error(`Error executing npm install: ${error.message}`);
        process.exit(1);
    }

    if (stderr) {
        console.error(`npm install stderr: ${stderr}`);
        process.exit(1);
    }

    console.log(`npm install stdout: ${stdout}`);
    process.exit(0);
});
} else if (args[0] === "test") {
  // check if the argument is "test"
  console.log("Running tests...");
} else {
  // otherwise, assume we have a URL_FILE
  const license_score = await getLicenseScore(args[0]);
  const { owner, name } = getRepoOwnerAndName(args[0]) || { owner: '', name: '' };
  const token = process.env.GITHUB_TOKEN || '';
  const contributors = await fetchRepoContributors(owner, name, token);
  const bus_factor = calculateBusFactor(contributors);
  console.log(`License: ${license_score}`);
  console.log(`Bus factor: ${bus_factor}`);
}
