const request = require('supertest');
const app = require('../../../backend/server');
const assert = require('assert');
const jwt = require('jsonwebtoken');
const env = require('../../../backend/config/env');
const proxmoxService = require('../../../backend/services/proxmoxService');
const db = require('../../../backend/config/db');

const token = jwt.sign({ id: 1, role: 'super_admin' }, env.JWT_SECRET);

async function testControllerTestConnection() {
    console.log("Running Task 10.2 Proxmox Test Connection API Test...");

    // 1. Add a dummy config to DB
    db.prepare('DELETE FROM proxmox_nodes WHERE name = ?').run('test-connection-node');
    db.prepare(`INSERT INTO proxmox_nodes (name, host, port, node, token_id, token_secret, reject_unauth) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
        'test-connection-node', '1.2.3.4', 8006, 'pve', 'id', 'secret', 0
    );
    const node = db.prepare('SELECT id FROM proxmox_nodes WHERE name = ?').get('test-connection-node');

    // 2. Mock proxmoxService.testConnection
    const originalTestConnection = proxmoxService.testConnection;
    proxmoxService.testConnection = async (config) => {
        assert.strictEqual(config.host, '1.2.3.4');
        return { success: true, version: '7.4-3' };
    };

    try {
        // 3. Call the API
        const res = await request(app)
            .post(`/api/proxmox/config/${node.id}/test`)
            .set('Authorization', `Bearer ${token}`);

        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.success, true);
        assert.strictEqual(res.body.version, '7.4-3');
        console.log("Task 10.2 API Test Success Case Passed");

        // 4. Test failure case
        proxmoxService.testConnection = async () => {
            throw new Error('Connection refused');
        };

        const failRes = await request(app)
            .post(`/api/proxmox/config/${node.id}/test`)
            .set('Authorization', `Bearer ${token}`);

        assert.strictEqual(failRes.status, 500);
        assert.strictEqual(failRes.body.success, false);
        assert.strictEqual(failRes.body.error, 'Connection refused');
        console.log("Task 10.2 API Test Failure Case Passed");

    } finally {
        // Restore original method
        proxmoxService.testConnection = originalTestConnection;
        // Cleanup DB
        db.prepare('DELETE FROM proxmox_nodes WHERE id = ?').run(node.id);
    }
}

if (require.main === module) {
    testControllerTestConnection().catch(err => {
        console.error(err);
        process.exit(1);
    });
}
