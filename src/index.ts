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
  console.log("URL_FILE: " + args[0]);
}
