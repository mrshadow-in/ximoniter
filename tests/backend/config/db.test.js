const db = require('../../../backend/config/db');
const assert = require('assert');

function testMetricsTableExists() {
  const info = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='proxmox_metrics'").get();
  assert.ok(info !== undefined, "proxmox_metrics table should exist");
}

testMetricsTableExists();
console.log("Task 1.1 DB Test Passed");
