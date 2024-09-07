import * as fs from 'fs';

// Path to the log file
const logFile = process.env.LOG_FILE || 'src/myLog.log';

// Function to clear the log file
function clearLog() {
  // Check if the log file exists
  if (fs.existsSync(logFile)) {
    // Clear the contents of the log file by writing an empty string
    fs.writeFileSync(logFile, '', { flag: 'w' });
    console.log(`Log file "${logFile}" has been cleared.`);
  } else {
    console.log(`Log file "${logFile}" does not exist.`);
  }
}

// Run the clear log function
clearLog();
