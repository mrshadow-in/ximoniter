const db = require('../../../backend/config/db');
const assert = require('assert');

function testMetricsTableExists() {
  const info = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='proxmox_metrics'").get();
  assert.ok(info !== undefined, "proxmox_metrics table should exist");
}

function testMetricsColumnsExist() {
  const columns = db.prepare("PRAGMA table_info(proxmox_metrics)").all();
  const columnNames = columns.map(c => c.name);
  
  const expectedColumns = [
    'disk_used', 'disk_total', 'net_in', 'net_out', 'disk_read', 'disk_write'
  ];
  
  for (const col of expectedColumns) {
    assert.ok(columnNames.includes(col), `Column ${col} should exist in proxmox_metrics`);
  }
}

testMetricsTableExists();
testMetricsColumnsExist();
console.log("Task 10.1 DB Test Passed");
