const request = require('supertest');
const app = require('../../../backend/server');
const assert = require('assert');
const jwt = require('jsonwebtoken');
const env = require('../../../backend/config/env');

const token = jwt.sign({ id: 1, role: 'super_admin' }, env.JWT_SECRET);

async function testConfigAPI() {
    console.log("Running Task 7.1 Proxmox Config API Test...");
    
    // Add config
    const res = await request(app)
        .post('/api/proxmox/config')
        .set('Authorization', `Bearer ${token}`)
        .send({ 
            name: 'test-node', 
            host: '10.0.0.10', 
            port: 8006, 
            node: 'pve', 
            token_id: 'root@pam!token', 
            token_secret: 'secret', 
            rejectUnauthorized: false 
        });
        
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert.ok(res.body.success);
    
    // Get config
    const getRes = await request(app)
        .get('/api/proxmox/config')
        .set('Authorization', `Bearer ${token}`);
    
    assert.strictEqual(getRes.status, 200);
    const found = getRes.body.data.find(n => n.name === 'test-node');
    assert.ok(found, "Should find the created test-node");
    assert.strictEqual(found.host, '10.0.0.10');
    
    console.log("Task 7.1 Proxmox Config API Test Passed");
}

if (require.main === module) {
    testConfigAPI().catch(err => { 
        console.error(err); 
        process.exit(1); 
    });
}
