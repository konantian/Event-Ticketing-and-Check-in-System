const { exec } = require('child_process');
const path = require('path');
const { cleanupDatabase } = require('./tests/setup');

// Run tests using Mocha
console.log('Running API tests with Mocha...');

// Define the Mocha command
const testDir = path.join(__dirname, 'tests/api');
const mochaCommand = `npx mocha ${testDir}/**/*.test.js --timeout 10000`;

// Execute the Mocha command
exec(mochaCommand, async (error, stdout, stderr) => {
  console.log(stdout);
  
  if (stderr) {
    console.error(stderr);
  }
  
  // Clean up database after tests
  try {
    await cleanupDatabase();
    console.log('Test database cleaned up');
  } catch (err) {
    console.error('Error cleaning up database:', err);
  }
  
  // Exit with appropriate code
  process.exit(error ? 1 : 0);
}); 