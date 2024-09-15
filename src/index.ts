import { getGitHubLicenseScore } from './license.js';
import { getRepoOwnerAndName, getNpmName, getLinksFromFile, getLinkType } from './utils.js';
import { fetchRepoContributors, calculateBusFactor } from './busFactor.js';
import { exec } from 'child_process';
import * as path from 'path';


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
  
  // Read links from file
  const links = getLinksFromFile(args[0]);
  
  if (!links) {
    console.log('Error reading links from file');
    process.exit(1);
  }

  for (const link of links) {
    console.log(`Analyzing repository: ${link}`);

    const linkType = getLinkType(link);

    if (linkType === 'Unknown') {
      console.log(`Unknown link type: ${link}`);
      process.exit(1);
    }

    if (linkType === 'npm') {
      const name = getNpmName(link);
      if (!name) {
        console.log(`Invalid npm link: ${link}`);
        process.exit(1);
      }
      continue;
    }

    if (linkType === 'GitHub') {
      const { owner, name } = getRepoOwnerAndName(link) || { owner: '', name: '' };
      if (!owner || !name) {
        console.log(`Invalid GitHub link: ${link}`);
        process.exit(1);
      }
      const token = process.env.GitHub_TOKEN || '';
      const license_score = await getGitHubLicenseScore(owner, name);
      const contributors = await fetchRepoContributors(owner, name, token);
      const bus_factor = calculateBusFactor(contributors);
      
      console.log(`License score: ${license_score}`);
      console.log(`Bus factor: ${bus_factor}`);
    }
  }
}
