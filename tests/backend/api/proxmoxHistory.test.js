const request = require('supertest');
const app = require('../../../backend/server');
const assert = require('assert');

async function testHistoryAPI() {
    console.log("Running Task 1.3 Refactored API Test...");
    try {
        // Login to get token
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ username: 'admin', password: 'admin_password_2026' });
        const token = loginRes.body.token;
        assert.ok(token, "Login should return a token");

        // Test successful request with token
        const res = await request(app)
            .get('/api/proxmox/pve1/history?hours=1')
            .set('Authorization', `Bearer ${token}`);
        assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
        assert.ok(Array.isArray(res.body.data), "Expected data array");
        assert.strictEqual(res.body.success, true, "Expected success: true");

        // Test validation error (negative hours) with token
        const resInvalid = await request(app)
            .get('/api/proxmox/pve1/history?hours=-1')
            .set('Authorization', `Bearer ${token}`);
        assert.strictEqual(resInvalid.status, 422, `Expected 422 for negative hours, got ${resInvalid.status}`);
        assert.strictEqual(resInvalid.body.success, false);
        assert.strictEqual(resInvalid.body.code, 'VALIDATION_ERROR');

        console.log("Task 1.3 API Test Passed");
    } catch (error) {
        console.error("Task 1.3 API Test Failed:");
        console.error(error);
        process.exitCode = 1;
    }
}

testHistoryAPI();
