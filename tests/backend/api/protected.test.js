const request = require('supertest');
const app = require('../../../backend/server');
const assert = require('assert');

async function testProtected() {
    const res = await request(app).get('/api/settings/sandbox');
    assert.strictEqual(res.status, 401, "Should be unauthorized without token");
    console.log("Task 3.4 Protected Route Test Passed");
}
testProtected().catch(err => { console.error(err); process.exitCode = 1; });
