const Mocha = require('mocha');
const path = require('path');
const dotenv = require('dotenv');

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Create a new Mocha instance
const mocha = new Mocha({
  timeout: 5000
});

// Specify the test files to run
const testFiles = [
  path.join(__dirname, 'api', 'auth.test.js'),
  path.join(__dirname, 'api', 'events.test.js'),
  path.join(__dirname, 'api', 'tickets.test.js'),
  path.join(__dirname, 'api', 'checkin.test.js'),
  path.join(__dirname, 'api', 'discounts.test.js')
];

// Add the test files to mocha
testFiles.forEach(file => {
  mocha.addFile(file);
});

// Run the tests
mocha.run(failures => {
  process.exitCode = failures ? 1 : 0;
}); 