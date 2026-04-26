const config = require('../../../backend/config/default.json');
const assert = require('assert');

assert.strictEqual(typeof config.sandboxMode, 'boolean', "sandboxMode should be defined as a boolean");
console.log("Task 2.1 Config Test Passed");
