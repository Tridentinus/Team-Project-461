## Team Members:

Trent Seaman, Ryan Jordan, Josh Wai, Pulkit Chhabra

1. Download and install Node.js found here: https://nodejs.org/en
2. Download and install nvm found here: https://github.com/coreybutler/nvm-windows/releases

3. Run `npm install` to install all dependencies
4. Run `npm run build` to compile TypeScript to JavaScript
5. Run `npm run package:<your_os>` to generate an executable file
6. Run `npm run test` to test that the program is working.


## How to run the repo fetcher (logs stored in src/myLog.log folder)
1. Run `npm run fetch -- -r <repo_name> -o <owner_name> -t <token>` to fetch the repo
*note: token is optional, if you have a token as environment variable GITHUB_TOKEN, you can omit the -t flag*
2. Run `npm run clean:logs` to clean the logs for fetch runs (optional) 

