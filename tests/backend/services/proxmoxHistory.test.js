const { test, describe } = require('node:test');
const assert = require('assert');
const proxmoxService = require('../../../backend/services/proxmoxService');
const db = require('../../../backend/config/db');

describe('Proxmox History Service', () => {
    test('should save and retrieve full metrics', async () => {
        db.exec("DELETE FROM proxmox_metrics WHERE node_id = 'pve-full-test'");
        
        const stats = {
            cpu: 0.1,
            mem_used: 1024,
            mem_total: 8192,
            disk_used: 500,
            disk_total: 1000,
            net_in: 50,
            net_out: 25,
            disk_read: 5,
            disk_write: 10
        };

        await proxmoxService.saveMetrics('pve-full-test', stats);
        
        const history = await proxmoxService.getHistory('pve-full-test', 1);
        assert.strictEqual(history.length, 1);
        
        const row = history[0];
        assert.strictEqual(row.cpu, 0.1);
        assert.strictEqual(row.mem_used, 1024);
        assert.strictEqual(row.disk_used, 500);
        assert.strictEqual(row.net_in, 50);
        assert.strictEqual(row.disk_read, 5);
    });

    test('should retrieve history in ASC order', async () => {
        const nodeId = 'pve-order-test';
        db.exec(`DELETE FROM proxmox_metrics WHERE node_id = '${nodeId}'`);
        
        // Use manual inserts to guarantee timestamp difference if resolution is low
        db.prepare(`
            INSERT INTO proxmox_metrics (node_id, timestamp, cpu, mem_used, mem_total) 
            VALUES (?, datetime('now', '-2 minutes'), 0.1, 0, 0)
        `).run(nodeId);
        
        db.prepare(`
            INSERT INTO proxmox_metrics (node_id, timestamp, cpu, mem_used, mem_total) 
            VALUES (?, datetime('now', '-1 minutes'), 0.2, 0, 0)
        `).run(nodeId);
        
        const history = await proxmoxService.getHistory(nodeId, 1);
        assert.strictEqual(history.length, 2, "Should have 2 records");
        assert.strictEqual(history[0].cpu, 0.1, "First record should be 0.1 (older)");
        assert.strictEqual(history[1].cpu, 0.2, "Second record should be 0.2 (newer)");
    });
});
