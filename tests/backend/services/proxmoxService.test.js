const proxmoxService = require('../../../backend/services/proxmoxService');
const db = require('../../../backend/config/db');
const assert = require('assert');

async function testSaveMetrics() {
  db.exec("DELETE FROM proxmox_metrics"); // Clean slate
  await proxmoxService.saveMetrics('pve1', { cpu: 0.45, memUsedGb: 16, memTotalGb: 64 });
  const row = db.prepare("SELECT * FROM proxmox_metrics WHERE node_id = 'pve1'").get();
  assert.strictEqual(row.cpu, 0.45, "CPU value should match");
  assert.strictEqual(row.mem_used, 16, "Memory used should match");
}

testSaveMetrics().then(() => console.log("Task 1.2 Storage Test Passed")).catch(console.error);
