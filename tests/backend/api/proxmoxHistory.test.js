const request = require('supertest');
const app = require('../../../backend/server');
const assert = require('assert');

async function testHistoryAPI() {
    console.log("Running Task 1.3 Refactored API Test...");
    try {
        // Test successful request
        const res = await request(app).get('/api/proxmox/pve1/history?hours=1');
        assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
        assert.ok(Array.isArray(res.body.data), "Expected data array");
        assert.strictEqual(res.body.success, true, "Expected success: true");

        // Test validation error (negative hours)
        const resInvalid = await request(app).get('/api/proxmox/pve1/history?hours=-1');
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
