import { getRepoOwnerAndName } from './utils.js';
import {getLicenseScore} from './license.js';
const args = process.argv.slice(2); // exclude first two arguments (node and script path)

if (args.length !== 1) {
  // check if exactly one argument is provided
  console.log("Incorrect number of arguments provided");
  process.exit(1);
} else if (args[0] === "install") {
  // check if the argument is "install"
  console.log("Installing dependencies...");
} else if (args[0] === "test") {
  // check if the argument is "test"
  console.log("Running tests...");
} else {
  // otherwise, assume we have a URL_FILE
  const result = getRepoOwnerAndName(args[0]);
  if (result == null) {
    console.error("Invalid GitHub repository link.");
    process.exit(1);
  }
  const license_score = await getLicenseScore(result.owner, result.name, process.env.GITHUB_TOKEN || "");
  console.log(`License compatibility score: ${license_score}`);
}
