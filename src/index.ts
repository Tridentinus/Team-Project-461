import { getGitHubScores, getNpmScores } from "./score.js";
import { parseGitHubUrl, parseNpmUrl, getUrlsFromFile, getLinkType, logMessage, npmToGitHub } from "./utils.js";

// Main CLI logic
const args = process.argv.slice(2);

if (args.length !== 1) {
  logMessage("ERROR", "Incorrect number of arguments provided");
  process.exit(1);
}

const urlArray = getUrlsFromFile(args[0]);

for (const url of urlArray) {
  logMessage("INFO", `Analyzing repository: ${url}`);

  const linkType = getLinkType(url);

  if (linkType === "Unknown") {
    logMessage("ERROR", `Unknown link type: ${url}`);
    process.exit(1);
  }

  let owner: string | null = null;
  let repo: string | null = null;
  let output;

  if (linkType === "npm") {
    const packageName = parseNpmUrl(url);
    if (!packageName) {
      logMessage("ERROR", `Invalid npm link: ${url}`);
      process.exit(1);
    }

    const repoInfo = await npmToGitHub(packageName);
    if (repoInfo) {
      ({ owner, repo } = repoInfo);
      logMessage("INFO", `GitHub repository found for npm package: ${owner}/${repo}`);
    } else {
      output = await getNpmScores(packageName);
    }
  } else if (linkType === "GitHub") {
    ({ owner, repo } = parseGitHubUrl(url) || { owner: null, repo: null });
  }

  if (!owner || !repo) {
    logMessage("ERROR", `Invalid GitHub link: ${url}`);
    process.exit(1);
  }

  if (!output) {
    output = await getGitHubScores(owner, repo);
  }

  console.log(output);
}
